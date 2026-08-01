import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSeller } from "@/lib/api/middleware";
import { roomTypeSchema } from "@/features/properties/schemas";
import { badRequest, forbidden, noContent, ok, serverError, unauthorized } from "@/lib/api/response";
import { syncPropertyPriceFromRoomTypes } from "@/features/properties/server/mutations";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";

async function verifyRoomTypeOwnership(
  supabase: SupabaseClient<Database>,
  propertyId: string,
  rtId: string,
  sellerId: string
) {
  const { data } = await supabase
    .from("room_types")
    .select("id, property_id, properties!property_id(seller_id)")
    .eq("id", rtId)
    .eq("property_id", propertyId)
    .single();

  if (!data) return false;
  const prop = data.properties as unknown as { seller_id: string } | null;
  return prop?.seller_id === sellerId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rtId: string }> }
) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { id, rtId } = await params;

  const isOwner = await verifyRoomTypeOwnership(ctx.supabase, id, rtId, ctx.user.id);
  if (!isOwner) return forbidden("Not your room type");

  const body = await req.json().catch(() => null);
  const parsed = roomTypeSchema.partial().safeParse(body);
  if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

  const { data: updated, error } = await ctx.supabase
    .from("room_types")
    .update(parsed.data)
    .eq("id", rtId)
    .select("*")
    .single();

  if (error) {
    console.error("room_type update error", error);
    return serverError("Failed to update room type");
  }

  await syncPropertyPriceFromRoomTypes(ctx.supabase, id);

  return ok(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rtId: string }> }
) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { id, rtId } = await params;

  const isOwner = await verifyRoomTypeOwnership(ctx.supabase, id, rtId, ctx.user.id);
  if (!isOwner) return forbidden("Not your room type");

  const { error } = await ctx.supabase
    .from("room_types")
    .delete()
    .eq("id", rtId);

  if (error) {
    console.error("room_type delete error", error);
    return serverError("Failed to delete room type");
  }

  await syncPropertyPriceFromRoomTypes(ctx.supabase, id);

  return noContent();
}

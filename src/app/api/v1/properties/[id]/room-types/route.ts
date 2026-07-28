import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSeller } from "@/lib/api/middleware";
import { roomTypeSchema } from "@/features/properties/schemas";
import { badRequest, created, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/api/response";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";

async function verifyOwnership(supabase: SupabaseClient<Database>, propertyId: string, sellerId: string) {
  const { data } = await supabase
    .from("properties")
    .select("id, seller_id")
    .eq("id", propertyId)
    .is("deleted_at", null)
    .single();
  return data?.seller_id === sellerId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { id } = await params;

  const isOwner = await verifyOwnership(ctx.supabase, id, ctx.user.id);
  if (!isOwner) return forbidden("Not your property");

  const { data, error } = await ctx.supabase
    .from("room_types")
    .select("*")
    .eq("property_id", id)
    .order("sharing_count", { ascending: true });

  if (error) {
    console.error("room_types fetch error", error);
    return serverError("Failed to fetch room types");
  }

  return ok(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { id } = await params;

  // Verify ownership
  const { data: property } = await ctx.supabase
    .from("properties")
    .select("id, seller_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!property) return notFound("Property not found");
  if (property.seller_id !== ctx.user.id) return forbidden("Not your property");

  const body = await req.json().catch(() => null);
  const parsed = roomTypeSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

  const { data: roomType, error } = await ctx.supabase
    .from("room_types")
    .insert({ property_id: id, ...parsed.data })
    .select("*")
    .single();

  if (error) {
    console.error("room_type insert error", error);
    return serverError("Failed to create room type");
  }

  return created(roomType);
}

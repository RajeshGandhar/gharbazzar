import { NextRequest } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSeller } from "@/lib/api/middleware";
import { badRequest, forbidden, noContent, ok, serverError, unauthorized } from "@/lib/api/response";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";

const imageUpdateSchema = z.object({
  is_cover: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

async function verifyImageOwnership(
  supabase: SupabaseClient<Database>,
  propertyId: string,
  imgId: string,
  sellerId: string
) {
  const { data } = await supabase
    .from("property_images")
    .select("id, property_id, properties!property_id(seller_id)")
    .eq("id", imgId)
    .eq("property_id", propertyId)
    .single();

  if (!data) return false;
  const prop = data.properties as unknown as { seller_id: string } | null;
  return prop?.seller_id === sellerId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imgId: string }> }
) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { id, imgId } = await params;

  const isOwner = await verifyImageOwnership(ctx.supabase, id, imgId, ctx.user.id);
  if (!isOwner) return forbidden("Not your image");

  const body = await req.json().catch(() => null);
  const parsed = imageUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

  // If setting as cover, unset existing covers
  if (parsed.data.is_cover === true) {
    await ctx.supabase
      .from("property_images")
      .update({ is_cover: false })
      .eq("property_id", id);
  }

  const { data: updated, error } = await ctx.supabase
    .from("property_images")
    .update(parsed.data)
    .eq("id", imgId)
    .select("id, path, is_cover, position")
    .single();

  if (error) {
    console.error("image update error", error);
    return serverError("Failed to update image");
  }

  return ok(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imgId: string }> }
) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { id, imgId } = await params;

  const isOwner = await verifyImageOwnership(ctx.supabase, id, imgId, ctx.user.id);
  if (!isOwner) return forbidden("Not your image");

  const { error } = await ctx.supabase
    .from("property_images")
    .delete()
    .eq("id", imgId);

  if (error) {
    console.error("image delete error", error);
    return serverError("Failed to delete image");
  }

  return noContent();
}

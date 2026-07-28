import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSeller } from "@/lib/api/middleware";
import { badRequest, created, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/api/response";

export const runtime = "nodejs";

const imageInsertSchema = z.object({
  path: z.string().min(1),
  is_cover: z.boolean().default(false),
  position: z.number().int().min(0).default(0),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { id } = await params;

  // Verify property belongs to seller
  const { data: property } = await ctx.supabase
    .from("properties")
    .select("id, seller_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!property) return notFound("Property not found");
  if (property.seller_id !== ctx.user.id) return forbidden("Not your property");

  const { data, error } = await ctx.supabase
    .from("property_images")
    .select("id, path, thumbnail_path, is_cover, position")
    .eq("property_id", id)
    .order("position", { ascending: true });

  if (error) {
    console.error("images fetch error", error);
    return serverError("Failed to fetch images");
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

  // Verify property belongs to seller
  const { data: property } = await ctx.supabase
    .from("properties")
    .select("id, seller_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!property) return notFound("Property not found");
  if (property.seller_id !== ctx.user.id) return forbidden("Not your property");

  const body = await req.json().catch(() => null);
  const parsed = imageInsertSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

  const { path, is_cover, position } = parsed.data;

  // If this is set as cover, unset all existing covers first
  if (is_cover) {
    await ctx.supabase
      .from("property_images")
      .update({ is_cover: false })
      .eq("property_id", id);
  }

  const { data: image, error } = await ctx.supabase
    .from("property_images")
    .insert({ property_id: id, path, is_cover, position })
    .select("id, path, is_cover, position")
    .single();

  if (error) {
    console.error("image insert error", error);
    return serverError("Failed to register image");
  }

  return created({ id: image.id, path: image.path, is_cover: image.is_cover, position: image.position });
}

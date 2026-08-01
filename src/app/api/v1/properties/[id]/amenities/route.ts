import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSeller } from "@/lib/api/middleware";
import { updateAmenitiesSchema } from "@/features/properties/schemas";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/api/response";
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
    .from("property_amenities")
    .select("amenity_id")
    .eq("property_id", id);

  if (error) {
    console.error("property_amenities fetch error", error);
    return serverError("Failed to fetch amenities");
  }

  return ok(data.map((row) => row.amenity_id));
}

// ---------------------------------------------------------------------------
// PUT /api/v1/properties/:id/amenities
// Full-replace: deletes the property's existing amenity links and inserts
// the submitted set. Matches the "delete all then insert" client contract
// already used by the seller listing wizard (step-details.tsx).
// ---------------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { id } = await params;

  const property = await ctx.supabase
    .from("properties")
    .select("id, seller_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!property.data) return notFound("Property not found");
  if (property.data.seller_id !== ctx.user.id) return forbidden("Not your property");

  const body = await req.json().catch(() => null);
  const parsed = updateAmenitiesSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

  const { error: deleteError } = await ctx.supabase
    .from("property_amenities")
    .delete()
    .eq("property_id", id);

  if (deleteError) {
    console.error("property_amenities delete error", deleteError);
    return serverError("Failed to update amenities");
  }

  if (parsed.data.amenity_ids.length > 0) {
    const { error: insertError } = await ctx.supabase
      .from("property_amenities")
      .insert(parsed.data.amenity_ids.map((amenity_id) => ({ property_id: id, amenity_id })));

    if (insertError) {
      console.error("property_amenities insert error", insertError);
      return serverError("Failed to update amenities");
    }
  }

  return ok({ amenity_ids: parsed.data.amenity_ids });
}

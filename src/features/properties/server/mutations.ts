import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreatePropertyInput, UpdatePropertyInput } from "../schemas";

// ---------------------------------------------------------------------------
// Property mutations — called from Route Handlers
// ---------------------------------------------------------------------------

/** Generate a URL-safe slug from the title + city + random suffix */
function makeSlug(title: string, city: string): string {
  const base = `${title} ${city}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function createProperty(
  sellerId: string,
  input: CreatePropertyInput,
  cityName: string
) {
  const supabase = await createClient();

  const slug = makeSlug(input.title, cityName);
  // expires 60 days after going live (set on approval)
  const expires_at = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("properties")
    .insert({
      seller_id: sellerId,
      slug,
      expires_at,
      ...input,
    })
    .select("id, slug")
    .single();

  return { data, error };
}

export async function updateProperty(
  propertyId: string,
  sellerId: string,
  input: UpdatePropertyInput
) {
  const supabase = await createClient();

  // RLS: seller can only update own properties; triggers handle slug history
  const { data, error } = await supabase
    .from("properties")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", propertyId)
    .eq("seller_id", sellerId)
    .is("deleted_at", null)
    .select("id, slug")
    .single();

  return { data, error };
}

/** Soft-delete — leaves inquiries & analytics intact */
export async function deleteProperty(propertyId: string, sellerId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ deleted_at: new Date().toISOString(), status: "inactive" })
    .eq("id", propertyId)
    .eq("seller_id", sellerId)
    .is("deleted_at", null);
  return { error };
}

/** Admin: approve or reject */
export async function setApprovalStatus(
  propertyId: string,
  approval_status: "approved" | "rejected",
  reviewerId: string,
  rejection_reason?: string
) {
  const supabase = await createAdminClient();

  const update: Record<string, unknown> = {
    approval_status,
    approved_by: reviewerId,
    approved_at: new Date().toISOString(),
  };

  if (approval_status === "approved") {
    update.status = "active";
    update.published_at = new Date().toISOString();
    update.expires_at = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  }

  if (approval_status === "rejected") {
    update.status = "inactive";
    update.rejection_reason = rejection_reason ?? null;
  }

  const { data, error } = await supabase
    .from("properties")
    .update(update as import("@/types/database.types").UpdateTables<"properties">)
    .eq("id", propertyId)
    .select("id, slug, approval_status")
    .single();

  return { data, error };
}

/** Record a contact reveal — idempotent (upsert), returns seller phone */
export async function revealContact(
  userId: string,
  propertyId: string
): Promise<{ phone: string | null; error: Error | null }> {
  const supabase = await createClient();

  // 1. Get property → seller
  const { data: prop, error: propErr } = await supabase
    .from("properties")
    .select("seller_id")
    .eq("id", propertyId)
    .eq("status", "active")
    .single();

  if (propErr || !prop) return { phone: null, error: propErr };

  // 2. Record the reveal (upsert = idempotent for repeat views)
  const { error: revealErr } = await supabase
    .from("contact_reveals")
    .upsert(
      { user_id: userId, property_id: propertyId, seller_id: prop.seller_id },
      { onConflict: "user_id,property_id", ignoreDuplicates: true }
    );

  if (revealErr) return { phone: null, error: revealErr };

  // 3. Get seller phone (via profiles — sellers don't store phone directly)
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", prop.seller_id)
    .single();

  // 4. Enqueue a listing_event for analytics (fire-and-forget, use admin)
  const admin = createAdminClient();
  void admin.from("listing_events").insert({
    property_id: propertyId,
    user_id: userId,
    event_type: "reveal",
  });

  return { phone: profile?.phone ?? null, error: profileErr };
}

/** Renew an expired/expiring listing by 60 more days */
export async function renewListing(propertyId: string, sellerId: string) {
  const supabase = await createClient();
  const newExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("properties")
    .update({ expires_at: newExpiry, status: "active" })
    .eq("id", propertyId)
    .eq("seller_id", sellerId)
    .is("deleted_at", null)
    .select("id, expires_at")
    .single();

  return { data, error };
}

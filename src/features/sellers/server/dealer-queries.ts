import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaginationParams } from "@/lib/api/pagination";
import { toRange } from "@/lib/api/pagination";

// ---------------------------------------------------------------------------
// Dealer-specific server queries (seller dashboard)
// ---------------------------------------------------------------------------

export async function getDealerDashboardData(sellerId: string) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  // Fetch all at once for performance
  const [listingCounts, newLeadsCount, recentLeads, recentListings, propertyIds] =
    await Promise.all([
      supabase
        .from("properties")
        .select("status, approval_status")
        .eq("seller_id", sellerId)
        .is("deleted_at", null),

      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId)
        .eq("status", "new"),

      supabase
        .from("inquiries")
        .select(
          "id, name, phone, status, source, created_at, properties!property_id(title, slug)"
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("properties")
        .select(
          "id, slug, title, price, purpose, status, approval_status, created_at, property_images(path, is_cover)"
        )
        .eq("seller_id", sellerId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(3),

      // Get property IDs for event stats
      supabase
        .from("properties")
        .select("id")
        .eq("seller_id", sellerId)
        .is("deleted_at", null),
    ]);

  // Event stats: views + reveals in last 30 days
  let views = 0;
  let reveals = 0;
  const ids = (propertyIds.data ?? []).map((p) => p.id);

  if (ids.length > 0) {
    const { data: events } = await adminSupabase
      .from("listing_events")
      .select("event_type")
      .in("property_id", ids)
      .gte("created_at", thirtyDaysAgo);

    for (const e of events ?? []) {
      if (e.event_type === "view") views++;
      if (e.event_type === "reveal") reveals++;
    }
  }

  // Calculate listing status breakdown
  const listings = listingCounts.data ?? [];
  const active = listings.filter(
    (l) => l.status === "active" && l.approval_status === "approved"
  ).length;
  const draft = listings.filter((l) => l.status === "draft").length;
  const pending = listings.filter((l) => l.approval_status === "pending").length;
  const expired = listings.filter((l) => l.status === "expired").length;
  const rejected = listings.filter((l) => l.approval_status === "rejected").length;

  return {
    listing_counts: { active, draft, pending, expired, rejected, total: listings.length },
    new_leads_count: newLeadsCount.count ?? 0,
    recent_leads: (recentLeads.data ?? []) as unknown as Array<{
      id: string;
      name: string;
      phone: string;
      status: string;
      source: string;
      created_at: string;
      properties: { title: string; slug: string } | null;
    }>,
    recent_listings: recentListings.data ?? [],
    event_stats: { views, reveals },
  };
}

// Get seller's KYC documents
export async function getSellerKycDocs(sellerId: string) {
  const supabase = await createClient();
  return supabase
    .from("kyc_documents")
    .select("id, doc_type, file_path, status, remarks, created_at")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
}

// Get seller's own full profile (joined with profile + city)
export async function getSellerOwnProfile(userId: string) {
  const supabase = await createClient();
  return supabase
    .from("sellers")
    .select(
      `
      id, slug, seller_type, business_name, about, experience_years,
      office_address, city_id, whatsapp_number, website, logo_url,
      rera_number, kyc_status, is_verified, verified_at, avg_rating, total_reviews,
      profiles!id(full_name, email, phone, avatar_url, role),
      cities!city_id(id, name, slug)
    `
    )
    .eq("id", userId)
    .single();
}

// Get seller's listings with rejection reasons (for dealer listings page)
export async function listDealerListings(
  sellerId: string,
  pagination: PaginationParams,
  status?: string
) {
  const supabase = await createClient();
  const { from, to } = toRange(pagination);

  let q = supabase
    .from("properties")
    .select(
      `
      id, slug, title, purpose, price, status, approval_status, rejection_reason,
      views_count, favorites_count, inquiries_count, quality_score,
      published_at, expires_at, created_at, updated_at,
      cities!city_id ( name ), areas!area_id ( name ),
      property_images ( thumbnail_path, is_cover )
    `,
      { count: "exact" }
    )
    .eq("seller_id", sellerId)
    .is("deleted_at", null);

  if (status) q = q.eq("status", status as never);

  const { data, count, error } = await q
    .order("updated_at", { ascending: false })
    .range(from, to);

  return { data, count: count ?? 0, error };
}

// Get all cities for dropdowns
export async function getCitiesForSelect() {
  const supabase = createAdminClient();
  return supabase
    .from("cities")
    .select("id, name, slug, state")
    .eq("is_active", true)
    .order("name");
}

// Get areas by city
export async function getAreasByCity(cityId: number) {
  const supabase = createAdminClient();
  return supabase
    .from("areas")
    .select("id, name, slug")
    .eq("city_id", cityId)
    .eq("is_active", true)
    .order("name");
}

// Get property types for wizard
export async function getPropertyTypesForSelect() {
  const supabase = createAdminClient();
  return supabase
    .from("property_types")
    .select("id, name, slug, category")
    .eq("is_active", true)
    .order("position");
}

// Get amenities for wizard
export async function getAmenitiesForSelect() {
  const supabase = createAdminClient();
  return supabase
    .from("amenities")
    .select("id, name, slug, icon")
    .eq("is_active", true)
    .order("name");
}

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaginationParams } from "@/lib/api/pagination";
import { toRange } from "@/lib/api/pagination";

// ---------------------------------------------------------------------------
// Seller public profile (directory pages)
// ---------------------------------------------------------------------------
export async function getSellerBySlug(slug: string) {
  const supabase = await createClient();
  return supabase
    .from("sellers")
    .select(`
      id, slug, seller_type, business_name, about, experience_years,
      office_address, whatsapp_number, website, logo_url, cover_image_url,
      is_verified, verified_at, avg_rating, total_reviews, created_at,
      city_id,
      profiles!id ( full_name, avatar_url, created_at ),
      cities!city_id ( id, name, slug )
    `)
    .eq("slug", slug)
    .single();
}

export async function listSellers(opts: {
  citySlug?: string;
  sellerType?: string;
  pagination: PaginationParams;
}) {
  const supabase = await createClient();
  const { from, to } = toRange(opts.pagination);

  let q = supabase
    .from("sellers")
    .select(`
      id, slug, seller_type, business_name, logo_url,
      is_verified, avg_rating, total_reviews, city_id,
      profiles!id ( full_name, avatar_url ),
      cities!city_id ( name, slug )
    `, { count: "exact" });

  if (opts.sellerType) {
    q = q.eq("seller_type", opts.sellerType as never);
  }

  if (opts.citySlug) {
    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", opts.citySlug)
      .single();
    if (city) q = q.eq("city_id", city.id);
  }

  const { data, count, error } = await q
    .order("is_verified", { ascending: false })
    .order("avg_rating", { ascending: false })
    .range(from, to);

  return { data, count: count ?? 0, error };
}

// ---------------------------------------------------------------------------
// Current user: saved searches
// ---------------------------------------------------------------------------
export async function listSavedSearches(userId: string) {
  const supabase = await createClient();
  return supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function getNotifications(userId: string, pagination: PaginationParams) {
  const supabase = await createClient();
  const { from, to } = toRange(pagination);
  return supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);
}

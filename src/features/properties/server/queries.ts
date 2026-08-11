import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaginationParams } from "@/lib/api/pagination";
import { toRange } from "@/lib/api/pagination";
import type { PropertyCardData } from "@/components/properties/property-card";
import type { LandingPropertyData } from "@/features/properties/adapters/to-premium-card";

// ---------------------------------------------------------------------------
// Listing card shape — used by browse / search pages
// ---------------------------------------------------------------------------
export const LISTING_CARD_COLUMNS = `
  id, slug, title, purpose, price, price_per_sqft, is_negotiable,
  area_unit, built_up_area, bedrooms, bathrooms, furnishing,
  city_id, area_id, address, latitude, longitude,
  is_featured, is_premium, is_sponsored,
  views_count, favorites_count, inquiries_count,
  rental_kind, gender_policy, available_from,
  quality_score, status, approval_status, published_at, expires_at, created_at,
  seller_id,
  cities!city_id ( id, name, slug ),
  areas!area_id ( id, name, slug ),
  property_types!property_type_id ( id, name, slug, category ),
  property_images ( path, thumbnail_path, is_cover, position )
` as const;

// ---------------------------------------------------------------------------
// Full listing detail shape
// ---------------------------------------------------------------------------
export const LISTING_DETAIL_COLUMNS = `
  ${LISTING_CARD_COLUMNS},
  description, landmark, pincode, state,
  carpet_area, plot_area, balconies, kitchens, floor_number, total_floors,
  parking_spaces, facing, property_age_years, construction_status,
  possession_date, ownership, youtube_url, virtual_tour_url, brochure_path,
  seo_title, seo_description, og_image_url,
  lock_in_months, curfew_time, has_warden, mess_type, preferred_tenants,
  approved_at, updated_at,
  sellers!seller_id (
    id, slug, business_name, about, whatsapp_number, logo_url,
    is_verified, avg_rating, total_reviews, seller_type,
    profiles!id ( full_name, avatar_url )
  ),
  property_amenities ( amenity_id, amenities ( id, name, slug, icon ) ),
  nearby_places ( id, kind, name, distance_km ),
  room_types ( id, name, sharing_count, monthly_rent_per_bed, security_deposit,
               is_ac, meal_plan, attached_bathroom, total_beds, available_beds, is_active ),
  property_universities (
    computed_distance_m,
    universities ( id, name, slug, institution_type, logo_url )
  ),
  price_history ( old_price, new_price, changed_at )
` as const;

// ---------------------------------------------------------------------------
// Browse / list queries
// ---------------------------------------------------------------------------

export interface ListPropertiesOptions {
  purpose?: "sale" | "rent" | "lease";
  cityId?: number;
  areaId?: number;
  rentalKind?: "standard" | "student";
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyTypeId?: number;
  sellerId?: string;
  status?: "active" | "draft" | "inactive" | "expired";
  pagination: PaginationParams;
  sort?: "price_asc" | "price_desc" | "newest" | "popular";
}

export async function listProperties(opts: ListPropertiesOptions) {
  const supabase = await createClient();
  const { from, to } = toRange(opts.pagination);

  let query = supabase
    .from("properties")
    .select(LISTING_CARD_COLUMNS, { count: "exact" })
    .is("deleted_at", null);

  if (opts.purpose)         query = query.eq("purpose", opts.purpose);
  if (opts.cityId)          query = query.eq("city_id", opts.cityId);
  if (opts.areaId)          query = query.eq("area_id", opts.areaId);
  if (opts.rentalKind)      query = query.eq("rental_kind", opts.rentalKind);
  if (opts.minPrice)        query = query.gte("price", opts.minPrice);
  if (opts.maxPrice)        query = query.lte("price", opts.maxPrice);
  if (opts.bedrooms !== undefined) query = query.eq("bedrooms", opts.bedrooms);
  if (opts.propertyTypeId)  query = query.eq("property_type_id", opts.propertyTypeId);
  if (opts.sellerId)        query = query.eq("seller_id", opts.sellerId);

  // Default to live listings; admin may override
  if (opts.status) {
    query = query.eq("status", opts.status);
  } else {
    query = query.eq("status", "active").eq("approval_status", "approved");
  }

  // Sorting
  switch (opts.sort) {
    case "price_asc":   query = query.order("price", { ascending: true });  break;
    case "price_desc":  query = query.order("price", { ascending: false }); break;
    case "popular":     query = query.order("views_count", { ascending: false }); break;
    default:            query = query.order("is_featured", { ascending: false })
                                     .order("published_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);
  return { data, count: count ?? 0, error };
}

// ---------------------------------------------------------------------------
// Single property by slug (public — checks status)
// ---------------------------------------------------------------------------
export async function getPropertyBySlug(slug: string) {
  const supabase = await createClient();
  return supabase
    .from("properties")
    .select(LISTING_DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("status", "active")
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .single();
}

// ---------------------------------------------------------------------------
// Single property by ID (admin/seller — no status filter)
// ---------------------------------------------------------------------------
export async function getPropertyById(id: string) {
  const supabase = await createClient();
  return supabase
    .from("properties")
    .select(LISTING_DETAIL_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .single();
}

// ---------------------------------------------------------------------------
// Similar properties (same city + purpose, ±50% price band, exclude self)
// ---------------------------------------------------------------------------
export async function getSimilarProperties(opts: {
  excludeId: string;
  cityId: number;
  purpose: "sale" | "rent" | "lease";
  price: number;
  limit?: number;
}): Promise<PropertyCardData[]> {
  const supabase = createAdminClient();
  const band = 0.5;
  const min = Math.round(opts.price * (1 - band));
  const max = Math.round(opts.price * (1 + band));

  const { data } = await supabase
    .from("properties")
    .select(LISTING_CARD_COLUMNS)
    .eq("city_id", opts.cityId)
    .eq("purpose", opts.purpose)
    .eq("status", "active")
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .neq("id", opts.excludeId)
    .gte("price", min)
    .lte("price", max)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? 4);

  return (data ?? []) as unknown as PropertyCardData[];
}

// ---------------------------------------------------------------------------
// Live platform stats for homepage
// ---------------------------------------------------------------------------
export async function getPlatformStats() {
  const supabase = createAdminClient();
  const [listings, sellers, cities] = await Promise.all([
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .eq("approval_status", "approved")
      .is("deleted_at", null),
    supabase
      .from("sellers")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true),
    supabase
      .from("cities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
  ]);
  return {
    listings: listings.count ?? 0,
    verifiedSellers: sellers.count ?? 0,
    cities: cities.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Live listing counts per city (for homepage city tiles)
// One indexed COUNT per city — cheap, and the homepage caches for 10 minutes.
// Counts are only ever rendered when > 0; we never invent inventory.
// ---------------------------------------------------------------------------
export async function getCityListingCounts(
  cityIds: number[]
): Promise<Record<number, number>> {
  if (cityIds.length === 0) return {};
  const supabase = createAdminClient();
  const results = await Promise.all(
    cityIds.map(async (cityId) => {
      const { count } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("city_id", cityId)
        .eq("status", "active")
        .eq("approval_status", "approved")
        .is("deleted_at", null);
      return [cityId, count ?? 0] as const;
    })
  );
  return Object.fromEntries(results);
}

// ---------------------------------------------------------------------------
// Live listing counts per property type (for the homepage category rail).
// Same contract as getCityListingCounts: counts are only ever rendered when
// greater than zero, so an empty catalogue shows no number rather than "0".
// ---------------------------------------------------------------------------
export async function getPropertyTypeCounts(
  typeIds: number[]
): Promise<Record<number, number>> {
  if (typeIds.length === 0) return {};
  const supabase = createAdminClient();
  const results = await Promise.all(
    typeIds.map(async (typeId) => {
      const { count } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("property_type_id", typeId)
        .eq("status", "active")
        .eq("approval_status", "approved")
        .is("deleted_at", null);
      return [typeId, count ?? 0] as const;
    })
  );
  return Object.fromEntries(results);
}

// ---------------------------------------------------------------------------
// Hero spotlight — newest live listing that actually has a photo.
// The inner join on property_images guarantees the hero never renders an
// empty frame; callers fall back to the designed composition when null.
// ---------------------------------------------------------------------------
export async function getSpotlightProperty(): Promise<PropertyCardData | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select(`
      id, slug, title, price, purpose, city_id, area_id, bedrooms,
      built_up_area, area_unit, rental_kind, gender_policy, is_featured, is_verified, published_at,
      cities(name, slug),
      areas(name, slug),
      property_images!inner(path, thumbnail_path, is_cover, position)
    `)
    .eq("status", "active")
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as unknown as PropertyCardData) ?? null;
}

// ---------------------------------------------------------------------------
// Landing-page listings.
// Same filters as getFeaturedProperties, but also selects bathrooms and the
// property-type name that the premium card displays. Kept separate so the
// existing callers of getFeaturedProperties keep their narrower payload.
// Featured first, then newest — so a curated listing leads when one exists.
// ---------------------------------------------------------------------------
export async function getLandingProperties(
  limit = 6
): Promise<LandingPropertyData[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select(`
      id, slug, title, price, purpose, city_id, area_id, bedrooms, bathrooms,
      built_up_area, area_unit, rental_kind, gender_policy, is_featured, is_verified, published_at,
      cities(name, slug),
      areas(name, slug),
      property_types(name),
      property_images(path, thumbnail_path, is_cover, position)
    `)
    .eq("status", "active")
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as LandingPropertyData[];
}

// ---------------------------------------------------------------------------
// Featured properties (for homepage)
// ---------------------------------------------------------------------------
export async function getFeaturedProperties(limit = 4): Promise<PropertyCardData[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select(`
      id, slug, title, price, purpose, city_id, area_id, bedrooms,
      built_up_area, area_unit, rental_kind, gender_policy, is_featured, is_verified, published_at,
      cities(name, slug),
      areas(name, slug),
      property_images(path, thumbnail_path, is_cover, position)
    `)
    .eq("status", "active")
    .eq("approval_status", "approved")
    .eq("is_featured", true)
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as PropertyCardData[];
}

// ---------------------------------------------------------------------------
// Slug history lookup (for 301 redirects)
// ---------------------------------------------------------------------------
export async function resolveOldSlug(oldSlug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("property_slugs")
    .select("property_id, properties!property_id ( slug )")
    .eq("old_slug", oldSlug)
    .single();
  return data;
}

// ---------------------------------------------------------------------------
// Student housing: properties near a university
// ---------------------------------------------------------------------------
export async function listStudentProperties(opts: {
  universityId?: number;
  cityId?: number;
  maxDistance?: number; // metres
  genderPolicy?: string;
  pagination: PaginationParams;
}) {
  const supabase = await createClient();
  const { from, to } = toRange(opts.pagination);

  if (opts.universityId) {
    // Filter via property_universities junction
    const { data: links, error: linkErr } = await supabase
      .from("property_universities")
      .select("property_id, computed_distance_m")
      .eq("university_id", opts.universityId)
      .lte("computed_distance_m", opts.maxDistance ?? 5000)
      .order("computed_distance_m", { ascending: true })
      .limit(500);

    if (linkErr || !links?.length) return { data: [], count: 0, error: linkErr };

    // PostgREST does not preserve .in() array order, so re-apply the
    // distance order client-side after the fetch (rather than discarding
    // it, as this previously did — see rest of the query below).
    const distanceById = new Map(links.map((l) => [l.property_id, l.computed_distance_m]));
    const ids = links.map((l) => l.property_id);
    let q = supabase
      .from("properties")
      .select(LISTING_CARD_COLUMNS, { count: "exact" })
      .in("id", ids)
      .eq("rental_kind", "student")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .is("deleted_at", null);

    if (opts.genderPolicy) q = q.eq("gender_policy", opts.genderPolicy as import("@/types/database.types").GenderPolicy);

    const { data, count, error } = await q.range(from, to);
    const sorted = data
      ? [...data].sort(
          (a, b) => (distanceById.get(a.id) ?? Infinity) - (distanceById.get(b.id) ?? Infinity)
        )
      : data;
    return { data: sorted, count: count ?? 0, error };
  }

  // No university filter — city-level student listings
  let q = supabase
    .from("properties")
    .select(LISTING_CARD_COLUMNS, { count: "exact" })
    .eq("rental_kind", "student")
    .eq("status", "active")
    .eq("approval_status", "approved")
    .is("deleted_at", null);

  if (opts.cityId)       q = q.eq("city_id", opts.cityId);
  if (opts.genderPolicy) q = q.eq("gender_policy", opts.genderPolicy as import("@/types/database.types").GenderPolicy);

  const { data, count, error } = await q
    .order("is_featured", { ascending: false })
    .order("quality_score", { ascending: false })
    .range(from, to);

  return { data, count: count ?? 0, error };
}

// ---------------------------------------------------------------------------
// Admin: listing approval queue
// ---------------------------------------------------------------------------
export async function listPendingApprovals(pagination: PaginationParams) {
  const supabase = await createAdminClient();
  const { from, to } = toRange(pagination);
  return supabase
    .from("properties")
    .select(`
      id, title, slug, purpose, price, city_id, area_id, created_at,
      seller_id, status, approval_status, quality_score,
      sellers!seller_id ( id, business_name, seller_type ),
      cities!city_id ( name )
    `, { count: "exact" })
    .eq("approval_status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .range(from, to);
}

// ---------------------------------------------------------------------------
// Seller: own listings
// ---------------------------------------------------------------------------
export async function listSellerProperties(
  sellerId: string,
  pagination: PaginationParams,
  status?: string
) {
  const supabase = await createClient();
  const { from, to } = toRange(pagination);

  let q = supabase
    .from("properties")
    .select(`
      id, slug, title, purpose, price, status, approval_status,
      views_count, favorites_count, inquiries_count, quality_score,
      published_at, expires_at, created_at, updated_at,
      cities!city_id ( name ), areas!area_id ( name ),
      property_images ( thumbnail_path, is_cover )
    `, { count: "exact" })
    .eq("seller_id", sellerId)
    .is("deleted_at", null);

  if (status) q = q.eq("status", status as never);

  const { data, count, error } = await q
    .order("updated_at", { ascending: false })
    .range(from, to);

  return { data, count: count ?? 0, error };
}

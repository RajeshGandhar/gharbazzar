import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SearchInput } from "../schemas";
import { LISTING_CARD_COLUMNS } from "@/features/properties/server/queries";
import { toRange } from "@/lib/api/pagination";

// ---------------------------------------------------------------------------
// Full-text + filter search over active listings
// ---------------------------------------------------------------------------
export async function searchProperties(input: SearchInput) {
  const supabase = await createClient();
  const { from, to } = toRange({ page: input.page, perPage: input.per_page });

  let query = supabase
    .from("properties")
    .select(LISTING_CARD_COLUMNS, { count: "exact" })
    .eq("status", "active")
    .eq("approval_status", "approved")
    .is("deleted_at", null);

  // Full-text search on the generated tsvector column
  if (input.q) {
    query = query.textSearch("fts", input.q, {
      type: "websearch",
      config: "english",
    });
  }

  // Filters
  if (input.purpose)       query = query.eq("purpose", input.purpose);
  if (input.min_price)     query = query.gte("price", input.min_price);
  if (input.max_price)     query = query.lte("price", input.max_price);
  if (input.bedrooms !== undefined) query = query.eq("bedrooms", input.bedrooms);
  if (input.rental_kind)   query = query.eq("rental_kind", input.rental_kind);
  if (input.gender_policy) query = query.eq("gender_policy", input.gender_policy);
  if (input.furnishing)    query = query.eq("furnishing", input.furnishing);

  // City / area by slug (need to join)
  if (input.city) {
    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", input.city)
      .single();
    if (city) query = query.eq("city_id", city.id);
  }

  if (input.area) {
    const { data: area } = await supabase
      .from("areas")
      .select("id")
      .eq("slug", input.area)
      .single();
    if (area) query = query.eq("area_id", area.id);
  }

  if (input.property_type) {
    const { data: ptype } = await supabase
      .from("property_types")
      .select("id")
      .eq("slug", input.property_type)
      .single();
    if (ptype) query = query.eq("property_type_id", ptype.id);
  }

  // University proximity filter
  if (input.university) {
    const { data: uni } = await supabase
      .from("universities")
      .select("id")
      .eq("slug", input.university)
      .single();

    if (uni) {
      const { data: links } = await supabase
        .from("property_universities")
        .select("property_id")
        .eq("university_id", uni.id)
        .lte("computed_distance_m", input.max_distance ?? 5000)
        .order("computed_distance_m", { ascending: true });

      if (links?.length) {
        query = query.in("id", links.map((l) => l.property_id));
      } else {
        // No results near this university
        return { data: [], count: 0, error: null };
      }
    }
  }

  // Sort
  switch (input.sort) {
    case "price_asc":  query = query.order("price", { ascending: true });  break;
    case "price_desc": query = query.order("price", { ascending: false }); break;
    case "popular":    query = query.order("views_count", { ascending: false }); break;
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);
  return { data, count: count ?? 0, error };
}

// ---------------------------------------------------------------------------
// Record search analytics (fire-and-forget via admin client)
// ---------------------------------------------------------------------------
export async function recordSearchEvent(params: {
  userId?: string;
  sessionId?: string;
  purpose?: string;
  cityId?: number;
  areaId?: number;
  filters: Record<string, unknown>;
  resultCount: number;
}) {
  const admin = createAdminClient();
  await admin.from("search_events").insert({
    user_id: params.userId ?? null,
    session_id: params.sessionId ?? null,
    purpose: (params.purpose as never) ?? null,
    city_id: params.cityId ?? null,
    area_id: params.areaId ?? null,
    filters: params.filters as import("@/types/database.types").Json | undefined,
    result_count: params.resultCount,
  });
}

// ---------------------------------------------------------------------------
// University typeahead / listing
// ---------------------------------------------------------------------------
export async function listUniversities(opts: {
  citySlug?: string;
  institutionType?: string;
  q?: string;
}) {
  const supabase = await createClient();

  let q = supabase
    .from("universities")
    .select(`
      id, name, slug, aliases, institution_type, logo_url, website,
      cities!city_id ( id, name, slug )
    `)
    .eq("is_active", true);

  if (opts.citySlug) {
    const { data: city } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", opts.citySlug)
      .single();
    if (city) q = q.eq("city_id", city.id);
  }

  if (opts.institutionType) {
    q = q.eq("institution_type", opts.institutionType as never);
  }

  if (opts.q) {
    q = q.ilike("name", `%${opts.q}%`);
  }

  return q.order("name");
}

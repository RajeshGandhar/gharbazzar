import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SearchInput } from "../schemas";
import { LISTING_CARD_COLUMNS } from "@/features/properties/server/queries";
import { toRange } from "@/lib/api/pagination";

type Supa = Awaited<ReturnType<typeof createClient>>;

/**
 * Amenities filter — a property must have ALL requested amenities
 * (comma-separated slugs, e.g. "parking,lift"). property_amenities is fully
 * modeled and collected at listing-creation time but was never surfaced as
 * a search facet until searchProperties() started calling this.
 */
async function resolveAmenitiesFilter(
  supabase: Supa,
  amenitiesParam: string | undefined
): Promise<{ noMatch: boolean; matchingIds?: string[] }> {
  if (!amenitiesParam) return { noMatch: false };

  const slugs = amenitiesParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (slugs.length === 0) return { noMatch: false };

  const { data: amenityRows } = await supabase.from("amenities").select("id").in("slug", slugs);
  const amenityIds = (amenityRows ?? []).map((a) => a.id);
  if (amenityIds.length < slugs.length) {
    // An unknown slug was requested — no property can match all of them.
    return { noMatch: true };
  }

  const { data: links } = await supabase
    .from("property_amenities")
    .select("property_id, amenity_id")
    .in("amenity_id", amenityIds);

  const countByProperty = new Map<string, number>();
  for (const link of links ?? []) {
    countByProperty.set(link.property_id, (countByProperty.get(link.property_id) ?? 0) + 1);
  }
  const matchingIds = [...countByProperty.entries()]
    .filter(([, count]) => count === amenityIds.length)
    .map(([propertyId]) => propertyId);

  return matchingIds.length === 0 ? { noMatch: true } : { noMatch: false, matchingIds };
}

/**
 * University proximity filter — the returned distanceById preserves fetch
 * order so a "distance" sort can be applied after the main query (PostgREST
 * doesn't preserve .in() array order, so it can't be requested via
 * .order()).
 */
async function resolveUniversityFilter(
  supabase: Supa,
  universitySlug: string | undefined,
  maxDistance: number | undefined
): Promise<{ noMatch: boolean; matchingIds?: string[]; distanceById?: Map<string, number | null> }> {
  if (!universitySlug) return { noMatch: false };

  const { data: uni } = await supabase.from("universities").select("id").eq("slug", universitySlug).single();
  if (!uni) return { noMatch: false };

  const { data: links } = await supabase
    .from("property_universities")
    .select("property_id, computed_distance_m")
    .eq("university_id", uni.id)
    .lte("computed_distance_m", maxDistance ?? 5000)
    .order("computed_distance_m", { ascending: true })
    .limit(500);

  if (!links?.length) return { noMatch: true }; // no results near this university

  return {
    noMatch: false,
    matchingIds: links.map((l) => l.property_id),
    distanceById: new Map(links.map((l) => [l.property_id, l.computed_distance_m])),
  };
}

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

  // City / area / property-type slug lookups, the amenities filter, and the
  // university-proximity filter are all independent of each other — none
  // depends on another's result — so they're run concurrently instead of as
  // up to 5 sequential round trips per filtered request.
  const [cityResult, areaResult, ptypeResult, amenitiesResult, universityResult] = await Promise.all([
    input.city
      ? supabase.from("cities").select("id").eq("slug", input.city).single()
      : Promise.resolve(null),
    input.area
      ? supabase.from("areas").select("id").eq("slug", input.area).single()
      : Promise.resolve(null),
    input.property_type
      ? supabase.from("property_types").select("id").eq("slug", input.property_type).single()
      : Promise.resolve(null),
    resolveAmenitiesFilter(supabase, input.amenities),
    resolveUniversityFilter(supabase, input.university, input.max_distance),
  ]);

  if (cityResult?.data) query = query.eq("city_id", cityResult.data.id);
  if (areaResult?.data) query = query.eq("area_id", areaResult.data.id);
  if (ptypeResult?.data) query = query.eq("property_type_id", ptypeResult.data.id);

  if (amenitiesResult.noMatch) return { data: [], count: 0, error: null };
  if (amenitiesResult.matchingIds) query = query.in("id", amenitiesResult.matchingIds);

  if (universityResult.noMatch) return { data: [], count: 0, error: null };
  if (universityResult.matchingIds) query = query.in("id", universityResult.matchingIds);
  const distanceById = universityResult.distanceById ?? null;

  // Sort — "distance" is applied client-side below since it depends on the
  // proximity fetch above, not a column on `properties`.
  switch (input.sort) {
    case "price_asc":  query = query.order("price", { ascending: true });  break;
    case "price_desc": query = query.order("price", { ascending: false }); break;
    case "popular":    query = query.order("views_count", { ascending: false }); break;
    case "distance":   break; // applied after fetch, see below
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);

  if (input.sort === "distance" && distanceById && data) {
    const sorted = [...data].sort(
      (a, b) => (distanceById!.get(a.id) ?? Infinity) - (distanceById!.get(b.id) ?? Infinity)
    );
    return { data: sorted, count: count ?? 0, error };
  }

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

import "server-only";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Type helpers for joined query results
// ---------------------------------------------------------------------------

export interface PropertyImageRow {
  path: string;
  is_cover: boolean;
  position: number;
}

export interface PropertySummary {
  id: string;
  title: string;
  slug: string;
  price: number;
  city_id: number;
  purpose: string;
  status: string;
  approval_status: string;
  property_images: PropertyImageRow[];
  cities: { name: string } | null;
}

export interface FavoriteWithProperty {
  user_id: string;
  property_id: string;
  created_at: string;
  properties: PropertySummary | null;
}

export interface ComparisonPropertyRow {
  id: string;
  title: string;
  slug: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  built_up_area: number | null;
  area_unit: string;
  purpose: string;
  furnishing: string | null;
  property_images: PropertyImageRow[];
  cities: { name: string } | null;
}

export interface RecentlyViewedWithProperty {
  user_id: string;
  property_id: string;
  viewed_at: string;
  properties: PropertySummary | null;
}

export interface VisitWithDetails {
  id: string;
  property_id: string;
  seller_id: string;
  customer_id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  properties: {
    title: string;
    slug: string;
    cities: { name: string } | null;
  } | null;
  sellers: {
    business_name: string | null;
    profiles: { full_name: string; phone: string | null } | null;
  } | null;
}

export interface AccountDashboard {
  profile: {
    id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
    role: string;
    created_at: string;
  } | null;
  favoritesCount: number;
  savedSearchesCount: number;
  unreadNotificationsCount: number;
  upcomingVisits: VisitWithDetails[];
  recentlyViewed: RecentlyViewedWithProperty[];
}

// ---------------------------------------------------------------------------
// getAccountDashboard — parallel fetch for dashboard
// ---------------------------------------------------------------------------
export async function getAccountDashboard(userId: string): Promise<AccountDashboard> {
  const supabase = await createClient();

  const [
    profileRes,
    favCountRes,
    savedSearchCountRes,
    unreadCountRes,
    visitsRes,
    recentRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role, created_at")
      .eq("id", userId)
      .single(),

    supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("saved_searches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),

    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),

    supabase
      .from("visit_appointments")
      .select(`
        id, property_id, seller_id, customer_id, scheduled_at, status,
        notes, created_at, updated_at,
        properties ( title, slug, cities!city_id ( name ) ),
        sellers!seller_id ( business_name, profiles!id ( full_name, phone ) )
      `)
      .eq("customer_id", userId)
      .eq("status", "confirmed")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(3),

    supabase
      .from("recently_viewed")
      .select(`
        user_id, property_id, viewed_at,
        properties (
          id, title, slug, price, city_id, purpose, status, approval_status,
          property_images ( path, is_cover, position ),
          cities!city_id ( name )
        )
      `)
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(6),
  ]);

  return {
    profile: profileRes.data ?? null,
    favoritesCount: favCountRes.count ?? 0,
    savedSearchesCount: savedSearchCountRes.count ?? 0,
    unreadNotificationsCount: unreadCountRes.count ?? 0,
    upcomingVisits: (visitsRes.data ?? []) as unknown as VisitWithDetails[],
    recentlyViewed: (recentRes.data ?? []) as unknown as RecentlyViewedWithProperty[],
  };
}

// ---------------------------------------------------------------------------
// getFavorites
// ---------------------------------------------------------------------------
export async function getFavorites(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select(`
      user_id, property_id, created_at,
      properties (
        id, title, slug, price, city_id, purpose, status, approval_status,
        property_images ( path, is_cover, position ),
        cities!city_id ( name )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return {
    data: (data ?? []) as unknown as FavoriteWithProperty[],
    error,
  };
}

// ---------------------------------------------------------------------------
// getComparison
// ---------------------------------------------------------------------------
export async function getComparison(userId: string): Promise<{
  propertyIds: string[];
  properties: ComparisonPropertyRow[];
  error: unknown;
}> {
  const supabase = await createClient();

  const { data: compRow, error: compErr } = await supabase
    .from("comparisons")
    .select("property_ids")
    .eq("user_id", userId)
    .maybeSingle();

  if (compErr) return { propertyIds: [], properties: [], error: compErr };
  if (!compRow || compRow.property_ids.length === 0) {
    return { propertyIds: [], properties: [], error: null };
  }

  const ids = compRow.property_ids;
  const { data: props, error: propsErr } = await supabase
    .from("properties")
    .select(`
      id, title, slug, price, bedrooms, bathrooms, built_up_area, area_unit,
      purpose, furnishing,
      property_images ( path, is_cover, position ),
      cities!city_id ( name )
    `)
    .in("id", ids);

  return {
    propertyIds: ids,
    properties: (props ?? []) as unknown as ComparisonPropertyRow[],
    error: propsErr,
  };
}

// ---------------------------------------------------------------------------
// getSavedSearches
// ---------------------------------------------------------------------------
export async function getSavedSearches(userId: string) {
  const supabase = await createClient();
  return supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

// ---------------------------------------------------------------------------
// getNotifications — paginated
// ---------------------------------------------------------------------------
export async function getNotifications(userId: string, page: number) {
  const supabase = await createClient();
  const perPage = 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  return supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);
}

// ---------------------------------------------------------------------------
// getVisits
// ---------------------------------------------------------------------------
export async function getVisits(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visit_appointments")
    .select(`
      id, property_id, seller_id, customer_id, scheduled_at, status,
      notes, created_at, updated_at,
      properties ( title, slug, cities!city_id ( name ) ),
      sellers!seller_id ( business_name, profiles!id ( full_name, phone ) )
    `)
    .eq("customer_id", userId)
    .order("scheduled_at", { ascending: false });

  return {
    data: (data ?? []) as unknown as VisitWithDetails[],
    error,
  };
}

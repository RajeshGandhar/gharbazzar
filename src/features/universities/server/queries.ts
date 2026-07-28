import "server-only";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// University queries — used by /student-housing/[city] and /college/[slug]
// ---------------------------------------------------------------------------

export async function getUniversityBySlug(slug: string) {
  const supabase = await createClient();
  return supabase
    .from("universities")
    .select(`
      id, name, slug, aliases, institution_type,
      address, latitude, longitude,
      logo_url, website, is_active,
      seo_title, seo_description,
      cities!city_id ( id, name, slug, state )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
}

export async function listUniversitiesByCity(citySlug: string) {
  const supabase = await createClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", citySlug)
    .single();

  if (!city) return { data: null, error: new Error("City not found") };

  return supabase
    .from("universities")
    .select(`
      id, name, slug, institution_type, logo_url,
      latitude, longitude
    `)
    .eq("city_id", city.id)
    .eq("is_active", true)
    .order("institution_type")
    .order("name");
}

// Return count of live listings per university (for /college/[slug] indexing rule)
export async function getUniversityListingCount(universityId: number): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("property_universities")
    .select("property_id", { count: "exact", head: true })
    .eq("university_id", universityId);
  return count ?? 0;
}

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaginationParams } from "@/lib/api/pagination";
import { listStudentProperties } from "@/features/properties/server/queries";

export { listStudentProperties };

// ---------------------------------------------------------------------------
// Student housing hub: aggregate data for city hub pages
// ---------------------------------------------------------------------------
export async function getStudentHousingHubData(citySlug: string) {
  const supabase = await createClient();

  const { data: city, error: cityErr } = await supabase
    .from("cities")
    .select("id, name, slug, seo_title, seo_description")
    .eq("slug", citySlug)
    .single();

  if (cityErr || !city) return { data: null, error: cityErr };

  // Parallel: universities + listing count
  const [uniResult, countResult] = await Promise.all([
    supabase
      .from("universities")
      .select(`
        id, name, slug, institution_type, logo_url,
        property_universities ( property_id )
      `)
      .eq("city_id", city.id)
      .eq("is_active", true)
      .order("institution_type")
      .order("name"),

    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("city_id", city.id)
      .eq("rental_kind", "student")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .is("deleted_at", null),
  ]);

  return {
    data: {
      city,
      universities: uniResult.data ?? [],
      totalListings: countResult.count ?? 0,
    },
    error: uniResult.error ?? countResult.error,
  };
}

// Room availability summary for a specific PG/hostel property
export async function getRoomTypeSummary(propertyId: string) {
  const supabase = await createClient();
  return supabase
    .from("room_types")
    .select("id, name, sharing_count, monthly_rent_per_bed, is_ac, meal_plan, attached_bathroom, available_beds, is_active")
    .eq("property_id", propertyId)
    .eq("is_active", true)
    .order("sharing_count");
}

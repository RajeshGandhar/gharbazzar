import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Master-data caches — 1 hour TTL, tagged for manual invalidation.
 * Call revalidateTag("cities") / revalidateTag("property-types") from
 * admin seed routes after mutations to bust these caches immediately.
 */

export const getCachedCities = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("cities")
      .select("id, name, slug, state, region_id")
      .eq("is_active", true)
      .order("position");
    return data ?? [];
  },
  ["cities"],
  { tags: ["cities"], revalidate: 3600 }
);

export const getCachedPropertyTypes = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("property_types")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name");
    return data ?? [];
  },
  ["property-types"],
  { tags: ["property-types"], revalidate: 3600 }
);

export const getCachedAmenities = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("amenities")
      .select("id, name, slug, category")
      .eq("is_active", true)
      .order("category")
      .order("name");
    return data ?? [];
  },
  ["amenities"],
  { tags: ["amenities"], revalidate: 3600 }
);

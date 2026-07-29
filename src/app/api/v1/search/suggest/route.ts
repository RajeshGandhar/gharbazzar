import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, badRequest } from "@/lib/api/response";

export const runtime = "nodejs";

export interface SuggestResult {
  value: string;       // slug or name to fill into search
  label: string;       // display text
  category: "city" | "area" | "university";
  cityName?: string;   // for areas/universities: parent city
}

// ---------------------------------------------------------------------------
// GET /api/v1/search/suggest?q=&limit=
// Typeahead suggestions across cities, areas, universities
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return ok([] as SuggestResult[]);

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "8", 10), 20);
  const pattern = `%${q}%`;
  const supabase = createAdminClient();

  const [cities, areas, universities] = await Promise.all([
    supabase
      .from("cities")
      .select("id, name, slug")
      .ilike("name", pattern)
      .eq("is_active", true)
      .limit(3),

    supabase
      .from("areas")
      .select("id, name, slug, cities!city_id ( name )")
      .ilike("name", pattern)
      .eq("is_active", true)
      .limit(4),

    supabase
      .from("universities")
      .select("id, name, slug, cities!city_id ( name )")
      .ilike("name", pattern)
      .eq("is_active", true)
      .limit(3),
  ]);

  const results: SuggestResult[] = [];

  for (const c of cities.data ?? []) {
    results.push({ value: c.slug, label: c.name, category: "city" });
  }

  for (const a of areas.data ?? []) {
    const cityName = (a.cities as unknown as { name: string } | null)?.name;
    results.push({ value: a.slug, label: a.name, category: "area", cityName });
  }

  for (const u of universities.data ?? []) {
    const cityName = (u.cities as unknown as { name: string } | null)?.name;
    results.push({ value: u.slug, label: u.name, category: "university", cityName });
  }

  return ok(results.slice(0, limit));
}

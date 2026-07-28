import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { badRequest, ok, serverError } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cityIdParam = req.nextUrl.searchParams.get("city_id");
  if (!cityIdParam) return badRequest("city_id is required");

  const cityId = parseInt(cityIdParam, 10);
  if (isNaN(cityId)) return badRequest("city_id must be a number");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("areas")
    .select("id, name, slug")
    .eq("city_id", cityId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("areas fetch error", error);
    return serverError("Failed to fetch areas");
  }

  return ok(data);
}

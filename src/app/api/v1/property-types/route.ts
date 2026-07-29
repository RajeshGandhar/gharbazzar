import { createAdminClient } from "@/lib/supabase/admin";
import { ok, serverError } from "@/lib/api/response";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/v1/property-types — public list of active property types
// ---------------------------------------------------------------------------
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("property_types")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");

  if (error) return serverError(error.message);
  return ok(data ?? []);
}

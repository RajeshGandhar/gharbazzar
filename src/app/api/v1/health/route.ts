export const runtime = "nodejs";

import { createAdminClient } from "@/lib/supabase/admin";
import { ok, serverError } from "@/lib/api/response";

/**
 * GET /api/v1/health
 * Simple DB reachability check for uptime monitors and E2E smoke tests.
 * Returns { status: "ok", db: true } on success.
 */
export async function GET() {
  const supabase = createAdminClient();
  const { error } = await supabase.from("cities").select("id").limit(1).single();

  // PGRST116 = no rows — DB is reachable, just empty; still healthy
  if (error && error.code !== "PGRST116") {
    return serverError("Database unreachable");
  }

  return ok({ status: "ok", db: true });
}

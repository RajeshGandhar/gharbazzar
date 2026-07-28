import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { listUniversities } from "@/features/search/server/queries";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/v1/universities — typeahead & listing for student housing hub
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { data, error } = await listUniversities({
    citySlug:        sp.get("city") ?? undefined,
    institutionType: sp.get("type") ?? undefined,
    q:               sp.get("q") ?? undefined,
  });
  if (error) return serverError(error.message);
  return ok(data ?? []);
}

import { NextRequest } from "next/server";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { updateMyProfileSchema } from "@/features/sellers/schemas";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/v1/me — current user's profile + seller row (if seller)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { data, error } = await ctx.supabase
    .from("profiles")
    .select(`
      id, role, full_name, email, phone, avatar_url, is_active,
      last_seen_at, created_at,
      sellers ( id, slug, seller_type, business_name, kyc_status, is_verified, avg_rating )
    `)
    .eq("id", ctx.user.id)
    .single();

  if (error || !data) return serverError("Could not fetch profile");
  return ok(data);
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/me — update own profile
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try { body = await req.json(); }
  catch { return badRequest("Invalid JSON"); }

  const parsed = updateMyProfileSchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  const { data, error } = await ctx.supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", ctx.user.id)
    .select("id, full_name, phone, avatar_url")
    .single();

  if (error) return serverError(error.message);
  return ok(data);
}

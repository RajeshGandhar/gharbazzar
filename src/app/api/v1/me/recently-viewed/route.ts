import { NextRequest } from "next/server";
import { ok, created, badRequest, unauthorized, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { z } from "zod";

export const runtime = "nodejs";

// GET /api/v1/me/recently-viewed
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { data, error } = await ctx.supabase
    .from("recently_viewed")
    .select(`
      user_id, property_id, viewed_at,
      properties (
        id, title, slug, price, purpose, status, approval_status,
        property_images ( path, is_cover, position ),
        cities!city_id ( name )
      )
    `)
    .eq("user_id", ctx.user.id)
    .order("viewed_at", { ascending: false })
    .limit(20);

  if (error) return serverError(error.message);
  return ok(data ?? []);
}

// POST /api/v1/me/recently-viewed — record a view
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Invalid JSON"); }

  const parsed = z.object({ property_id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) return badRequest("property_id (uuid) is required");

  const { error } = await ctx.supabase
    .from("recently_viewed")
    .upsert(
      { user_id: ctx.user.id, property_id: parsed.data.property_id, viewed_at: new Date().toISOString() },
      { onConflict: "user_id,property_id" }
    );

  if (error) return serverError(error.message);
  return created({ tracked: true });
}

import { NextRequest } from "next/server";
import { ok, created, badRequest, unauthorized, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { z } from "zod";

export const runtime = "nodejs";

// GET /api/v1/me/favorites
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { data, error } = await ctx.supabase
    .from("favorites")
    .select(`
      user_id, property_id, created_at,
      properties (
        id, title, slug, price, city_id, purpose, status, approval_status,
        property_images ( path, is_cover, position ),
        cities!city_id ( name )
      )
    `)
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false });

  if (error) return serverError(error.message);
  return ok(data ?? []);
}

// POST /api/v1/me/favorites — add a property to favorites
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Invalid JSON"); }

  const parsed = z.object({ property_id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) return badRequest("property_id (uuid) is required");

  const { error } = await ctx.supabase
    .from("favorites")
    .upsert({ user_id: ctx.user.id, property_id: parsed.data.property_id }, { onConflict: "user_id,property_id" });

  if (error) return serverError(error.message);
  return created({ user_id: ctx.user.id, property_id: parsed.data.property_id });
}

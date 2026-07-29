import { NextRequest } from "next/server";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { z } from "zod";

export const runtime = "nodejs";

// GET /api/v1/me/compare
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { data: compRow, error: compErr } = await ctx.supabase
    .from("comparisons")
    .select("property_ids")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (compErr) return serverError(compErr.message);

  const ids: string[] = compRow?.property_ids ?? [];
  if (ids.length === 0) return ok({ property_ids: [], properties: [] });

  const { data: props, error: propsErr } = await ctx.supabase
    .from("properties")
    .select(`
      id, title, slug, price, bedrooms, bathrooms, built_up_area, area_unit,
      purpose, furnishing,
      property_images ( path, is_cover, position ),
      cities!city_id ( name )
    `)
    .in("id", ids);

  if (propsErr) return serverError(propsErr.message);
  return ok({ property_ids: ids, properties: props ?? [] });
}

// PUT /api/v1/me/compare — replace comparison list (max 4)
export async function PUT(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Invalid JSON"); }

  const parsed = z.object({
    property_ids: z.array(z.string().uuid()).max(4, "Maximum 4 properties to compare"),
  }).safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  const { error } = await ctx.supabase
    .from("comparisons")
    .upsert(
      { user_id: ctx.user.id, property_ids: parsed.data.property_ids, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) return serverError(error.message);
  return ok({ property_ids: parsed.data.property_ids });
}

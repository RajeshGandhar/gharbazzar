export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { addAreaSchema } from "@/features/admin/schemas";
import { z } from "zod";

const patchSchema = z.object({
  id: z.number(),
  is_active: z.boolean().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("city_id");

  const supabase = createAdminClient();
  let query = supabase
    .from("areas")
    .select("id, city_id, name, slug, pincode, latitude, longitude, is_active")
    .order("name", { ascending: true });

  if (cityId) query = query.eq("city_id", Number(cityId));

  const { data, error } = await query;
  if (error) return serverError(error.message);
  return ok(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = addAreaSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("areas")
    .insert({
      city_id: parsed.data.city_id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      pincode: parsed.data.pincode ?? null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    })
    .select()
    .single();

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "seed.area.created",
    entity_type: "area",
    entity_id: String(data.id),
    new_data: parsed.data as Record<string, unknown>,
  });

  return created(data);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const { id, ...updates } = parsed.data;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("areas")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return serverError(error.message);
  return ok(data);
}

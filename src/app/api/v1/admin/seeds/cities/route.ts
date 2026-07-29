export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { addCitySchema } from "@/features/admin/schemas";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, slug, district, state, region_id, position, is_active")
    .order("position", { ascending: true });

  if (error) return serverError(error.message);
  return ok(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = addCitySchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cities")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      district: parsed.data.district,
      state: parsed.data.state,
      region_id: parsed.data.region_id ?? null,
      position: parsed.data.position ?? 99,
    })
    .select()
    .single();

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "seed.city.created",
    entity_type: "city",
    entity_id: String(data.id),
    new_data: parsed.data as unknown as import("@/types/database.types").Json,
  });

  return created(data);
}

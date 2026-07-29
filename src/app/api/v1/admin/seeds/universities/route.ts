export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { addUniversitySchema } from "@/features/admin/schemas";
import { z } from "zod";

const patchSchema = z.object({ id: z.number(), is_active: z.boolean().optional() });

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("universities")
    .select("id, name, slug, institution_type, city_id, latitude, longitude, website, logo_url, is_active, cities!city_id(name)")
    .order("name", { ascending: true });

  if (error) return serverError(error.message);
  return ok(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = addUniversitySchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("universities")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      city_id: parsed.data.city_id,
      institution_type: parsed.data.institution_type,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      website: parsed.data.website ?? null,
      logo_url: parsed.data.logo_url ?? null,
    })
    .select()
    .single();

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "seed.university.created",
    entity_type: "university",
    entity_id: String(data.id),
    new_data: parsed.data as unknown as import("@/types/database.types").Json,
  });

  return created(data);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("id and is_active required");

  const { id, ...updates } = parsed.data;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("universities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return serverError(error.message);
  return ok(data);
}

export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { addAmenitySchema } from "@/features/admin/schemas";
import { z } from "zod";

const patchSchema = z.object({ id: z.number(), is_active: z.boolean().optional(), name: z.string().optional(), slug: z.string().optional(), icon: z.string().nullable().optional() });

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("amenities").select("id, name, slug, icon, is_active").order("name", { ascending: true });
  if (error) return serverError(error.message);
  return ok(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = addAmenitySchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("amenities")
    .insert({ name: parsed.data.name, slug: parsed.data.slug, icon: parsed.data.icon ?? null })
    .select()
    .single();

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "seed.amenity.created",
    entity_type: "amenity",
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
  if (!parsed.success) return badRequest("id required");

  const { id, ...updates } = parsed.data;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("amenities").update(updates).eq("id", id).select().single();
  if (error) return serverError(error.message);
  return ok(data);
}

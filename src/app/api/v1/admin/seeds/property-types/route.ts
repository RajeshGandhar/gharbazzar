export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { addPropertyTypeSchema } from "@/features/admin/schemas";
import { z } from "zod";

const patchSchema = z.object({ id: z.number(), is_active: z.boolean().optional(), position: z.number().optional() });

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("property_types").select("id, name, slug, category, icon, is_active, position").order("position", { ascending: true });
  if (error) return serverError(error.message);
  return ok(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = addPropertyTypeSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("property_types")
    .insert({ name: parsed.data.name, slug: parsed.data.slug, category: parsed.data.category, position: parsed.data.position ?? 99 })
    .select()
    .single();

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "seed.property_type.created",
    entity_type: "property_type",
    entity_id: String(data.id),
    new_data: parsed.data as unknown as import("@/types/database.types").Json,
  });

  revalidateTag("property-types", "max");
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
  const { data, error } = await supabase.from("property_types").update(updates).eq("id", id).select().single();
  if (error) return serverError(error.message);
  return ok(data);
}

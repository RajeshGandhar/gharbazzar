export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, created, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { prospectSchema } from "@/features/admin/schemas";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("seller_onboarding")
    .select("id, prospect_name, prospect_phone, seller_type, city_id, locality_note, stage, notes, next_action_at, seller_id, assignee_id, created_at, updated_at, cities!city_id(name), profiles!assignee_id(full_name)")
    .order("next_action_at", { ascending: true, nullsFirst: false });

  if (error) return serverError(error.message);
  return ok(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = prospectSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("seller_onboarding")
    .insert({
      prospect_name: parsed.data.prospect_name,
      prospect_phone: parsed.data.prospect_phone,
      seller_type: parsed.data.seller_type,
      city_id: parsed.data.city_id ?? null,
      locality_note: parsed.data.locality_note ?? null,
      assignee_id: parsed.data.assignee_id ?? null,
      next_action_at: parsed.data.next_action_at ?? null,
    })
    .select()
    .single();

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "crm.prospect.created",
    entity_type: "seller_onboarding",
    entity_id: data.id,
    new_data: parsed.data as unknown as import("@/types/database.types").Json,
  });

  return created(data);
}

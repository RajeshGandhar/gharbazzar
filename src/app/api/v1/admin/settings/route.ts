export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { settingSchema } from "@/features/admin/schemas";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value, updated_by, updated_at")
    .order("key", { ascending: true });

  if (error) return serverError(error.message);
  return ok(data);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = settingSchema.safeParse(body);
  if (!parsed.success) return badRequest("key and value are required");

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        key: parsed.data.key,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: parsed.data.value as any,
        updated_by: auth.user.id,
        updated_at: now,
      },
      { onConflict: "key" }
    )
    .select()
    .single();

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "settings.updated",
    entity_type: "site_settings",
    entity_id: parsed.data.key,
    new_data: { value: parsed.data.value } as Record<string, unknown>,
  });

  return ok(data);
}

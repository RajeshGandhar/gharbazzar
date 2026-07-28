export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { strikeSchema } from "@/features/admin/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = strikeSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const { reason_code, details, expires_at } = parsed.data;
  const supabase = createAdminClient();

  const { error: insertError } = await supabase.from("strikes").insert({
    user_id: id,
    reason_code,
    details: details ?? null,
    issued_by: auth.user.id,
    expires_at: expires_at ?? null,
  });

  if (insertError) return serverError(insertError.message);

  // Count total strikes
  const { count: strikeCount } = await supabase
    .from("strikes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id);

  // Auto-deactivate at 3 strikes
  if ((strikeCount ?? 0) >= 3) {
    await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", id);
  }

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "user.strike",
    entity_type: "profile",
    entity_id: id,
    new_data: { reason_code, details: details ?? null, auto_deactivated: (strikeCount ?? 0) >= 3 },
  });

  return ok({ strike_count: strikeCount ?? 1 });
}

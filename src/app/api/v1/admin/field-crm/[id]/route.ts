export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { z } from "zod";

const patchSchema = z.object({
  stage: z.enum(["identified", "visited", "onboarded", "active"]).optional(),
  notes: z.string().optional(),
  next_action_at: z.string().optional(),
  seller_id: z.string().uuid().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("seller_onboarding")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return serverError(error.message);

  if (parsed.data.stage) {
    await supabase.from("audit_logs").insert({
      actor_id: auth.user.id,
      action: `crm.prospect.stage.${parsed.data.stage}`,
      entity_type: "seller_onboarding",
      entity_id: id,
      new_data: { stage: parsed.data.stage },
    });
  }

  return ok(data);
}

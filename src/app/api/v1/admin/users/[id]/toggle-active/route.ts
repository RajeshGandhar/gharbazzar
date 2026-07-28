export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({ is_active: z.boolean() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("is_active boolean required");

  const { is_active } = parsed.data;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active })
    .eq("id", id);

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: is_active ? "user.activated" : "user.deactivated",
    entity_type: "profile",
    entity_id: id,
  });

  return ok({});
}

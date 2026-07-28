export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["open", "pending_user", "resolved", "closed"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("status is required");

  const { status } = parsed.data;
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("support_tickets")
    .update({
      status,
      resolved_at: status === "resolved" ? now : null,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return serverError(error.message);

  return ok({});
}

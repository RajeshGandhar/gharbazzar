import { NextRequest } from "next/server";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { z } from "zod";

export const runtime = "nodejs";

// POST /api/v1/me/notifications/read
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Invalid JSON"); }

  const parsed = z.object({
    all: z.boolean().optional(),
    ids: z.array(z.string().uuid()).optional(),
  }).safeParse(body);
  if (!parsed.success) return badRequest("Provide { all: true } or { ids: [...] }");

  const { all, ids } = parsed.data;
  if (!all && (!ids || ids.length === 0)) return badRequest("Provide all=true or a non-empty ids array");

  const now = new Date().toISOString();

  let query = ctx.supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", ctx.user.id)
    .is("read_at", null);

  if (!all && ids) {
    query = query.in("id", ids);
  }

  const { error } = await query;
  if (error) return serverError(error.message);
  return ok({ read_at: now });
}

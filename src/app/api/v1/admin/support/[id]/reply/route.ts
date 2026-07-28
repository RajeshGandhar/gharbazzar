export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, badRequest, notFound, serverError } from "@/lib/api/response";
import { replySchema } from "@/features/admin/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const supabase = createAdminClient();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, first_response_at")
    .eq("id", id)
    .single();
  if (!ticket) return notFound("Ticket not found");

  const { data: message, error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: id,
      author_id: auth.user.id,
      body: parsed.data.body,
      is_internal: parsed.data.is_internal ?? false,
    })
    .select()
    .single();

  if (error) return serverError(error.message);

  // Set first_response_at if not already set (only for non-internal replies)
  if (!ticket.first_response_at && !parsed.data.is_internal) {
    await supabase
      .from("support_tickets")
      .update({ first_response_at: new Date().toISOString() })
      .eq("id", id);
  }

  return ok({ id: message.id });
}

export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, badRequest, notFound, serverError } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({ remarks: z.string().min(1) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest("remarks is required");

  const { remarks } = parsed.data;
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: doc } = await supabase
    .from("kyc_documents")
    .select("id, seller_id")
    .eq("id", id)
    .single();
  if (!doc) return notFound("KYC document not found");

  const [docUpdate, sellerUpdate] = await Promise.all([
    supabase
      .from("kyc_documents")
      .update({ status: "rejected", remarks, reviewed_by: auth.user.id, reviewed_at: now })
      .eq("id", id),
    supabase
      .from("sellers")
      .update({ kyc_status: "rejected" })
      .eq("id", doc.seller_id),
  ]);

  if (docUpdate.error) return serverError(docUpdate.error.message);
  if (sellerUpdate.error) return serverError(sellerUpdate.error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "kyc.rejected",
    entity_type: "kyc_document",
    entity_id: id,
    new_data: { remarks },
  });

  return ok({});
}

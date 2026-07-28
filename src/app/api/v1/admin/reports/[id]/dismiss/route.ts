export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, notFound, serverError } from "@/lib/api/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: report } = await supabase
    .from("property_reports")
    .select("id")
    .eq("id", id)
    .single();
  if (!report) return notFound("Report not found");

  const { error } = await supabase
    .from("property_reports")
    .update({ status: "dismissed", resolved_by: auth.user.id })
    .eq("id", id);

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "report.dismissed",
    entity_type: "property_report",
    entity_id: id,
  });

  return ok({});
}

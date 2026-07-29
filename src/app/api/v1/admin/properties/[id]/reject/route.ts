export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, badRequest, notFound, serverError } from "@/lib/api/response";
import { rejectSchema } from "@/features/admin/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const { reason_code, internal_notes } = parsed.data;
  const supabase = createAdminClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id, slug")
    .eq("id", id)
    .single();
  if (!property) return notFound("Property not found");

  const { error } = await supabase
    .from("properties")
    .update({
      approval_status: "rejected",
      status: "inactive",
      rejection_reason: reason_code,
    })
    .eq("id", id);

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "listing.rejected",
    entity_type: "property",
    entity_id: id,
    new_data: { reason_code, internal_notes: internal_notes ?? null },
  });

  // Invalidate ISR cache so listing is no longer visible on browse pages
  revalidatePath(`/property/${property.slug}`);
  revalidatePath("/buy", "page");
  revalidatePath("/rent", "page");
  revalidatePath("/admin/approvals", "page");

  return ok({ id });
}

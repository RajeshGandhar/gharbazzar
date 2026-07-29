export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
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
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 60 * 86_400_000).toISOString();

  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("id, slug")
    .eq("id", id)
    .single();

  if (fetchError || !property) return notFound("Property not found");

  const { error } = await supabase
    .from("properties")
    .update({
      approval_status: "approved",
      status: "active",
      published_at: now,
      expires_at: expiresAt,
      approved_by: auth.user.id,
      approved_at: now,
    })
    .eq("id", id);

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "listing.approved",
    entity_type: "property",
    entity_id: id,
  });

  // Invalidate ISR cache for the listing detail page and browse surfaces
  revalidatePath(`/property/${property.slug}`);
  revalidatePath("/buy", "page");
  revalidatePath("/rent", "page");
  revalidatePath("/search", "page");
  revalidatePath("/admin/approvals", "page");

  return ok({ id, slug: property.slug });
}

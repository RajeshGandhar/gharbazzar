import { NextRequest } from "next/server";
import { requireSeller } from "@/lib/api/middleware";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/api/response";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { id } = await params;

  // Verify property belongs to this seller
  const { data: property, error: fetchErr } = await ctx.supabase
    .from("properties")
    .select("id, seller_id, status, approval_status")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (fetchErr || !property) return notFound("Property not found");
  if (property.seller_id !== ctx.user.id) return forbidden("Not your property");

  // Allow publish from draft or inactive (rejected resubmit)
  if (property.status !== "draft" && property.status !== "inactive") {
    return badRequest(
      `Cannot submit a listing with status '${property.status}' for review`
    );
  }

  const { data: updated, error: updateErr } = await ctx.supabase
    .from("properties")
    .update({ approval_status: "pending", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("seller_id", ctx.user.id)
    .select("id, approval_status")
    .single();

  if (updateErr) {
    console.error("publish error", updateErr);
    return serverError("Failed to submit for review");
  }

  return ok({ id: updated.id, approval_status: updated.approval_status });
}

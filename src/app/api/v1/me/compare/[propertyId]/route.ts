import { NextRequest } from "next/server";
import { ok, unauthorized, notFound, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";

export const runtime = "nodejs";

// DELETE /api/v1/me/compare/[propertyId] — remove one property from comparison
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { propertyId } = await params;

  // Fetch current list
  const { data: compRow, error: fetchErr } = await ctx.supabase
    .from("comparisons")
    .select("property_ids")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (fetchErr) return serverError(fetchErr.message);
  if (!compRow) return notFound("No comparison list found");

  const newIds = (compRow.property_ids ?? []).filter((id: string) => id !== propertyId);

  const { error } = await ctx.supabase
    .from("comparisons")
    .update({ property_ids: newIds, updated_at: new Date().toISOString() })
    .eq("user_id", ctx.user.id);

  if (error) return serverError(error.message);
  return ok({ property_ids: newIds });
}

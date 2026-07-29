import { NextRequest } from "next/server";
import { noContent, unauthorized, notFound, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";

export const runtime = "nodejs";

// DELETE /api/v1/me/favorites/[propertyId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { propertyId } = await params;

  const { error, count } = await ctx.supabase
    .from("favorites")
    .delete({ count: "exact" })
    .eq("user_id", ctx.user.id)
    .eq("property_id", propertyId);

  if (error) return serverError(error.message);
  if (count === 0) return notFound("Favorite not found");
  return noContent();
}

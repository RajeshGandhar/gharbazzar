import { NextRequest } from "next/server";
import { requireSeller } from "@/lib/api/middleware";
import { updateSellerProfileSchema } from "@/features/sellers/schemas";
import { badRequest, forbidden, ok, serverError, unauthorized } from "@/lib/api/response";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = updateSellerProfileSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

  const { data: updated, error } = await ctx.supabase
    .from("sellers")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", ctx.user.id)
    .select(
      "id, slug, seller_type, business_name, about, experience_years, office_address, city_id, whatsapp_number, website, rera_number"
    )
    .single();

  if (error) {
    if (error.code === "PGRST116") return forbidden("Not a seller");
    console.error("seller profile update error", error);
    return serverError("Failed to update profile");
  }

  return ok(updated);
}

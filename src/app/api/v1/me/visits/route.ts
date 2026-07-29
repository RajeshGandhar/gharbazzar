import { NextRequest } from "next/server";
import { ok, unauthorized, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";

export const runtime = "nodejs";

// GET /api/v1/me/visits
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { data, error } = await ctx.supabase
    .from("visit_appointments")
    .select(`
      id, property_id, seller_id, customer_id, scheduled_at, status,
      notes, created_at, updated_at,
      properties ( title, slug, cities!city_id ( name ) ),
      sellers!seller_id ( business_name, profiles!id ( full_name, phone ) )
    `)
    .eq("customer_id", ctx.user.id)
    .order("scheduled_at", { ascending: false });

  if (error) return serverError(error.message);
  return ok(data ?? []);
}

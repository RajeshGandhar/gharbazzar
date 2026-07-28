import { NextRequest } from "next/server";
import { requireSeller } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { forbidden, notFound, ok, serverError, unauthorized } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { id } = await params;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  // Verify ownership via RLS
  const { data: property } = await ctx.supabase
    .from("properties")
    .select("id, seller_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!property) return notFound("Property not found");
  if (property.seller_id !== ctx.user.id) return forbidden("Not your property");

  const adminSupabase = createAdminClient();

  const [eventResult, inquiriesResult] = await Promise.all([
    adminSupabase
      .from("listing_events")
      .select("event_type")
      .eq("property_id", id)
      .gte("created_at", thirtyDaysAgo),

    ctx.supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id),
  ]);

  const events = eventResult.data ?? [];
  const views = events.filter((e) => e.event_type === "view").length;
  const reveals = events.filter((e) => e.event_type === "reveal").length;
  const whatsapp_clicks = events.filter((e) => e.event_type === "whatsapp_click").length;
  const favorites = events.filter((e) => e.event_type === "favorite").length;

  if (eventResult.error) {
    console.error("stats event error", eventResult.error);
    return serverError("Failed to fetch stats");
  }

  return ok({
    views,
    reveals,
    whatsapp_clicks,
    inquiries: inquiriesResult.count ?? 0,
    favorites,
  });
}

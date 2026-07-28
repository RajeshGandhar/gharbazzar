import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { verifyCronSecret } from "@/lib/api/cron";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// POST /api/v1/crons/expire-listings
// Runs daily: marks properties past expires_at as 'expired', queues
// renewal nudge notifications for sellers.
// Schedule: 0 2 * * *  (02:00 IST ≈ 20:30 UTC previous day)
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const guardError = verifyCronSecret(req);
  if (guardError) return guardError;

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. Expire overdue active listings
  const { data: expired, error: expireErr } = await supabase
    .from("properties")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expires_at", now)
    .is("deleted_at", null)
    .select("id, title, seller_id");

  if (expireErr) return serverError(expireErr.message);

  const expiredCount = expired?.length ?? 0;

  // 2. Queue renewal nudge for each expired listing
  if (expiredCount > 0) {
    const outboxRows = expired!.map((p) => ({
      user_id: p.seller_id,
      channel: "email" as const,
      template: "listing_expired",
      payload: { property_id: p.id, title: p.title },
    }));

    await supabase.from("notification_outbox").insert(outboxRows);

    // In-app notifications
    const notifRows = expired!.map((p) => ({
      user_id: p.seller_id,
      type: "listing_expired",
      title: "Listing expired",
      body: `"${p.title}" has expired. Renew to keep it visible.`,
      payload: { property_id: p.id },
    }));
    await supabase.from("notifications").insert(notifRows);
  }

  // 3. Warn listings expiring in ≤ 7 days (if not already warned)
  const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: expiringSoon } = await supabase
    .from("properties")
    .select("id, title, seller_id, expires_at")
    .eq("status", "active")
    .gt("expires_at", now)
    .lt("expires_at", sevenDays)
    .is("deleted_at", null);

  if (expiringSoon?.length) {
    const nudgeRows = expiringSoon.map((p) => ({
      user_id: p.seller_id,
      channel: "email" as const,
      template: "listing_expiring_soon",
      payload: { property_id: p.id, title: p.title, expires_at: p.expires_at },
    }));
    // insert ignore duplicates (properties shouldn't get nudge twice per week)
    await supabase.from("notification_outbox").upsert(nudgeRows, {
      onConflict: "user_id,template",
      ignoreDuplicates: true,
    });
  }

  return ok({
    expired: expiredCount,
    expiringSoon: expiringSoon?.length ?? 0,
    ranAt: now,
  });
}

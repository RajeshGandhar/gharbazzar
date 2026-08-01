import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { verifyCronSecret } from "@/lib/api/cron";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// GET|POST /api/v1/crons/expire-listings
// Runs daily: marks properties past expires_at as 'expired', queues
// renewal nudge notifications for sellers.
// Schedule: 0 20 * * *  (20:00 UTC ≈ 01:30 IST) — see vercel.json.
// Vercel Cron invokes scheduled paths via GET; POST is kept for manual/admin
// triggering, so both methods run the same handler.
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
    // Dedupe per-listing (not per-user — a seller can have multiple
    // listings expiring, each needing its own reminder) against nudges
    // already queued in the last 7 days. `notification_outbox` has no
    // unique constraint that could express "one per (user, property,
    // template)" via PostgREST's onConflict (which only accepts plain
    // column lists, not the JSONB expression a per-property key would
    // need), so dedup happens here instead of via .upsert()'s onConflict —
    // which previously targeted a non-existent (user_id, template)
    // constraint and silently failed on every call.
    const { data: recentNudges } = await supabase
      .from("notification_outbox")
      .select("payload")
      .eq("template", "listing_expiring_soon")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const alreadyNudged = new Set(
      (recentNudges ?? [])
        .map((r) => (r.payload as { property_id?: string } | null)?.property_id)
        .filter((id): id is string => !!id)
    );

    const nudgeRows = expiringSoon
      .filter((p) => !alreadyNudged.has(p.id))
      .map((p) => ({
        user_id: p.seller_id,
        channel: "email" as const,
        template: "listing_expiring_soon",
        payload: { property_id: p.id, title: p.title, expires_at: p.expires_at },
      }));

    if (nudgeRows.length > 0) {
      await supabase.from("notification_outbox").insert(nudgeRows);
    }
  }

  return ok({
    expired: expiredCount,
    expiringSoon: expiringSoon?.length ?? 0,
    ranAt: now,
  });
}

// Vercel Cron invokes scheduled functions via GET, not POST.
export const GET = POST;

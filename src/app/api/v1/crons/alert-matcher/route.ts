import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { verifyCronSecret } from "@/lib/api/cron";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// GET|POST /api/v1/crons/alert-matcher
// Runs daily on the Vercel Hobby plan (see vercel.json — more frequent
// schedules require a paid plan): matches listings published since the last
// run to saved_searches with alerting enabled, and queues outbox
// notifications. The lookback window matches the daily cadence (with a
// 1-hour overlap buffer for scheduling jitter) so no listing published
// between runs is skipped.
// Schedule: 0 8 * * *
// Vercel Cron invokes scheduled paths via GET; POST is kept for manual/admin
// triggering, so both methods run the same handler.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const guardError = verifyCronSecret(req);
  if (guardError) return guardError;

  const supabase = createAdminClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(); // last 25h (daily cadence + jitter buffer)

  // Fetch newly published listings in the window
  const { data: newListings, error: listErr } = await supabase
    .from("properties")
    .select("id, title, slug, purpose, price, city_id, area_id, bedrooms, rental_kind, property_type_id")
    .eq("status", "active")
    .eq("approval_status", "approved")
    .gt("published_at", cutoff)
    .is("deleted_at", null)
    .limit(200);

  if (listErr) return serverError(listErr.message);
  if (!newListings?.length) return ok({ matched: 0, ranAt: now.toISOString() });

  // Fetch all active saved searches with alert enabled
  const { data: searches, error: searchErr } = await supabase
    .from("saved_searches")
    .select("id, user_id, purpose, filters, frequency, email_alerts")
    .neq("frequency", "off")
    .eq("email_alerts", true);

  if (searchErr) return serverError(searchErr.message);
  if (!searches?.length) return ok({ matched: 0, ranAt: now.toISOString() });

  type Filters = {
    city_id?: number;
    area_id?: number;
    min_price?: number;
    max_price?: number;
    bedrooms?: number;
    rental_kind?: string;
  };

  type Listing = {
    id: string;
    title: string;
    slug: string;
    purpose: string | null;
    price: number;
    city_id: number;
    area_id: number | null;
    bedrooms: number | null;
    rental_kind: string | null;
    property_type_id: number;
  };

  const outboxRows: {
    user_id: string;
    channel: "email";
    template: string;
    payload: import("@/types/database.types").Json;
  }[] = [];

  for (const search of searches) {
    const f = (search.filters ?? {}) as Filters;
    const matches: Listing[] = [];

    for (const listing of newListings as Listing[]) {
      if (search.purpose && listing.purpose !== search.purpose) continue;
      if (f.city_id && listing.city_id !== f.city_id) continue;
      if (f.area_id && listing.area_id !== f.area_id) continue;
      if (f.min_price && listing.price < f.min_price) continue;
      if (f.max_price && listing.price > f.max_price) continue;
      if (f.bedrooms !== undefined && listing.bedrooms !== f.bedrooms) continue;
      if (f.rental_kind && listing.rental_kind !== f.rental_kind) continue;
      matches.push(listing);
    }

    if (matches.length > 0) {
      outboxRows.push({
        user_id: search.user_id,
        channel: "email",
        template: "saved_search_alert",
        payload: {
          search_id: search.id,
          match_count: matches.length,
          listings: matches.slice(0, 5).map((l) => ({
            id: l.id,
            title: l.title,
            slug: l.slug,
            price: l.price,
          })),
        },
      });
    }
  }

  if (outboxRows.length > 0) {
    await supabase.from("notification_outbox").insert(outboxRows);

    // Update last_alerted_at on matched searches. Read search_id directly
    // from each row's own payload (set above) rather than re-deriving it by
    // user_id — a user with multiple matching saved searches would
    // otherwise always resolve to the same (first) search via .find(),
    // leaving the others' last_alerted_at stale.
    const alertedIds = [...new Set(
      outboxRows
        .map((r) => (r.payload as { search_id?: string } | null)?.search_id)
        .filter((id): id is string => !!id)
    )];
    if (alertedIds.length) {
      await supabase
        .from("saved_searches")
        .update({ last_alerted_at: now.toISOString() })
        .in("id", alertedIds as string[]);
    }
  }

  return ok({
    newListings: newListings.length,
    searchesChecked: searches.length,
    alertsQueued: outboxRows.length,
    ranAt: now.toISOString(),
  });
}

// Vercel Cron invokes scheduled functions via GET, not POST.
export const GET = POST;

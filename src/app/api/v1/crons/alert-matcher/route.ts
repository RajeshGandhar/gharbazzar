import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { verifyCronSecret } from "@/lib/api/cron";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// POST /api/v1/crons/alert-matcher
// Runs every 30 minutes: matches new listings to saved_searches with
// instant/daily frequency and queues outbox notifications.
// Schedule: */30 * * * *
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const guardError = verifyCronSecret(req);
  if (guardError) return guardError;

  const supabase = createAdminClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() - 35 * 60 * 1000).toISOString(); // last 35 min

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

    // Update last_alerted_at on matched searches
    const alertedIds = [...new Set(outboxRows.map((r) => {
      const s = searches.find((s) => s.user_id === r.user_id);
      return s?.id;
    }).filter(Boolean))];
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

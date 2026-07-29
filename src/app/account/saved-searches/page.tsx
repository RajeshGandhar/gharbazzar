import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSavedSearches } from "@/features/account/server/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Trash2, ExternalLink } from "lucide-react";
import { DeleteSavedSearchButton } from "./delete-button";

export const revalidate = 0;

const FREQ_LABELS: Record<string, string> = {
  instant: "Instant",
  daily: "Daily",
  weekly: "Weekly",
};

function buildSearchUrl(filters: Record<string, unknown>, purpose?: string | null): string {
  const params = new URLSearchParams();
  if (purpose) params.set("purpose", purpose);
  if (typeof filters.city_id === "number") params.set("city_id", String(filters.city_id));
  if (typeof filters.min_price === "number") params.set("min_price", String(filters.min_price));
  if (typeof filters.max_price === "number") params.set("max_price", String(filters.max_price));
  if (typeof filters.bedrooms === "number") params.set("bedrooms", String(filters.bedrooms));
  return `/search?${params.toString()}`;
}

function filterSummary(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof filters.bedrooms === "number") parts.push(`${filters.bedrooms} BHK`);
  if (typeof filters.min_price === "number" || typeof filters.max_price === "number") {
    const min = typeof filters.min_price === "number" ? `₹${(filters.min_price / 100000).toFixed(0)}L` : null;
    const max = typeof filters.max_price === "number" ? `₹${(filters.max_price / 100000).toFixed(0)}L` : null;
    if (min && max) parts.push(`${min}–${max}`);
    else if (min) parts.push(`From ${min}`);
    else if (max) parts.push(`Up to ${max}`);
  }
  if (typeof filters.furnishing === "string") parts.push(filters.furnishing);
  return parts.join(" · ") || "All filters";
}

export default async function SavedSearchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account/saved-searches");

  const { data } = await getSavedSearches(user.id);
  const searches = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Searches</h1>
          <p className="text-muted-foreground mt-1">
            Get alerted when new listings match your criteria
          </p>
        </div>
        <Link href="/search">
          <Button size="sm">
            <Plus className="size-4 mr-1.5" />
            New search
          </Button>
        </Link>
      </div>

      {searches.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="rounded-full bg-muted p-5">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <p className="font-medium">No saved searches</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Save a search on any results page to get email alerts for new listings.
          </p>
          <Link href="/search">
            <Button variant="outline">Start searching</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => {
            const filters = (s.filters ?? {}) as Record<string, unknown>;
            const searchUrl = buildSearchUrl(filters, s.purpose);
            return (
              <Card key={s.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{s.name}</span>
                      {s.purpose && (
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {s.purpose}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {FREQ_LABELS[s.frequency] ?? s.frequency}
                      </Badge>
                      {s.email_alerts && (
                        <Badge variant="outline" className="text-[10px]">Email on</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{filterSummary(filters)}</p>
                    {s.last_alerted_at && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Last alerted {new Date(s.last_alerted_at).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={searchUrl}>
                      <Button variant="ghost" size="icon" className="size-8" aria-label="Run this search">
                        <ExternalLink className="size-4" />
                      </Button>
                    </Link>
                    <DeleteSavedSearchButton searchId={s.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

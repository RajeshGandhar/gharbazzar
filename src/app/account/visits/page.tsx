import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getVisits } from "@/features/account/server/queries";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export const revalidate = 0;

type VisitStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";

const STATUS_LABELS: Record<VisitStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const STATUS_VARIANTS: Record<VisitStatus, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
  no_show: "destructive",
};

const TAB_FILTERS: Record<string, VisitStatus[] | null> = {
  all: null,
  upcoming: ["scheduled", "confirmed"],
  completed: ["completed"],
  cancelled: ["cancelled", "no_show"],
};

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account/visits");

  const { tab = "all" } = await searchParams;
  const activeTab = Object.keys(TAB_FILTERS).includes(tab) ? tab : "all";

  const { data: allVisits } = await getVisits(user.id);

  const filter = TAB_FILTERS[activeTab];
  const visits = filter
    ? allVisits.filter((v) => filter.includes(v.status as VisitStatus))
    : allVisits;

  const tabs = [
    { key: "all", label: "All", count: allVisits.length },
    { key: "upcoming", label: "Upcoming", count: allVisits.filter((v) => ["scheduled", "confirmed"].includes(v.status)).length },
    { key: "completed", label: "Completed", count: allVisits.filter((v) => v.status === "completed").length },
    { key: "cancelled", label: "Cancelled", count: allVisits.filter((v) => ["cancelled", "no_show"].includes(v.status)).length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Visits</h1>
        <p className="text-muted-foreground mt-1">Property visit appointments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`?tab=${t.key}`}
            className={[
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({t.count})</span>
            )}
          </Link>
        ))}
      </div>

      {visits.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="rounded-full bg-muted p-5">
            <Calendar className="size-8 text-muted-foreground" />
          </div>
          <p className="font-medium">No visits in this category</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Schedule a visit from any property listing.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v.id} className="rounded-xl border p-4 flex gap-4 items-start">
              <div className="flex-shrink-0 rounded-lg bg-muted p-2.5">
                <Calendar className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                {v.properties ? (
                  <Link href={`/property/${v.properties.slug}`} className="font-medium text-sm hover:text-primary truncate block">
                    {v.properties.title}
                    {v.properties.cities?.name && (
                      <span className="text-muted-foreground font-normal"> · {v.properties.cities.name}</span>
                    )}
                  </Link>
                ) : (
                  <p className="font-medium text-sm">Property visit</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(v.scheduled_at).toLocaleString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {v.sellers && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.sellers.business_name ?? v.sellers.profiles?.full_name ?? "Seller"}
                    {v.sellers.profiles?.phone && ` · ${v.sellers.profiles.phone}`}
                  </p>
                )}
                {v.notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">{v.notes}</p>
                )}
              </div>
              <Badge
                variant={STATUS_VARIANTS[v.status as VisitStatus] ?? "outline"}
                className="shrink-0 text-[10px]"
              >
                {STATUS_LABELS[v.status as VisitStatus] ?? v.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

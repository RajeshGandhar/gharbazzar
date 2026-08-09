import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getAccountDashboard } from "@/features/account/server/queries";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatRent, formatFreshness } from "@/lib/utils/format";
import { resolveCoverImageUrl } from "@/lib/utils/storage";
import {
  Heart,
  Search,
  Bell,
  Calendar,
  ArrowRight,
  GitCompare,
  History,
  User,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 0;

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: number;
  href: string;
  icon: React.ElementType;
  accentClass: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5 text-center">
        <div className={cn("mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110", accentClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </Link>
  );
}

function QuickLink({ label, href, icon: Icon }: { label: string; href: string; icon: React.ElementType }) {
  return (
    <Link href={href} className="group block">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account/dashboard");

  const data = await getAccountDashboard(user.id);
  const firstName = data.profile?.full_name?.split(" ")[0] ?? "there";
  const memberSince = data.profile?.created_at
    ? new Date(data.profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-8">

      {/* ── Welcome ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Hello, {firstName}</h1>
          {memberSince && (
            <p className="text-sm text-muted-foreground mt-1">Member since {memberSince}</p>
          )}
        </div>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Search className="h-4 w-4" />
          Search properties
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Favorites"
          value={data.favoritesCount}
          href="/account/favorites"
          icon={Heart}
          accentClass="bg-rose-900/30 text-rose-400"
        />
        <StatCard
          label="Saved Searches"
          value={data.savedSearchesCount}
          href="/account/saved-searches"
          icon={Search}
          accentClass="bg-blue-900/30 text-blue-400"
        />
        <StatCard
          label="Unread Alerts"
          value={data.unreadNotificationsCount}
          href="/account/notifications"
          icon={Bell}
          accentClass={cn(
            data.unreadNotificationsCount > 0
              ? "bg-amber-900/30 text-amber-400"
              : "bg-muted text-muted-foreground"
          )}
        />
      </div>

      {/* ── Upcoming visits ── */}
      {data.upcomingVisits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming Visits
            </h2>
            <Link href="/account/visits" className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.upcomingVisits.map((v) => (
              <div key={v.id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {v.properties?.title ?? "Property"}
                    {v.properties?.cities?.name && (
                      <span className="text-muted-foreground font-normal"> · {v.properties.cities.name}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(v.scheduled_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {v.sellers?.business_name && ` · ${v.sellers.business_name}`}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] rounded-full">
                  Scheduled
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recently viewed ── */}
      {data.recentlyViewed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Recently Viewed
            </h2>
            <Link href="/account/recently-viewed" className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.recentlyViewed.map((rv) => {
              const prop = rv.properties;
              if (!prop) return null;
              const imgUrl = resolveCoverImageUrl(prop.property_images);
              const isRent = prop.purpose === "rent" || prop.purpose === "student";
              return (
                <Link key={rv.property_id} href={`/property/${prop.slug}`} className="group block">
                  <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200">
                    <div className="relative h-28 bg-muted">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={prop.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width:768px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <Badge
                        variant="secondary"
                        className="absolute top-1.5 left-1.5 text-[10px] capitalize rounded-full bg-black/50 text-white border-0 backdrop-blur-sm"
                      >
                        {prop.purpose}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-foreground truncate">{prop.title}</p>
                      <p className="text-xs text-primary font-bold mt-0.5">
                        {isRent ? formatRent(prop.price) : formatPrice(prop.price)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatFreshness(rv.viewed_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick links ── */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <QuickLink label="Compare Properties"  href="/account/compare"          icon={GitCompare} />
          <QuickLink label="Recently Viewed"      href="/account/recently-viewed"  icon={History} />
          <QuickLink label="My Visits"            href="/account/visits"           icon={Calendar} />
          <QuickLink label="Edit Profile"         href="/account/profile"          icon={User} />
        </div>
      </div>
    </div>
  );
}

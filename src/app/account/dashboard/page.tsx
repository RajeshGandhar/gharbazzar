import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getAccountDashboard } from "@/features/account/server/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatRent, formatFreshness } from "@/lib/utils/format";
import {
  Heart,
  Search,
  Bell,
  Calendar,
  ArrowRight,
  GitCompare,
  History,
  User,
} from "lucide-react";

export const revalidate = 0;

function coverImage(images: { path: string; is_cover: boolean; position: number }[]): string | null {
  if (!images || images.length === 0) return null;
  const cover = images.find((i) => i.is_cover) ?? images.sort((a, b) => a.position - b.position)[0];
  return cover?.path ?? null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account/dashboard");

  const data = await getAccountDashboard(user.id);

  const stats = [
    { label: "Favorites", value: data.favoritesCount, href: "/account/favorites", icon: Heart, color: "text-rose-500" },
    { label: "Saved Searches", value: data.savedSearchesCount, href: "/account/saved-searches", icon: Search, color: "text-blue-500" },
    { label: "Unread", value: data.unreadNotificationsCount, href: "/account/notifications", icon: Bell, color: "text-amber-500" },
  ];

  const quickLinks = [
    { label: "Compare Properties", href: "/account/compare", icon: GitCompare },
    { label: "Recently Viewed", href: "/account/recently-viewed", icon: History },
    { label: "My Visits", href: "/account/visits", icon: Calendar },
    { label: "Edit Profile", href: "/account/profile", icon: User },
  ];

  const firstName = data.profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Hello, {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">
          Member since {data.profile?.created_at
            ? new Date(data.profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
            : "—"}
        </p>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="hover:border-primary transition-colors">
                <CardContent className="flex flex-col items-center gap-2 py-5">
                  <Icon className={`size-5 ${s.color}`} />
                  <span className="text-2xl font-bold">{s.value}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Upcoming visits */}
      {data.upcomingVisits.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Upcoming Visits</CardTitle>
            <Link href="/account/visits" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingVisits.map((v) => (
              <div key={v.id} className="flex items-start gap-3 rounded-lg border p-3">
                <Calendar className="size-4 mt-0.5 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
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
                <Badge variant="outline" className="shrink-0 text-[10px]">Scheduled</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recently viewed */}
      {data.recentlyViewed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recently Viewed</h2>
            <Link href="/account/recently-viewed" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.recentlyViewed.map((rv) => {
              const prop = rv.properties;
              if (!prop) return null;
              const imgPath = coverImage(prop.property_images);
              const isRent = prop.purpose === "rent" || prop.purpose === "student";
              return (
                <Link key={rv.property_id} href={`/property/${prop.slug}`}>
                  <div className="rounded-xl border overflow-hidden hover:border-primary transition-colors">
                    <div className="relative h-28 bg-muted">
                      {imgPath ? (
                        <Image src={imgPath} alt={prop.title} fill className="object-cover" sizes="(max-width:768px) 50vw, 33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                      )}
                      <Badge variant="secondary" className="absolute top-1.5 left-1.5 text-[10px] capitalize">
                        {prop.purpose}
                      </Badge>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium truncate">{prop.title}</p>
                      <p className="text-xs text-primary font-semibold mt-0.5">
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

      {/* Quick links */}
      <div>
        <h2 className="font-semibold mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((ql) => {
            const Icon = ql.icon;
            return (
              <Link key={ql.href} href={ql.href}>
                <Card className="hover:border-primary transition-colors">
                  <CardContent className="flex flex-col items-center gap-2 py-5">
                    <Icon className="size-5 text-muted-foreground" />
                    <span className="text-xs text-center">{ql.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Home,
  Key,
  Building2,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { SearchBar } from "@/components/shared/search-bar";

export const revalidate = 600;

async function getCities() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug, region_id")
    .eq("is_active", true)
    .order("position");
  return data ?? [];
}

async function getUniversityCount() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("universities")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  return count ?? 0;
}

async function getLatestProperties(): Promise<PropertyCardData[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select(`
      id, slug, title, price, purpose, city_id, area_id, bedrooms,
      built_up_area, area_unit, rental_kind, gender_policy, is_featured, is_verified, published_at,
      cities(name, slug),
      areas(name, slug),
      property_images(path, thumbnail_path, is_cover, position)
    `)
    .eq("status", "active")
    .eq("approval_status", "approved")
    .order("published_at", { ascending: false })
    .limit(8);
  return (data ?? []) as unknown as PropertyCardData[];
}

const heroStats = [
  { value: "Free",      label: "For seekers" },
  { value: "Verified",  label: "Seller KYC" },
  { value: "< 15 min",  label: "Alert delivery" },
  { value: "₹0",        label: "Contact fee" },
];

export default async function HomePage() {
  const [cities, uniCount, latestProperties] = await Promise.all([
    getCities(),
    getUniversityCount(),
    getLatestProperties(),
  ]);

  const brajCities = cities.filter((c) => c.region_id === 1);
  const ncrCities  = cities.filter((c) => c.region_id === 2);

  return (
    <div className="flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="border-b border-border py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl mb-4">
              Find property in Braj &amp; NCR
            </h1>
            <p className="text-base text-muted-foreground">
              Mathura · Vrindavan · Delhi · Noida · Greater Noida
            </p>
          </div>

          {/* Search bar */}
          <div className="mx-auto max-w-2xl mb-8">
            <div className="border border-border bg-card p-2 shadow-sm">
              <SearchBar />
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {heroStats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-bold text-foreground tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest properties ─────────────────────────────────────── */}
      {latestProperties.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              Latest listings
            </h2>
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latestProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/search"
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── 3 Intent cards ─────────────────────────────────────────── */}
      <section className="bg-muted/20 border-y border-border py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              What are you looking for?
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Buy */}
            <Link
              href="/buy"
              className="group border border-border bg-card p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <Home className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Buy</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Apartments, plots, houses and villas. Verified sellers, transparent prices.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Flats", "Plots", "Villas", "Houses"].map((t) => (
                  <span key={t} className="text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </Link>

            {/* Rent */}
            <Link
              href="/rent"
              className="group border border-border bg-card p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Rent</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Flats, PG, co-living. Monthly rent from ₹5,000. No broker fee.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["PG", "Shared flat", "Studio", "Furnished"].map((t) => (
                  <span key={t} className="text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </Link>

            {/* List property */}
            <Link
              href="/list-property"
              className="group border border-dashed border-primary/40 bg-primary/5 p-6 hover:border-primary/60 transition-colors sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">List property</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Free to list. Reach genuine buyers and tenants. 5 minutes to publish.
              </p>
              <span className="text-xs font-medium text-primary">
                Free for sellers
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Student Housing spotlight ────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border border-violet-200 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/20 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">
                  Student Housing
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  PGs and hostels near {uniCount}+ universities. Distances computed from campus locations.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["GLA University", "DU North Campus", "Amity Noida", "Mukherjee Nagar"].map((u) => (
                    <span
                      key={u}
                      className="text-xs text-violet-700 dark:text-violet-300"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/student-housing"
              className={cn(
                buttonVariants(),
                "shrink-0 self-start sm:self-center bg-violet-600 hover:bg-violet-700"
              )}
            >
              View listings
            </Link>
          </div>
        </div>
      </section>

      {/* ── City quick-links ─────────────────────────────────────── */}
      {(brajCities.length > 0 || ncrCities.length > 0) && (
        <section className="border-t border-border bg-muted/20 py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Browse by city
              </h2>
            </div>

            {brajCities.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Braj Region
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                  {brajCities.map((city) => (
                    <Link
                      key={city.id}
                      href={`/buy/${city.slug}`}
                      className="group flex flex-col items-center justify-center gap-1 border border-border bg-card p-4 text-center hover:border-primary/30 transition-colors min-h-[72px]"
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        {city.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {ncrCities.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Delhi NCR — Student Housing
                  </p>
                  <Link
                    href="/student-housing"
                    className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    View all
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                  {ncrCities.map((city) => (
                    <Link
                      key={city.id}
                      href={`/student-housing/${city.slug}`}
                      className="group flex flex-col items-center justify-center gap-1 border border-border bg-card p-4 text-center hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors min-h-[72px]"
                    >
                      <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      <span className="text-sm font-semibold text-foreground">
                        {city.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-primary p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Have a property to sell or rent?
          </h2>
          <p className="text-white/90 mb-6">
            List for free. Reach verified buyers and tenants.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/list-property"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary font-semibold px-6 py-2.5 hover:bg-white/90 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Post property
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-medium px-6 py-2.5 hover:bg-white/10 transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

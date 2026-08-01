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
      built_up_area, rental_kind, gender_policy, is_featured, is_verified, published_at,
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
      <section className="relative overflow-hidden gradient-hero py-16 sm:py-24 lg:py-32">
        {/* Decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 h-[300px] w-[300px] rounded-full bg-primary/6 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary tracking-wide">
              Braj &amp; NCR&apos;s trusted property platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl mb-6 leading-[1.1]">
            Find your perfect{" "}
            <span className="text-gradient">home</span>
            <br className="hidden sm:block" />
            {" "}in Braj &amp; NCR
          </h1>

          <p className="mx-auto max-w-xl text-lg text-muted-foreground mb-10 leading-relaxed">
            Mathura · Vrindavan · Delhi · Noida · Greater Noida.
            Verified properties, real prices, zero brokerage for seekers.
          </p>

          {/* Prominent search bar */}
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border/80 bg-card p-2 shadow-elevated-lg">
              <SearchBar />
            </div>
          </div>

          {/* Hero stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {heroStats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold text-primary tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest properties ─────────────────────────────────────── */}
      {latestProperties.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                Latest listings
              </p>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Properties near you
              </h2>
            </div>
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latestProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/search"
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              View all properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── 3 Intent cards ─────────────────────────────────────────── */}
      <section className="bg-muted/30 border-y border-border py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              What are you looking for?
            </p>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Start your property journey
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Buy */}
            <Link
              href="/buy"
              className="tilt-3d group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-6">
                  <Home className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-foreground">Buy</h3>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Apartments, plots, independent houses and villas. Verified sellers,
                  transparent prices, zero hidden charges.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Flats", "Plots", "Villas", "Houses"].map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Link>

            {/* Rent */}
            <Link
              href="/rent"
              className="tilt-3d group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-6">
                  <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-foreground">Rent</h3>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Flats, PG, co-living spaces. Monthly rent from ₹5,000. Contact
                  directly — no broker fee, ever.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["PG", "Shared flat", "Studio", "Furnished"].map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Link>

            {/* List property */}
            <Link
              href="/list-property"
              className="tilt-3d group relative overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-card to-card p-8 shadow-card hover:shadow-elevated hover:border-primary/60 transition-all duration-300 sm:col-span-2 lg:col-span-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-foreground">List property</h3>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Free to list. Reach genuine buyers and tenants. Get verified and
                  build trust. 5 minutes to publish.
                </p>
                <div className="mt-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Free for sellers
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Student Housing spotlight ────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-50 via-card to-indigo-50/50 dark:from-violet-950/30 dark:via-card dark:to-indigo-950/20 p-8 sm:p-12 overflow-hidden relative">
          <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-violet-200/40 dark:bg-violet-800/20 blur-2xl" />

          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                <GraduationCap className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <Badge className="mb-3 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-0">
                  Student Housing Ecosystem
                </Badge>
                <h2 className="text-2xl font-bold text-foreground">
                  Near {uniCount}+ universities
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                  PGs, hostels and shared flats near top universities and coaching hubs
                  across Braj &amp; NCR. Distances computed from campus geo-pins — never guessed.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["GLA University", "DU North Campus", "Amity Noida", "Mukherjee Nagar"].map((u) => (
                    <span
                      key={u}
                      className="rounded-full border border-violet-200 dark:border-violet-700/50 bg-white/60 dark:bg-violet-950/40 px-2.5 py-0.5 text-xs text-violet-700 dark:text-violet-300 font-medium"
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
                buttonVariants({ size: "lg" }),
                "shrink-0 self-start sm:self-center gap-2 bg-violet-600 hover:bg-violet-700 border-0 text-white"
              )}
            >
              Explore Student Housing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── City quick-links ─────────────────────────────────────── */}
      {(brajCities.length > 0 || ncrCities.length > 0) && (
        <section className="border-t border-border bg-muted/20 py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                Available cities
              </p>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Browse by location
              </h2>
            </div>

            {brajCities.length > 0 && (
              <div className="mb-10">
                <p className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Braj Region
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {brajCities.map((city) => (
                    <Link
                      key={city.id}
                      href={`/buy/${city.slug}`}
                      className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-5 text-center shadow-card hover:shadow-elevated hover:border-primary/30 hover:bg-primary/3 transition-all duration-200 min-h-[80px]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {city.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Properties</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {ncrCities.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {ncrCities.map((city) => (
                    <Link
                      key={city.id}
                      href={`/student-housing/${city.slug}`}
                      className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-5 text-center shadow-card hover:shadow-elevated hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-all duration-200 min-h-[80px]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50 transition-colors">
                        <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="text-sm font-semibold text-foreground group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                        {city.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Student PGs</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl gradient-brand p-10 sm:p-16 text-center overflow-hidden relative">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_oklch(1_0_0_/_10%)_0%,_transparent_60%)]" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Have a property to sell or rent?
            </h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto leading-relaxed">
              List for free. Reach verified buyers and tenants. Get your property
              in front of thousands of seekers in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/list-property"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-primary font-semibold px-8 py-3 hover:bg-white/90 transition-colors shadow-lg"
              >
                <Building2 className="h-4 w-4" />
                Post a property free
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 text-white font-medium px-8 py-3 hover:bg-white/10 transition-colors"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

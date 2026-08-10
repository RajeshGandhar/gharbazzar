import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Home,
  Key,
  Building2,
  MapPin,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SearchBar } from "@/components/shared/search-bar";
import { getFeaturedProperties, getPlatformStats } from "@/features/properties/server/queries";

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

export default async function HomePage() {
  const [cities, uniCount, latestProperties, featuredProperties, stats] = await Promise.all([
    getCities(),
    getUniversityCount(),
    getLatestProperties(),
    getFeaturedProperties(4),
    getPlatformStats(),
  ]);

  const brajCities = cities.filter((c) => c.region_id === 1);
  const ncrCities  = cities.filter((c) => c.region_id === 2);

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="py-16 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-5 leading-[1.08]">
              Find property in Braj &amp; NCR
            </h1>
            <p className="text-base text-muted-foreground/80 tracking-wide">
              Mathura · Vrindavan · Delhi · Noida · Greater Noida
            </p>
          </div>

          <div className="mx-auto max-w-2xl mb-12">
            <SearchBar />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-12 text-sm">
            {[
              { value: stats.listings > 0 ? `${stats.listings}+` : "Free", label: stats.listings > 0 ? "Active listings" : "For seekers" },
              { value: stats.verifiedSellers > 0 ? `${stats.verifiedSellers}+` : "Verified", label: stats.verifiedSellers > 0 ? "Verified sellers" : "Seller KYC" },
              { value: stats.cities > 0 ? `${stats.cities}` : `${uniCount}+`, label: stats.cities > 0 ? "Cities covered" : "Universities" },
              { value: "₹0", label: "Contact fee" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-semibold text-foreground tabular-nums text-base">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest properties ── */}
      {latestProperties.length > 0 && (
        <ScrollReveal>
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Latest listings
            </h2>
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
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
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
        </ScrollReveal>
      )}

      {/* ── Featured listings ── */}
      {featuredProperties.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">Featured listings</h2>
            </div>
            <Link
              href="/search?featured=true"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <ScrollReveal>
      <section className="py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground text-center mb-3">How it works</p>
          <h2 className="text-lg font-semibold text-foreground sm:text-xl text-center mb-10">
            Three steps to your next property
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: "1", title: "Search & discover", desc: "Browse verified listings with real photos. Filter by budget, location, BHK, and more." },
              { step: "2", title: "Connect directly", desc: "Reveal the owner or agent's number instantly. No middlemen, no brokerage for seekers." },
              { step: "3", title: "Visit & finalize", desc: "Schedule a visit, negotiate directly, and close the deal — we're never a party to the transaction." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                  {step}
                </div>
                <h3 className="font-medium text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ── Trust strip ── */}
      <section className="py-5">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              { label: "Verified sellers" },
              { label: "Zero brokerage for seekers" },
              { label: "DPDP compliant" },
              { label: "Direct contact" },
            ].map(({ label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-primary text-xs">✓</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Intent cards ── */}
      <ScrollReveal>
      <section className="py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl mb-8">
            What are you looking for?
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/buy"
              className="group rounded-xl border border-white/[0.06] bg-card p-6 hover:border-white/[0.12] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <Home className="h-5 w-5 text-emerald-400" />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">Buy</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Apartments, plots, houses and villas. Verified sellers, transparent prices.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Flats", "Plots", "Villas", "Houses"].map((t) => (
                  <span key={t} className="text-xs text-muted-foreground/70">{t}</span>
                ))}
              </div>
            </Link>

            <Link
              href="/rent"
              className="group rounded-xl border border-white/[0.06] bg-card p-6 hover:border-white/[0.12] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <Key className="h-5 w-5 text-blue-400" />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">Rent</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Flats, PG, co-living. Monthly rent from ₹5,000. No broker fee.
              </p>
              <div className="flex flex-wrap gap-2">
                {["PG", "Shared flat", "Studio", "Furnished"].map((t) => (
                  <span key={t} className="text-xs text-muted-foreground/70">{t}</span>
                ))}
              </div>
            </Link>

            <Link
              href="/list-property"
              className="group rounded-xl border border-dashed border-white/[0.1] bg-card p-6 hover:border-primary/30 transition-all sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-start justify-between mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">List property</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Free to list. Reach genuine buyers and tenants. 5 minutes to publish.
              </p>
              <span className="text-xs font-medium text-primary">Free for sellers</span>
            </Link>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ── Student Housing ── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-violet-500/15 bg-violet-950/15 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-violet-900/40 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-medium text-foreground mb-1">Student Housing</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  PGs and hostels near {uniCount}+ universities. Distances computed from campus locations.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["GLA University", "DU North Campus", "Amity Noida", "Mukherjee Nagar"].map((u) => (
                    <span key={u} className="text-xs text-violet-300/70">{u}</span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/student-housing"
              className={cn(buttonVariants(), "shrink-0 self-start sm:self-center bg-violet-600 hover:bg-violet-700")}
            >
              View listings
            </Link>
          </div>
        </div>
      </section>

      {/* ── Browse by city ── */}
      {(brajCities.length > 0 || ncrCities.length > 0) && (
        <section className="py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl mb-8">
              Browse by city
            </h2>

            {brajCities.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <MapPin className="h-3 w-3" />
                  Braj Region
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                  {brajCities.map((city) => (
                    <Link
                      key={city.id}
                      href={`/buy/${city.slug}`}
                      className="group flex flex-col items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-card/50 p-4 text-center hover:border-white/[0.12] transition-all min-h-[64px]"
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium text-foreground">{city.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {ncrCities.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                    <GraduationCap className="h-3 w-3" />
                    Delhi NCR — Student Housing
                  </p>
                  <Link
                    href="/student-housing"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
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
                      className="group flex flex-col items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-card/50 p-4 text-center hover:border-violet-500/20 transition-all min-h-[64px]"
                    >
                      <GraduationCap className="h-3.5 w-3.5 text-violet-400" />
                      <span className="text-sm font-medium text-foreground">{city.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Bottom CTA ── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-primary/90 rounded-xl p-10 sm:p-14 text-center">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Have a property to sell or rent?
          </h2>
          <p className="text-white/80 mb-8">
            List for free. Reach verified buyers and tenants.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/list-property"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-primary font-medium px-6 py-2.5 hover:bg-white/90 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Post property
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 text-white font-medium px-6 py-2.5 hover:bg-white/10 transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

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
  Shield,
  UserCheck,
  Handshake,
  Eye,
  Sparkles,
  BadgeCheck,
  Phone,
  Lock,
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
  const ncrCities = cities.filter((c) => c.region_id === 2);

  return (
    <div className="flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="pointer-events-none absolute top-20 right-0 h-[300px] w-[400px] rounded-full bg-primary/[0.03] blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 lg:pt-28 lg:pb-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left — Copy + Search */}
            <div>
              {/* Trust badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5">
                <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary tracking-wide">
                  VERIFIED LISTINGS &middot; DIRECT OWNERS &middot; ZERO BROKERAGE
                </span>
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-5">
                Find the right{"\n"}property.{" "}
                <span className="text-gradient">Right here.</span>
              </h1>

              <p className="text-base text-muted-foreground mb-8 max-w-lg">
                <span className="text-foreground/80">Mathura</span>
                {" · "}
                <span className="text-foreground/80">Vrindavan</span>
                {" · "}
                <span className="text-foreground/80">Delhi</span>
                {" · "}
                <span className="text-foreground/80">Noida</span>
                {" · "}
                <span className="text-foreground/80">Greater Noida</span>
              </p>

              {/* Search */}
              <div className="rounded-xl border border-white/[0.06] bg-card/60 backdrop-blur-sm p-4 sm:p-5 mb-8">
                <SearchBar />
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 sm:gap-10">
                {[
                  { value: stats.listings > 0 ? `${stats.listings}+` : "Free", label: stats.listings > 0 ? "Active listings" : "For seekers" },
                  { value: stats.verifiedSellers > 0 ? `${stats.verifiedSellers}+` : "Verified", label: stats.verifiedSellers > 0 ? "Verified sellers" : "Seller KYC" },
                  { value: stats.cities > 0 ? `${stats.cities}` : `${uniCount}+`, label: stats.cities > 0 ? "Cities" : "Universities" },
                  { value: "₹0", label: "Contact fee" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="font-semibold text-foreground tabular-nums text-lg">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Featured property card */}
            <div className="relative hidden lg:block">
              {/* Abstract property visual */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/[0.06]">
                {/* Gradient background simulating premium property */}
                <div className="absolute inset-0 bg-gradient-to-br from-card via-muted/50 to-card" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,oklch(0.65_0.12_152/0.06),transparent_60%)]" />

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

                {/* Property icon cluster */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-primary/60" />
                    </div>
                    <div className="flex gap-3">
                      <div className="h-12 w-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                        <Home className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                        <Key className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating featured property card */}
              {featuredProperties.length > 0 && (() => {
                const p = featuredProperties[0];
                const cityName = (p as unknown as { cities?: { name?: string } }).cities?.name;
                const price = p.price;
                const formattedPrice = price >= 10000000
                  ? `₹${(price / 10000000).toFixed(1)} Cr`
                  : price >= 100000
                    ? `₹${(price / 100000).toFixed(0)} L`
                    : `₹${price.toLocaleString("en-IN")}`;
                return (
                  <div className="absolute -bottom-4 -left-6 w-72 rounded-xl border border-white/[0.08] bg-card/90 backdrop-blur-xl p-4 shadow-elevated-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-md px-2 py-0.5">
                        <BadgeCheck className="h-3 w-3" />
                        VERIFIED
                      </span>
                      {p.is_featured && (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 rounded-md px-2 py-0.5">
                          FEATURED
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1 truncate">{p.title}</h3>
                    {cityName && (
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {cityName}
                      </p>
                    )}
                    <p className="text-lg font-bold text-foreground mb-3">{formattedPrice}{p.purpose === "rent" ? "/mo" : ""}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      {p.bedrooms && <span>{p.bedrooms} Beds</span>}
                      {p.built_up_area && <span>{p.built_up_area} {p.area_unit === "sqm" ? "sq.m." : "sq.ft."}</span>}
                    </div>
                    <Link
                      href={`/property/${p.slug}`}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      View details
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust indicators ─────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: Sparkles, title: "Free", desc: "For seekers" },
              { icon: BadgeCheck, title: "Verified", desc: "Seller KYC" },
              { icon: Phone, title: "Direct Contact", desc: "With owners" },
              { icon: Handshake, title: "Zero Brokerage", desc: "No hidden fees" },
              { icon: MapPin, title: `${stats.cities > 0 ? stats.cities : "12"} Cities`, desc: "Covered" },
              { icon: Lock, title: "100% Safe", desc: "Secure & trusted" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06] border border-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest properties ─────────────────────────────────────── */}
      {latestProperties.length > 0 && (
        <ScrollReveal>
          <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-2">Browse</p>
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Latest listings
                </h2>
              </div>
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

      {/* ── Featured listings ─────────────────────────────────────── */}
      {featuredProperties.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Featured</h2>
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

      {/* ── Safety / Trust ─────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-[11px] uppercase tracking-widest font-medium text-primary mb-3">Trust & Safety</p>
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl mb-3">
                Safety you can trust
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Every listing is verified. Every owner is KYC verified.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "Secure Transactions",
                  desc: "Your data is encrypted and protected under DPDP.",
                },
                {
                  icon: UserCheck,
                  title: "No Middlemen",
                  desc: "Deal directly with property owners. Zero brokerage for seekers.",
                },
                {
                  icon: Eye,
                  title: "Transparent Process",
                  desc: "Clear pricing, real photos, verified seller profiles.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/[0.06] bg-card/50 p-6 hover:border-white/[0.1] transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/[0.08] border border-primary/10 mb-4 group-hover:bg-primary/[0.12] transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── How it works ─────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="py-16 sm:py-20 border-y border-white/[0.04]">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-3">How it works</p>
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                Three simple steps to your next property
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Search & Discover",
                  desc: "Browse verified properties with advanced filters and real photos.",
                },
                {
                  step: "02",
                  title: "Connect Directly",
                  desc: "Contact owners instantly. No middlemen, no brokerage.",
                },
                {
                  step: "03",
                  title: "Visit & Finalize",
                  desc: "Schedule a visit, negotiate directly, and close the deal.",
                },
              ].map(({ step, title, desc }, i) => (
                <div
                  key={step}
                  className="relative rounded-xl border border-white/[0.06] bg-card/50 p-6 hover:border-white/[0.1] transition-all"
                >
                  <span className="text-3xl font-bold text-primary/15 absolute top-4 right-5">{step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm mb-4">
                    {i + 1}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Intent cards ─────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-2">Explore</p>
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                What are you looking for?
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/buy"
                className="group rounded-xl border border-white/[0.06] bg-card/50 p-6 hover:border-emerald-500/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                    <Home className="h-5 w-5 text-emerald-400" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Buy</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Apartments, plots, houses and villas. Verified sellers, transparent prices.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Flats", "Plots", "Villas", "Houses"].map((t) => (
                    <span key={t} className="text-[11px] text-muted-foreground/70 bg-white/[0.03] rounded px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </Link>

              <Link
                href="/rent"
                className="group rounded-xl border border-white/[0.06] bg-card/50 p-6 hover:border-blue-500/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/15">
                    <Key className="h-5 w-5 text-blue-400" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Rent</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Flats, PG, co-living. Monthly rent from ₹5,000. No broker fee.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["PG", "Shared flat", "Studio", "Furnished"].map((t) => (
                    <span key={t} className="text-[11px] text-muted-foreground/70 bg-white/[0.03] rounded px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </Link>

              <Link
                href="/list-property"
                className="group rounded-xl border border-dashed border-primary/15 bg-card/50 p-6 hover:border-primary/30 transition-all sm:col-span-2 lg:col-span-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">List property</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Free to list. Reach genuine buyers and tenants. 5 minutes to publish.
                </p>
                <span className="text-xs font-semibold text-primary">Free for sellers</span>
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Student Housing ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-violet-500/15 bg-violet-950/15 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-900/40 border border-violet-500/15">
                <GraduationCap className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground mb-1">Student Housing</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  PGs and hostels near {uniCount}+ universities. Distances computed from campus locations.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["GLA University", "DU North Campus", "Amity Noida", "Mukherjee Nagar"].map((u) => (
                    <span key={u} className="text-[11px] text-violet-300/60 bg-violet-500/[0.06] rounded px-2 py-0.5">{u}</span>
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

      {/* ── Browse by city ────────────────────────────────────────── */}
      {(brajCities.length > 0 || ncrCities.length > 0) && (
        <ScrollReveal>
          <section className="py-16 sm:py-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-2">Popular Cities</p>
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Explore properties by city
                </h2>
              </div>

              {brajCities.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <MapPin className="h-3 w-3" />
                    Braj Region
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {brajCities.map((city) => (
                      <Link
                        key={city.id}
                        href={`/buy/${city.slug}`}
                        className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-card/50 p-5 text-center hover:border-primary/20 hover:bg-card/80 transition-all"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                        </div>
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
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {ncrCities.map((city) => (
                      <Link
                        key={city.id}
                        href={`/student-housing/${city.slug}`}
                        className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-card/50 p-5 text-center hover:border-violet-500/20 hover:bg-card/80 transition-all"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/[0.06]">
                          <GraduationCap className="h-3.5 w-3.5 text-violet-400" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{city.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card p-10 sm:p-14 text-center">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-[400px] rounded-full bg-primary/[0.08] blur-[80px]" />

          <div className="relative">
            <h2 className="text-2xl font-semibold text-foreground mb-3 sm:text-3xl">
              Have a property to sell or rent?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              List for free. Reach verified buyers and tenants. 5 minutes to publish.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/list-property"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                <Building2 className="h-4 w-4" />
                Post property
              </Link>
              <Link
                href="/auth/register"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

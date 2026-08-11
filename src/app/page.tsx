import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Eye,
  GraduationCap,
  Handshake,
  Home,
  Key,
  Lock,
  MapPin,
  Phone,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { HeroSearch } from "@/components/home/hero-search";
import { HeroVisual } from "@/components/home/hero-visual";
import { CityTile } from "@/components/home/city-tile";
import { SectionHeading } from "@/components/home/section-heading";
import { getCachedPropertyTypes } from "@/lib/cache/master-data";
import {
  getCityListingCounts,
  getFeaturedProperties,
  getPlatformStats,
  getSpotlightProperty,
} from "@/features/properties/server/queries";

export const revalidate = 600;

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

async function getCities() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug, region_id, image_url, latitude, longitude")
    .eq("is_active", true)
    .order("position");
  return data ?? [];
}

async function getUniversities() {
  const supabase = createAdminClient();
  const { data, count } = await supabase
    .from("universities")
    .select("id, name, slug", { count: "exact" })
    .eq("is_active", true)
    .order("name")
    .limit(6);
  return { universities: data ?? [], count: count ?? 0 };
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
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(8);
  return (data ?? []) as unknown as PropertyCardData[];
}

export default async function HomePage() {
  const [
    cities,
    { universities, count: uniCount },
    latestProperties,
    featuredProperties,
    stats,
    spotlight,
    propertyTypes,
  ] = await Promise.all([
    getCities(),
    getUniversities(),
    getLatestProperties(),
    getFeaturedProperties(4),
    getPlatformStats(),
    getSpotlightProperty(),
    getCachedPropertyTypes(),
  ]);

  // Only pay for per-city counts once there is inventory to count.
  const cityCounts =
    stats.listings > 0 ? await getCityListingCounts(cities.map((c) => c.id)) : {};

  const brajCities = cities.filter((c) => c.region_id === 1);
  const ncrCities = cities.filter((c) => c.region_id === 2);

  return (
    <div className="flex flex-col">
      {/* ══ Hero ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-48 left-1/4 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-primary/[0.05] blur-[130px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className={cn(CONTAINER, "relative pb-12 pt-12 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20")}>
          <div className="grid items-stretch gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            {/* Copy + search */}
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] py-1.5 pl-3 pr-4">
                <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="text-[11px] font-medium tracking-[0.12em] text-primary">
                  VERIFIED PROPERTIES · DIRECT OWNERS · ZERO BROKERAGE
                </span>
              </div>

              <h1 className="mb-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
                Find the right property.{" "}
                <span className="text-gradient">Right here.</span>
              </h1>

              <p className="mb-8 max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
                Verified listings across Braj and Delhi NCR — talk to the owner directly,
                pay no brokerage, and see the real price before you call.
              </p>

              <HeroSearch cities={cities} propertyTypes={propertyTypes} className="mb-7" />

              {/* Proof row — every figure below is live platform data */}
              <dl className="flex flex-wrap gap-x-10 gap-y-4">
                {[
                  ...(stats.listings > 0
                    ? [{ value: `${stats.listings}`, label: "Live listings" }]
                    : []),
                  { value: `${stats.cities}`, label: "Cities live" },
                  { value: `${uniCount}`, label: "Campuses mapped" },
                  { value: "₹0", label: "Brokerage on contacts" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <dt className="sr-only">{label}</dt>
                    <dd className="text-lg font-semibold tabular-nums text-foreground">{value}</dd>
                    <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </dl>
            </div>

            {/* Photography */}
            <HeroVisual property={spotlight} coverage={cities} />
          </div>
        </div>
      </section>

      {/* ══ Trust strip ═══════════════════════════════════════════ */}
      <section className="border-y border-white/[0.05] bg-card/30">
        <div className={cn(CONTAINER, "py-7")}>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: Sparkles, title: "Free for seekers", desc: "No contact fees" },
              { icon: BadgeCheck, title: "Verified sellers", desc: "Identity KYC checked" },
              { icon: Phone, title: "Direct contact", desc: "Owner, not an agent" },
              { icon: Handshake, title: "Zero brokerage", desc: "No hidden charges" },
              { icon: MapPin, title: `${stats.cities} cities`, desc: "Braj & Delhi NCR" },
              { icon: Lock, title: "Data protected", desc: "DPDP compliant" },
            ].map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/[0.06]">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
                    {title}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ Journeys ══════════════════════════════════════════════ */}
      <ScrollReveal>
        <section className={cn(CONTAINER, "section-y")}>
          <SectionHeading
            eyebrow="Choose your journey"
            title="What brings you to GharBazaar?"
            description="Buying, renting and student housing are separate experiences here — each one tuned to how that search actually works."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/buy",
                icon: Home,
                title: "Buy",
                desc: "Flats, plots, houses and villas with the price stated up front.",
                chips: ["Flats", "Plots", "Villas", "Houses"],
                tint: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
                hover: "hover:border-emerald-500/25",
              },
              {
                href: "/rent",
                icon: Key,
                title: "Rent",
                desc: "Monthly homes with no broker standing between you and the owner.",
                chips: ["Flats", "PG", "Studio", "Furnished"],
                tint: "text-blue-400 bg-blue-500/10 border-blue-500/15",
                hover: "hover:border-blue-500/25",
              },
              {
                href: "/student-housing",
                icon: GraduationCap,
                title: "Student housing",
                desc: `Per-bed pricing near ${uniCount} campuses, with distances computed from the campus pin.`,
                chips: ["PG", "Hostel", "Sharing", "Girls / Boys"],
                tint: "text-violet-400 bg-violet-500/10 border-violet-500/15",
                hover: "hover:border-violet-500/25",
              },
              {
                href: "/list-property",
                icon: Building2,
                title: "Post a property",
                desc: "Free to list. Reach genuine seekers directly — about five minutes to publish.",
                chips: ["Owners", "Agents", "Builders", "Managers"],
                tint: "text-primary bg-primary/10 border-primary/15",
                hover: "hover:border-primary/25",
              },
            ].map(({ href, icon: Icon, title, desc, chips, tint, hover }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex flex-col rounded-2xl border border-white/[0.06] bg-card/50 p-5 transition-all duration-300 hover:-translate-y-0.5",
                  hover
                )}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      tint
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden
                  />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
                <p className="mb-4 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                  {desc}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground/80"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ══ Live inventory ════════════════════════════════════════ */}
      <ScrollReveal>
        <section className={cn(CONTAINER, "section-y pt-0")}>
          <SectionHeading
            eyebrow="Fresh on GharBazaar"
            title="Latest verified listings"
            description="Newest first, straight from verified sellers."
            action={latestProperties.length > 0 ? { href: "/search", label: "View all" } : undefined}
          />

          {latestProperties.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {latestProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="panel flex flex-col items-center px-6 py-14 text-center">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.07]">
                <Building2 className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Listings are going live city by city
              </h3>
              <p className="mb-7 max-w-md text-sm leading-relaxed text-muted-foreground">
                Every seller is identity-checked before their property appears, so this page
                only ever shows real, approved listings. Be the first in your city — or search
                the cities we have already opened.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/list-property" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
                  <Building2 className="h-4 w-4" aria-hidden />
                  Post your property
                </Link>
                <Link
                  href="/search"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
                >
                  <Search className="h-4 w-4" aria-hidden />
                  Browse listings
                </Link>
              </div>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* ══ Featured ══════════════════════════════════════════════ */}
      {featuredProperties.length > 0 && (
        <ScrollReveal>
          <section className={cn(CONTAINER, "section-y pt-0")}>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold" aria-hidden />
                <h2 className="text-2xl font-semibold text-foreground sm:text-[1.75rem]">
                  Featured
                </h2>
              </div>
              <Link
                href="/search?featured=true"
                className="group hidden shrink-0 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                View all
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ══ How it works + Popular cities ═════════════════════════ */}
      <ScrollReveal>
        <section className="border-y border-white/[0.05] bg-card/20">
          <div className={cn(CONTAINER, "section-y")}>
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
              {/* How it works */}
              <div className="lg:col-span-5">
                <SectionHeading
                  eyebrow="How it works"
                  title="Three steps to your next home"
                  className="mb-8"
                />

                <ol className="space-y-3">
                  {[
                    {
                      title: "Search and shortlist",
                      desc: "Filter by locality, budget, BHK or campus distance. Real photos, real prices.",
                    },
                    {
                      title: "Contact the owner",
                      desc: "Reveal the number and call or WhatsApp directly. No agent in the middle, no fee.",
                    },
                    {
                      title: "Visit and close",
                      desc: "Schedule a visit, negotiate yourself, and keep the brokerage in your pocket.",
                    },
                  ].map((step, i) => (
                    <li
                      key={step.title}
                      className="flex gap-4 rounded-2xl border border-white/[0.06] bg-card/50 p-5 transition-colors hover:border-white/[0.1]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold tabular-nums text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="mb-1 text-[15px] font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="text-[13px] leading-relaxed text-muted-foreground">
                          {step.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Popular cities */}
              <div className="lg:col-span-7">
                <SectionHeading
                  eyebrow="Popular cities"
                  title="Explore properties by city"
                  action={{ href: "/search", label: "View all cities" }}
                  className="mb-8"
                />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {brajCities.slice(0, 4).map((city) => (
                    <CityTile
                      key={city.id}
                      city={city}
                      href={`/buy/${city.slug}`}
                      count={cityCounts[city.id]}
                    />
                  ))}
                </div>

                {brajCities.length > 4 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {brajCities.slice(4).map((city) => (
                      <Link
                        key={city.id}
                        href={`/buy/${city.slug}`}
                        prefetch={false}
                        className="rounded-lg border border-white/[0.06] bg-card/50 px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground"
                      >
                        {city.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ══ Student housing ═══════════════════════════════════════ */}
      <ScrollReveal>
        <section className={cn(CONTAINER, "section-y")}>
          <div className="rounded-3xl border border-violet-500/15 bg-gradient-to-br from-violet-950/25 via-card/60 to-card/60 p-6 sm:p-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                  <GraduationCap className="h-5 w-5 text-violet-400" aria-hidden />
                </div>
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-violet-400/90">
                  Student housing
                </p>
                <h2 className="mb-3 text-balance text-2xl font-semibold leading-tight text-foreground sm:text-[1.75rem]">
                  Not a category. A whole ecosystem.
                </h2>
                <p className="mb-6 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground">
                  Per-bed pricing, room-level availability, sharing and gender preferences, and
                  campus distances computed from the university&rsquo;s own geo-pin — never typed
                  in by a listing agent.
                </p>

                <ul className="mb-7 space-y-2.5">
                  {[
                    "Per-bed pricing, not per-flat guesswork",
                    "Room-level availability with sharing and gender filters",
                    "Walking distance from the campus gate, computed",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                      <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/student-housing"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "gap-2 bg-violet-600 text-white hover:bg-violet-500"
                    )}
                  >
                    Explore student housing
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Campuses on the map
                </p>
                <div className="mb-8 flex flex-wrap gap-2">
                  {universities.map((u) => (
                    <Link
                      key={u.id}
                      href={`/college/${u.slug}`}
                      prefetch={false}
                      className="rounded-lg border border-violet-500/12 bg-violet-500/[0.06] px-3 py-1.5 text-[13px] text-violet-200/80 transition-colors hover:border-violet-400/30 hover:text-violet-100"
                    >
                      {u.name}
                    </Link>
                  ))}
                  {uniCount > universities.length && (
                    <span className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-[13px] text-muted-foreground">
                      +{uniCount - universities.length} more
                    </span>
                  )}
                </div>

                {ncrCities.length > 0 && (
                  <>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Student cities
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {ncrCities.slice(0, 6).map((city) => (
                        <CityTile
                          key={city.id}
                          city={city}
                          href={`/student-housing/${city.slug}`}
                          count={cityCounts[city.id]}
                          variant="student"
                          className="aspect-[5/4]"
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ══ Safety ════════════════════════════════════════════════ */}
      <ScrollReveal>
        <section className="border-y border-white/[0.05] bg-card/20">
          <div className={cn(CONTAINER, "section-y")}>
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-4">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.08]">
                  <Shield className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
                  Trust &amp; safety
                </p>
                <h2 className="mb-3 text-balance text-2xl font-semibold leading-tight text-foreground sm:text-[1.75rem]">
                  Safety you can check, not just claim
                </h2>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  Sellers are identity-verified before a listing goes live, and every listing is
                  reviewed before it reaches you.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:col-span-8">
                {[
                  {
                    icon: UserCheck,
                    title: "Verified sellers",
                    desc: "Identity documents checked by our team before publishing. The badge shows what was verified and when.",
                  },
                  {
                    icon: Handshake,
                    title: "No middlemen",
                    desc: "You reach the owner or their listed representative directly. Seekers never pay for a contact.",
                  },
                  {
                    icon: Eye,
                    title: "Transparent listings",
                    desc: "Price is mandatory to publish, photos are the property's own, and stale listings expire.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/[0.06] bg-card/50 p-5 transition-colors hover:border-white/[0.1]"
                  >
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-primary/[0.07]">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                    </div>
                    <h3 className="mb-2 text-[15px] font-semibold text-foreground">{title}</h3>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ══ Closing CTA ═══════════════════════════════════════════ */}
      <section className={cn(CONTAINER, "section-y")}>
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card to-card px-6 py-12 text-center sm:px-14 sm:py-16">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[520px] -translate-x-1/2 rounded-full bg-primary/[0.1] blur-[90px]" />

          <div className="relative">
            <h2 className="mb-3 text-balance text-2xl font-semibold text-foreground sm:text-3xl">
              Have a property to sell or rent?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              List it free, get verified once, and talk to genuine seekers directly. Most owners
              publish in about five minutes.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/list-property" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
                <Building2 className="h-4 w-4" aria-hidden />
                Post your property
              </Link>
              <Link
                href="/search"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
              >
                <Search className="h-4 w-4" aria-hidden />
                Browse verified listings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

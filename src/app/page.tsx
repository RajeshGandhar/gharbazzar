import Link from "next/link";
import { ArrowRight, GraduationCap, Home, Key, Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";

// Revalidate every 10 minutes — city counts change slowly
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

export default async function HomePage() {
  const [cities, uniCount] = await Promise.all([getCities(), getUniversityCount()]);

  const brajCities  = cities.filter((c) => c.region_id === 1);  // Braj
  const ncrCities   = cities.filter((c) => c.region_id === 2);  // Delhi NCR

  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-16 sm:py-24">
        {/* decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/5 blur-2xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/20 bg-primary/10">
              Verified listings · Instant alerts · Free for seekers
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Find your perfect{" "}
              <span className="text-primary">home</span>{" "}
              in Braj &amp; NCR
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">
              Mathura · Vrindavan · Delhi · Noida · Greater Noida. Verified
              properties, real prices, zero hidden charges.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3 Intent cards (the 3-second rule) ───────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Buy */}
          <Link
            href="/buy"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-smooth hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-primary/10 p-3">
                <Home className="h-7 w-7 text-primary" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-smooth group-hover:text-primary group-hover:translate-x-1" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-foreground">Buy</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Apartments, plots, independent houses and villas. Verified sellers,
              transparent prices.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-primary">
              Browse properties →
            </span>
          </Link>

          {/* Rent */}
          <Link
            href="/rent"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-smooth hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-primary/10 p-3">
                <Key className="h-7 w-7 text-primary" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-smooth group-hover:text-primary group-hover:translate-x-1" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-foreground">Rent</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Flats, PG, co-living spaces. Monthly rent from ₹5,000. Contact
              directly — no broker fee.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-primary">
              Find a rental →
            </span>
          </Link>

          {/* List */}
          <Link
            href="/list-property"
            className="group relative overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-background p-8 transition-smooth hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-primary/15 p-3">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-smooth group-hover:text-primary group-hover:translate-x-1" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-foreground">
              List your property
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Free to list. Reach genuine buyers and tenants. Get verified and
              build trust. 5 minutes to publish.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-primary">
              Start listing →
            </span>
          </Link>
        </div>
      </section>

      {/* ── Student Housing spotlight ─────────────────────────────── */}
      <section className="border-y border-border bg-gradient-to-r from-primary/5 to-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/15 p-3 shrink-0">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Student Housing
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  PGs, hostels and shared flats near {uniCount}+ universities and
                  coaching hubs across Braj &amp; NCR. Distance computed from
                  campus — never guessed.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["GLA University", "DU North Campus", "Amity Noida", "Mukherjee Nagar"].map((u) => (
                    <span
                      key={u}
                      className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs text-primary font-medium"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/student-housing"
              className={cn(buttonVariants(), "shrink-0 self-start sm:self-center")}
            >
              Explore Student Housing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── City quick-links ──────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {brajCities.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Braj Region
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {brajCities.map((city) => (
                <Link
                  key={city.id}
                  href={`/buy/${city.slug}`}
                  className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card p-4 text-center transition-smooth hover:border-primary/40 hover:bg-accent hover:shadow-sm min-h-[70px]"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">
                    {city.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    View properties
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {ncrCities.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Delhi NCR — Student Housing
              </h2>
              <Link
                href="/student-housing"
                className="text-sm text-primary font-medium hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {ncrCities.map((city) => (
                <Link
                  key={city.id}
                  href={`/student-housing/${city.slug}`}
                  className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card p-4 text-center transition-smooth hover:border-primary/40 hover:bg-accent hover:shadow-sm min-h-[70px]"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">
                    {city.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Student PGs
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Trust strip ───────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
            {[
              { stat: "Free",       label: "For seekers — always" },
              { stat: "Verified",   label: "Seller identity & documents" },
              { stat: "< 15 min",   label: "Alert delivery on new matches" },
              { stat: "Real prices",label: "Mandatory on every listing" },
            ].map(({ stat, label }) => (
              <div key={stat} className="flex flex-col gap-1">
                <p className="text-2xl font-bold text-primary">{stat}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

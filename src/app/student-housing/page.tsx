import type { Metadata } from "next";
import Link from "next/link";
import { Bell, GraduationCap, MapPin, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Student Housing — PG, Hostels & Flats near Universities in Braj & NCR",
  description:
    "Find verified PG, hostels and student flats near GLA University, DU North Campus, Amity Noida, Sharda and 10+ more. Distance from campus — always computed, never guessed.",
};

async function getData() {
  const supabase = createAdminClient();

  const [{ data: universities }, { data: properties }] = await Promise.all([
    supabase
      .from("universities")
      .select("id, name, slug, institution_type, city_id, cities!city_id (name, slug)")
      .eq("is_active", true)
      .order("name")
      .limit(20),
    supabase
      .from("properties")
      .select(
        `id, slug, title, price, purpose, city_id, area_id, bedrooms,
         built_up_area, area_unit, rental_kind, gender_policy, is_featured, published_at,
         areas!area_id ( name, slug ),
         cities!city_id ( name, slug ),
         property_images ( path, thumbnail_path, is_cover, position )`
      )
      .eq("status", "active")
      .eq("approval_status", "approved")
      .eq("rental_kind", "student")
      .is("deleted_at", null)
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(24),
  ]);

  return {
    universities: universities ?? [],
    properties: (properties ?? []) as unknown as PropertyCardData[],
  };
}

const institutionLabel: Record<string, string> = {
  university:    "University",
  college:       "College",
  coaching_hub:  "Coaching Hub",
  school:        "School",
};

type Props = {
  searchParams: Promise<{ gender?: string; q?: string }>;
};

const genderOptions = [
  { value: "", label: "All genders" },
  { value: "boys_only", label: "Boys" },
  { value: "girls_only", label: "Girls" },
  { value: "family_only", label: "Family / Co-ed" },
];

export default async function StudentHousingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const genderFilter = sp.gender ?? "";
  const searchQuery = sp.q?.toLowerCase() ?? "";
  const { universities, properties } = await getData();

  // Filter universities by search query
  const filteredUnis = searchQuery
    ? universities.filter((u) => u.name.toLowerCase().includes(searchQuery))
    : universities;

  // Filter properties by gender policy
  const filteredProperties = genderFilter
    ? properties.filter((p) => p.gender_policy === genderFilter)
    : properties;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-white/[0.06] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-md bg-primary/8 p-2">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">Home</Link>
              {" / "}
              <span className="font-medium text-foreground">Student Housing</span>
            </nav>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Student Housing
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Verified PG, hostels and flats near top universities and coaching
            hubs. Campus distance auto-computed — never manually entered.
          </p>

          {/* University search */}
          <form action="/student-housing" className="mt-6 flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                type="text"
                placeholder="Search university or college..."
                defaultValue={searchQuery}
                className="w-full rounded-lg border border-white/[0.06] bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
            <button type="submit" className={cn(buttonVariants({ size: "default" }))}>
              Search
            </button>
          </form>

          {/* Gender filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {genderOptions.map(({ value, label }) => {
              const qs = new URLSearchParams();
              if (searchQuery) qs.set("q", searchQuery);
              if (value) qs.set("gender", value);
              const href = `/student-housing${qs.toString() ? `?${qs.toString()}` : ""}`;
              return (
                <Link
                  key={value}
                  href={href}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                    genderFilter === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/[0.06] hover:border-white/[0.12] hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* University grid */}
      {filteredUnis.length > 0 && (
        <section className="border-b border-white/[0.06] py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-medium text-foreground mb-5">
              Browse by university
            </h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUnis.map((u) => {
                const city = (u as unknown as { cities?: { name: string; slug: string } | null }).cities;
                return (
                  <Link
                    key={u.id}
                    href={`/college/${u.slug}`}
                    className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-card p-4 transition-smooth hover:border-white/[0.12] hover:-translate-y-0.5"
                  >
                    <div className="rounded-md bg-primary/8 p-2 shrink-0">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-smooth leading-snug truncate">
                        {u.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {city && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" />
                            {city.name}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-[10px] py-0">
                          {institutionLabel[u.institution_type] ?? u.institution_type}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Listings */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-lg font-medium text-foreground mb-5">
          All student housing
        </h2>

        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="rounded-xl bg-muted p-6">
              <GraduationCap className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              No student listings yet
            </h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              We&apos;re onboarding PG operators and hostel owners. Get an
              alert the moment a listing goes live near your university.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/login?next=/alerts/new?purpose=rent" className={buttonVariants()}>
                <Bell className="mr-2 h-4 w-4" />
                Get notified first
              </Link>
              <Link href="/list-property" className={buttonVariants({ variant: "outline" })}>
                List a PG or hostel
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProperties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

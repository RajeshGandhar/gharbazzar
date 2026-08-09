import type { Metadata } from "next";
import Link from "next/link";
import { Bell, GraduationCap, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { createAdminClient } from "@/lib/supabase/admin";

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

export default async function StudentHousingPage() {
  const { universities, properties } = await getData();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/8 to-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">Home</Link>
              {" / "}
              <span className="font-medium text-foreground">Student Housing</span>
            </nav>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Student Housing
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Verified PG, hostels and flats near top universities and coaching
            hubs. Campus distance auto-computed — never manually entered.
          </p>
        </div>
      </section>

      {/* University grid */}
      {universities.length > 0 && (
        <section className="border-b border-border bg-muted/20 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold text-foreground mb-5">
              Browse by university
            </h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {universities.map((u) => {
                const city = (u as unknown as { cities?: { name: string; slug: string } | null }).cities;
                return (
                  <Link
                    key={u.id}
                    href={`/college/${u.slug}`}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-smooth hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
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
        <h2 className="text-lg font-semibold text-foreground mb-5">
          All student housing
        </h2>

        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="rounded-2xl bg-muted p-6">
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
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

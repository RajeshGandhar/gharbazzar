import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronRight, GraduationCap, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { getStudentHousingHubData } from "@/features/student-housing/server/queries";
import { listStudentProperties } from "@/features/properties/server/queries";
import { cn } from "@/lib/utils";

export const revalidate = 300;

type Props = {
  params: Promise<{ city: string }>;
};

const institutionLabel: Record<string, string> = {
  university: "University",
  college: "College",
  coaching_hub: "Coaching Hub",
  school: "School",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const { data } = await getStudentHousingHubData(citySlug);
  if (!data) return { title: "City not found" };

  const { city } = data;
  const fallbackTitle = `Student Housing in ${city.name} — PG, Hostels & Flats near Universities`;

  return {
    title: city.seo_title || fallbackTitle,
    description:
      city.seo_description ||
      `Find verified PG rooms, hostels and student flats near top universities in ${city.name}. Distance from campus auto-computed.`,
  };
}

export default async function CityStudentHousingPage({ params }: Props) {
  const { city: citySlug } = await params;

  const { data: hubData } = await getStudentHousingHubData(citySlug);
  if (!hubData) notFound();

  const { city, universities, totalListings } = hubData;

  // Fetch student listings for this city
  const { data: listingsData } = await listStudentProperties({
    cityId: city.id,
    pagination: { page: 1, perPage: 24 },
  });
  const listings = (listingsData ?? []) as unknown as PropertyCardData[];

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/20">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3"
        >
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <li>
              <Link href="/" className="hover:text-primary transition-smooth">
                Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link
                href="/student-housing"
                className="hover:text-primary transition-smooth"
              >
                Student Housing
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="font-medium text-foreground">{city.name}</li>
          </ol>
        </nav>
      </div>

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/8 to-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Student Housing in {city.name}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Verified PG rooms, hostels and flats near {universities.length}{" "}
            universit{universities.length === 1 ? "y" : "ies"} in {city.name}.{" "}
            {totalListings > 0 && (
              <>
                <span className="font-semibold text-foreground">
                  {totalListings.toLocaleString("en-IN")}
                </span>{" "}
                active listings.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Universities grid */}
      {universities.length > 0 && (
        <section className="border-b border-border bg-muted/20 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold text-foreground mb-5">
              Universities in {city.name}
            </h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {universities.map((u) => {
                const listingCount =
                  (
                    u as unknown as {
                      property_universities?: Array<{ property_id: string }> | null;
                    }
                  ).property_universities?.length ?? 0;

                return (
                  <Link
                    key={u.id}
                    href={`/college/${u.slug}`}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-smooth hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-smooth leading-snug">
                        {u.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-[10px] py-0">
                          {institutionLabel[u.institution_type] ?? u.institution_type}
                        </Badge>
                        {listingCount > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {listingCount} listing{listingCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-smooth" />
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
          All student listings in {city.name}
        </h2>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="rounded-2xl bg-muted p-6">
              <GraduationCap className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              No student listings in {city.name} yet
            </h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              We&apos;re onboarding PG operators and hostel owners. Save an
              alert to get notified when listings go live near your university.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/login?next=/alerts/new"
                className={cn(buttonVariants())}
              >
                <Bell className="mr-2 h-4 w-4" />
                Get notified first
              </Link>
              <Link
                href="/sell"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                List a PG or hostel
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

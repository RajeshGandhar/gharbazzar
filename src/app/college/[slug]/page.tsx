import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  MapPin,
  Navigation,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { getUniversityBySlug } from "@/features/universities/server/queries";
import { listStudentProperties } from "@/features/properties/server/queries";
import { cn } from "@/lib/utils";
import { breadcrumbSchema, itemListSchema, aggregateOfferSchema } from "@/lib/seo/schema";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ gender?: string }>;
};

const institutionLabel: Record<string, string> = {
  university: "University",
  college: "College",
  coaching_hub: "Coaching Hub",
  school: "School",
};

const genderOptions = [
  { value: "", label: "All" },
  { value: "boys_only", label: "Boys" },
  { value: "girls_only", label: "Girls" },
  { value: "family_only", label: "Family" },
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharbazaar.in";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: uni } = await getUniversityBySlug(slug);
  if (!uni) return { title: "University not found" };

  const city = (uni as unknown as { cities?: { name: string; state: string } | null }).cities;
  const fallbackTitle = `Student Housing near ${uni.name} — PG & Hostels${city ? ` in ${city.name}` : ""} | GharBazaar`;

  return {
    title: uni.seo_title || fallbackTitle,
    description:
      uni.seo_description ||
      `Find verified PG rooms, hostels and student flats near ${uni.name}${city ? ` in ${city.name}` : ""}. Distance from campus auto-computed.`,
    alternates: { canonical: `/college/${slug}` },
  };
}

export default async function UniversityPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { gender } = await searchParams;

  const { data: uni } = await getUniversityBySlug(slug);
  if (!uni) notFound();

  const city = (uni as unknown as { cities?: { id: number; name: string; slug: string; state: string } | null }).cities;

  const { data: listings, count } = await listStudentProperties({
    universityId: uni.id,
    genderPolicy: gender && gender !== "" ? gender : undefined,
    pagination: { page: 1, perPage: 12 },
  });

  const properties = (listings ?? []) as unknown as PropertyCardData[];
  const activeGender = gender ?? "";

  // Index gating (≥3 listings per blueprint)
  const shouldIndex = (count ?? 0) >= 3;

  // AggregateOffer — per-bed price range from listings
  const prices = properties.map((p) => p.price).filter(Boolean);
  const lowPrice = prices.length > 0 ? Math.min(...prices) : null;
  const highPrice = prices.length > 0 ? Math.max(...prices) : null;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Student Housing", url: "/student-housing" },
    ...(city ? [{ name: city.name, url: `/student-housing/${city.slug}` }] : []),
    { name: uni.name, url: `/college/${slug}` },
  ];

  const listItems = properties.slice(0, 10).map((p) => ({
    name: p.title,
    url: `/property/${p.slug}`,
    price: p.price,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbItems)) }}
      />
      {listItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema(listItems, `PG & Hostels near ${uni.name}`)) }}
        />
      )}
      {lowPrice && highPrice && (count ?? 0) > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              aggregateOfferSchema({
                name: `Student Housing near ${uni.name}`,
                url: `/college/${slug}`,
                lowPrice,
                highPrice,
                offerCount: count ?? 0,
              })
            ),
          }}
        />
      )}
      {!shouldIndex && <meta name="robots" content="noindex,follow" />}

      <div className="flex flex-col">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-primary/8 to-background py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 flex-wrap"
            >
              <Link href="/" className="hover:text-primary transition-smooth">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <Link href="/student-housing" className="hover:text-primary transition-smooth">Student Housing</Link>
              {city && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  <Link href={`/student-housing/${city.slug}`} className="hover:text-primary transition-smooth">{city.name}</Link>
                </>
              )}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <span className="font-medium text-foreground truncate max-w-[200px]">{uni.name}</span>
            </nav>

            <div className="flex items-start gap-5">
              <div className="rounded-2xl border border-border bg-card p-3 shrink-0">
                {uni.logo_url ? (
                  <Image
                    src={uni.logo_url}
                    alt={`${uni.name} logo`}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <GraduationCap className="h-16 w-16 text-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[11px] border-primary/20 bg-primary/10 text-primary">
                    {institutionLabel[uni.institution_type] ?? uni.institution_type}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl leading-tight">{uni.name}</h1>
                {city && (
                  <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{city.name}, {city.state}</span>
                  </div>
                )}
                {uni.website && (
                  <a
                    href={uni.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Official website
                  </a>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{count}</span>{" "}
                verified PG &amp; hostel option{count !== 1 ? "s" : ""} near {uni.name}
                {lowPrice && (
                  <> · from <span className="font-semibold text-foreground">₹{lowPrice.toLocaleString("en-IN")}/mo</span></>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Filter tabs + Listings */}
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            {/* Gender filter as link pills */}
            <div className="flex flex-wrap gap-2">
              {genderOptions.map(({ value, label }) => {
                const isActive = activeGender === value;
                const href = value ? `/college/${slug}?gender=${value}` : `/college/${slug}`;
                return (
                  <Link
                    key={label}
                    href={href}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-smooth",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary hover:text-primary"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            {uni.latitude != null && uni.longitude != null && (
              <a
                href={`https://maps.google.com/?q=${uni.latitude},${uni.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-smooth"
              >
                <Navigation className="h-3.5 w-3.5" />
                Get directions
              </a>
            )}
          </div>

          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="rounded-2xl bg-muted p-6">
                <GraduationCap className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                No listings near {uni.name} yet
              </h2>
              <p className="text-muted-foreground max-w-sm text-sm">
                Be the first to list your PG or hostel near {uni.name}. Or save an
                alert to get notified when listings go live.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/search?rental_kind=student&university=${slug}`} className={cn(buttonVariants())}>
                  <Bell className="mr-2 h-4 w-4" />
                  Get notified
                </Link>
                <Link href="/sell" className={cn(buttonVariants({ variant: "outline" }))}>
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
    </>
  );
}

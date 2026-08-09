import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Home, ChevronRight, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { Pagination } from "@/components/shared/pagination";
import { createAdminClient } from "@/lib/supabase/admin";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { formatPrice } from "@/lib/utils/format";
import { NcrWaitlist } from "@/components/shared/ncr-waitlist";

export const revalidate = 300;

// Hardcoded launch cities — no DB call at build time
const LAUNCH_CITIES = [
  { slug: "mathura",       name: "Mathura",       state: "UP" },
  { slug: "vrindavan",     name: "Vrindavan",     state: "UP" },
  { slug: "delhi",         name: "Delhi",         state: "DL" },
  { slug: "noida",         name: "Noida",         state: "UP" },
  { slug: "greater-noida", name: "Greater Noida", state: "UP" },
  { slug: "gurgaon",       name: "Gurgaon",       state: "HR" },
  { slug: "faridabad",     name: "Faridabad",     state: "HR" },
  { slug: "ghaziabad",     name: "Ghaziabad",     state: "UP" },
];

// NCR general buy listings are not yet live — show waitlist capture instead
const NCR_SLUGS = new Set(["delhi", "noida", "greater-noida", "gurgaon", "faridabad", "ghaziabad"]);

export function generateStaticParams() {
  return LAUNCH_CITIES.map((c) => ({ city: c.slug }));
}

type Props = {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ bedrooms?: string; page?: string }>;
};

async function getCityWithProperties(citySlug: string, bedrooms?: number, page = 1, perPage = 20) {
  const supabase = createAdminClient();

  const { data: cityRow } = await supabase
    .from("cities")
    .select("id, name, slug, state")
    .eq("slug", citySlug)
    .single();

  if (!cityRow) return null;

  let q = supabase
    .from("properties")
    .select(
      `id, slug, title, price, purpose, city_id, area_id, bedrooms,
       built_up_area, area_unit, rental_kind, gender_policy, is_featured, published_at,
       areas!area_id ( name, slug ),
       cities!city_id ( name, slug ),
       property_images ( path, thumbnail_path, is_cover, position )`,
      { count: "exact" }
    )
    .eq("status", "active")
    .eq("approval_status", "approved")
    .eq("purpose", "sale")
    .eq("city_id", cityRow.id)
    .is("deleted_at", null);

  if (bedrooms !== undefined) q = q.eq("bedrooms", bedrooms);

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  q = q.order("is_featured", { ascending: false }).order("published_at", { ascending: false }).range(from, to);

  const { data, count } = await q;
  return { city: cityRow, properties: (data ?? []) as unknown as PropertyCardData[], count: count ?? 0 };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const { bedrooms: bedroomsStr } = await searchParams;
  const city = LAUNCH_CITIES.find((c) => c.slug === citySlug);
  if (!city) return { title: "City not found" };

  const bedrooms = bedroomsStr ? parseInt(bedroomsStr, 10) : undefined;
  const bhkLabel = bedrooms === 0 ? "Studio" : bedrooms ? `${bedrooms} BHK` : "";
  const titleParts = bhkLabel
    ? `${bhkLabel} Flats for Sale in ${city.name}`
    : `Property for Sale in ${city.name} — Flats, Plots & Houses`;

  return {
    title: `${titleParts} | GharBazaar`,
    description: `Browse verified properties for sale in ${city.name}. Apartments, plots, independent houses and villas — real prices, owner & agent listings on GharBazaar.`,
    // Query-string filter variants (?bedrooms=) canonicalize to the base
    // path per docs/blueprint/06-seo-blueprint.md §facets — see the
    // noindex on the bedrooms filter below, not a self-canonical.
    alternates: {
      canonical: `/buy/${city.slug}`,
    },
    openGraph: {
      title: titleParts,
      type: "website",
    },
  };
}

const bhkOptions = [
  { value: "0", label: "Studio" },
  { value: "1", label: "1 BHK" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4", label: "4+ BHK" },
];

export default async function BuyCityPage({ params, searchParams }: Props) {
  const { city: citySlug } = await params;

  if (NCR_SLUGS.has(citySlug)) {
    const cityEntry = LAUNCH_CITIES.find((c) => c.slug === citySlug);
    if (!cityEntry) notFound();
    return <NcrWaitlist city={cityEntry} purpose="sale" />;
  }

  const { bedrooms: bedroomsStr, page: pageStr } = await searchParams;

  const bedrooms = bedroomsStr !== undefined ? parseInt(bedroomsStr, 10) : undefined;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const perPage = 20;

  const result = await getCityWithProperties(citySlug, bedrooms, page, perPage);
  if (!result) notFound();

  const { city, properties, count } = result;

  // Fetch locality areas for this city (for internal linking)
  const supabase = createAdminClient();
  const { data: cityAreas } = await supabase
    .from("areas")
    .select("id, name, slug")
    .eq("city_id", city.id)
    .eq("is_active", true)
    .order("name");
  const areas = cityAreas ?? [];

  // Index only the base (unfiltered) path, and only if ≥3 live listings
  // (blueprint §1). Query-string filter variants (?bedrooms=) are
  // noindex,follow with canonical pointing at the base path above —
  // matching docs/blueprint/06-seo-blueprint.md's facet rule rather than
  // being indexed as their own near-duplicate pages.
  const shouldIndex = count >= 3 && bedrooms === undefined;

  const priceMin = properties.length > 0 ? Math.min(...properties.map((p) => p.price)) : null;
  const priceMax = properties.length > 0 ? Math.max(...properties.map((p) => p.price)) : null;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Buy", url: "/buy" },
    { name: city.name, url: `/buy/${city.slug}` },
    ...(bedrooms !== undefined ? [{ name: bhkOptions.find((b) => b.value === String(bedrooms))?.label ?? "", url: `/buy/${city.slug}?bedrooms=${bedrooms}` }] : []),
  ];

  const listingSchemaItems = properties.slice(0, 10).map((p) => ({
    name: p.title,
    url: `/property/${p.slug}`,
    price: p.price,
  }));

  const baseUrl = `/buy/${city.slug}${bedrooms !== undefined ? `?bedrooms=${bedrooms}` : ""}`;
  const paginationBase = `/buy/${city.slug}?${bedrooms !== undefined ? `bedrooms=${bedrooms}&` : ""}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbItems)) }}
      />
      {listingSchemaItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema(listingSchemaItems, `Properties for Sale in ${city.name}`)) }}
        />
      )}
      {!shouldIndex && (
        <meta name="robots" content="noindex,follow" />
      )}

      <div className="flex flex-col">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/20">
          <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
              <li><Link href="/" className="hover:text-primary transition-smooth">Home</Link></li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><Link href="/buy" className="hover:text-primary transition-smooth">Buy</Link></li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="text-foreground font-medium">{city.name}</li>
            </ol>
          </nav>
        </div>

        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-primary/8 to-background py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Property for Sale in {city.name}
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              {count > 0
                ? `${count.toLocaleString("en-IN")} verified listings${priceMin ? ` · from ${formatPrice(priceMin)}` : ""}${priceMax ? ` to ${formatPrice(priceMax)}` : ""}`
                : "Listings coming soon — save a search to be notified."}
            </p>

            {/* BHK filter */}
            <div className="flex flex-wrap gap-2 mt-5">
              <Link
                href={`/buy/${city.slug}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth ${bedrooms === undefined ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"}`}
              >
                All types
              </Link>
              {bhkOptions.map(({ value, label }) => (
                <Link
                  key={value}
                  href={`/buy/${city.slug}?bedrooms=${value}`}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth ${String(bedrooms) === value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="rounded-2xl bg-muted p-6">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">No properties found</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Be the first to know — save a search alert and we&apos;ll notify you when listings go live in {city.name}.
              </p>
              <Link href={`/search?purpose=sale&city=${city.slug}`} className={buttonVariants({ variant: "outline" })}>
                Search all types
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
              <Pagination page={page} perPage={perPage} total={count} baseUrl={paginationBase} />
            </>
          )}

          {/* Internal linking — areas in this city */}
          {areas.length > 0 && (
            <div className="mt-8 border-t border-border pt-8">
              <h2 className="text-base font-semibold text-foreground mb-4">Browse by locality in {city.name}</h2>
              <div className="flex flex-wrap gap-2">
                {areas.map((a) => (
                  <Link key={a.id} href={`/buy/${city.slug}/${a.slug}`} className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition-smooth">
                    {a.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Internal linking — nearby cities */}
          <div className="mt-8 border-t border-border pt-8">
            <h2 className="text-base font-semibold text-foreground mb-4">Also browse in nearby cities</h2>
            <div className="flex flex-wrap gap-2">
              {LAUNCH_CITIES.filter((c) => c.slug !== city.slug).map((c) => (
                <Link key={c.slug} href={`/buy/${c.slug}`} className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition-smooth">
                  Buy in {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

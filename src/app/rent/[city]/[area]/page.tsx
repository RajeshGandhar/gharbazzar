import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, ChevronRight, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { Pagination } from "@/components/shared/pagination";
import { createAdminClient } from "@/lib/supabase/admin";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { formatRent } from "@/lib/utils/format";

export const revalidate = 300;

type Props = {
  params: Promise<{ city: string; area: string }>;
  searchParams: Promise<{ page?: string }>;
};

async function getAreaWithRentals(citySlug: string, areaSlug: string, page = 1, perPage = 20) {
  const supabase = createAdminClient();

  const { data: cityRow } = await supabase
    .from("cities")
    .select("id, name, slug, state")
    .eq("slug", citySlug)
    .single();

  if (!cityRow) return null;

  const { data: areaRow } = await supabase
    .from("areas")
    .select("id, name, slug, city_id")
    .eq("slug", areaSlug)
    .eq("city_id", cityRow.id)
    .eq("is_active", true)
    .single();

  if (!areaRow) return null;

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count } = await supabase
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
    .eq("purpose", "rent")
    .eq("city_id", cityRow.id)
    .eq("area_id", areaRow.id)
    .neq("rental_kind", "student")
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .range(from, to);

  return { city: cityRow, area: areaRow, properties: (data ?? []) as unknown as PropertyCardData[], count: count ?? 0 };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, area: areaSlug } = await params;
  const result = await getAreaWithRentals(citySlug, areaSlug);
  if (!result) return { title: "Area not found" };
  const { city, area } = result;

  return {
    title: `Flats & PG for Rent in ${area.name}, ${city.name} | GharBazaar`,
    description: `Find verified flats, rooms and PG for rent in ${area.name}, ${city.name}. Direct contact with owners — zero brokerage on GharBazaar.`,
    alternates: { canonical: `/rent/${city.slug}/${area.slug}` },
    openGraph: { title: `Rent in ${area.name}, ${city.name}`, type: "website" },
  };
}

export default async function RentAreaPage({ params, searchParams }: Props) {
  const { city: citySlug, area: areaSlug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const perPage = 20;

  const result = await getAreaWithRentals(citySlug, areaSlug, page, perPage);
  if (!result) notFound();

  const { city, area, properties, count } = result;
  const shouldIndex = count >= 3;

  const priceMin = properties.length > 0 ? Math.min(...properties.map((p) => p.price)) : null;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Rent", url: "/rent" },
    { name: city.name, url: `/rent/${city.slug}` },
    { name: area.name, url: `/rent/${city.slug}/${area.slug}` },
  ];

  const listingSchemaItems = properties.slice(0, 10).map((p) => ({
    name: p.title,
    url: `/property/${p.slug}`,
    price: p.price,
  }));

  const paginationBase = `/rent/${city.slug}/${area.slug}?`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbItems)) }}
      />
      {listingSchemaItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema(listingSchemaItems, `Rentals in ${area.name}`)) }}
        />
      )}
      {!shouldIndex && <meta name="robots" content="noindex,follow" />}

      <div className="flex flex-col">
        {/* Breadcrumb */}
        <div className="border-b border-white/[0.06]">
          <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
              <li><Link href="/" className="hover:text-primary transition-smooth">Home</Link></li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><Link href="/rent" className="hover:text-primary transition-smooth">Rent</Link></li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><Link href={`/rent/${city.slug}`} className="hover:text-primary transition-smooth">{city.name}</Link></li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="text-foreground font-medium">{area.name}</li>
            </ol>
          </nav>
        </div>

        {/* Hero */}
        <section className="border-b border-white/[0.06] py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-md bg-primary/8 p-2">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Rentals in {area.name}
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              {count > 0
                ? `${count.toLocaleString("en-IN")} verified listings in ${area.name}, ${city.name}${priceMin ? ` · from ${formatRent(priceMin)}` : ""}`
                : `Rental listings in ${area.name} coming soon — save a search to be notified.`}
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="rounded-xl bg-muted p-6">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">No rentals found in {area.name}</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Save a search alert and we&apos;ll notify you when listings go live here.
              </p>
              <Link href={`/rent/${city.slug}`} className={buttonVariants({ variant: "outline" })}>
                Browse all rentals in {city.name}
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

          {/* Internal linking */}
          <div className="mt-12 border-t border-white/[0.06] pt-8">
            <Link href={`/rent/${city.slug}`} className="text-sm font-medium text-primary hover:text-primary/80">
              ← All rentals in {city.name}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

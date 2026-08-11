import { Sora } from "next/font/google";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCachedPropertyTypes } from "@/lib/cache/master-data";
import {
  getCityListingCounts,
  getLandingProperties,
  getPlatformStats,
  getPropertyTypeCounts,
} from "@/features/properties/server/queries";
import { toPremiumCard } from "@/features/properties/adapters/to-premium-card";
import { Hero } from "@/components/home/hero";
import { PropertyCategories, type CategoryTile } from "@/components/home/property-categories";
import { ActionCards } from "@/components/home/action-cards";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { PopularLocalities, type LocalityTile } from "@/components/home/popular-localities";
import { WhyGharBazaar } from "@/components/home/why-gharbazaar";
import { PostPropertyCTA } from "@/components/home/post-property-cta";
import { Stats, type StatItem } from "@/components/home/stats";

export const revalidate = 600;

/**
 * Sora is self-hosted by next/font (no external request, so the existing CSP
 * needs no change) and exposed only as a CSS variable on this page's wrapper.
 * `--font-display` falls back to Geist wherever --font-sora is undefined, so
 * every other route keeps its typography untouched.
 */
const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

/**
 * Editorial photography for the category rail and city tiles.
 *
 * Keyed by the real slug, so a type or city without artwork simply falls
 * through to a designed plate instead of borrowing another place's photo.
 */
const TYPE_IMAGES: Record<string, string> = {
  "apartment-flat": "/images/home/prop-apartment.jpg",
  "independent-house": "/images/home/prop-interior.jpg",
  villa: "/images/home/prop-villa.jpg",
  "builder-floor": "/images/home/prop-interior.jpg",
  "residential-plot": "/images/home/cat-plots.jpg",
  "pg-co-living": "/images/home/prop-apartment.jpg",
  "shop-showroom": "/images/home/cat-commercial.jpg",
  "office-space": "/images/home/proj-towers.jpg",
  "commercial-plot": "/images/home/cat-plots.jpg",
  "warehouse-godown": "/images/home/cat-commercial.jpg",
};

const CITY_IMAGES: Record<string, string> = {
  mathura: "/images/home/city-mathura.jpg",
  vrindavan: "/images/home/prop-villa.jpg",
  delhi: "/images/home/city-ncr.jpg",
  noida: "/images/home/prop-apartment.jpg",
  "greater-noida": "/images/home/proj-towers.jpg",
  gurugram: "/images/home/cat-commercial.jpg",
  ghaziabad: "/images/home/city-lucknow.jpg",
  faridabad: "/images/home/city-agra.jpg",
  govardhan: "/images/home/city-jaipur.jpg",
};

/** Types surfaced in the category rail, in the order the design shows them. */
const RAIL_TYPES: { slug: string; purpose: "sale" | "rent" }[] = [
  { slug: "apartment-flat", purpose: "sale" },
  { slug: "independent-house", purpose: "sale" },
  { slug: "villa", purpose: "sale" },
  { slug: "residential-plot", purpose: "sale" },
  { slug: "shop-showroom", purpose: "sale" },
  { slug: "pg-co-living", purpose: "rent" },
];

async function getCities() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug, state, region_id, image_url")
    .eq("is_active", true)
    .order("position");
  return data ?? [];
}

export default async function HomePage() {
  const [cities, propertyTypes, landingProperties, stats] = await Promise.all([
    getCities(),
    getCachedPropertyTypes(),
    getLandingProperties(6),
    getPlatformStats(),
  ]);

  // Only pay for per-row counts once there is inventory to count.
  const hasInventory = stats.listings > 0;
  const railTypeRows = RAIL_TYPES.map((r) =>
    propertyTypes.find((t) => t.slug === r.slug)
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const empty: Record<number, number> = {};
  const [cityCounts, typeCounts] = await Promise.all([
    hasInventory ? getCityListingCounts(cities.map((c) => c.id)) : Promise.resolve(empty),
    hasInventory ? getPropertyTypeCounts(railTypeRows.map((t) => t.id)) : Promise.resolve(empty),
  ]);

  const categories: CategoryTile[] = RAIL_TYPES.flatMap((r) => {
    const type = railTypeRows.find((t) => t.slug === r.slug);
    if (!type) return [];
    return [
      {
        id: type.id,
        name: type.name,
        slug: type.slug,
        purpose: r.purpose,
        count: typeCounts[type.id] ?? 0,
        image: TYPE_IMAGES[type.slug] ?? "/images/home/prop-apartment.jpg",
      },
    ];
  });

  const localities: LocalityTile[] = cities.slice(0, 8).map((city) => ({
    id: city.id,
    name: city.name,
    slug: city.slug,
    state: city.state ?? null,
    count: cityCounts[city.id] ?? 0,
    // A city's own uploaded image wins over the editorial fallback.
    image: city.image_url ?? CITY_IMAGES[city.slug] ?? null,
  }));

  // Only figures that are both true and worth stating. Counts that are still
  // zero are dropped rather than displayed; the two policy figures hold
  // regardless of catalogue size.
  const statItems: StatItem[] = [
    ...(stats.listings > 0
      ? [{ id: "listings", value: `${stats.listings.toLocaleString("en-IN")}`, label: "Properties Listed" }]
      : []),
    ...(stats.verifiedSellers > 0
      ? [{ id: "sellers", value: `${stats.verifiedSellers.toLocaleString("en-IN")}`, label: "Verified Sellers" }]
      : []),
    { id: "cities", value: `${stats.cities}`, label: "Cities Covered" },
    { id: "brokerage", value: "₹0", label: "Brokerage on Contacts" },
    { id: "seekers", value: "Free", label: "For Home Seekers" },
  ].slice(0, 4);

  return (
    <div className={`${sora.variable} flex flex-col`}>
      <Hero
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        propertyTypes={propertyTypes.map((t) => ({
          slug: t.slug,
          name: t.name,
          category: t.category ?? null,
        }))}
      />
      <PropertyCategories categories={categories} />
      <ActionCards />
      <FeaturedProperties properties={landingProperties.map(toPremiumCard)} />
      <PopularLocalities localities={localities} />
      <WhyGharBazaar />
      <PostPropertyCTA />
      <Stats items={statItems} />
    </div>
  );
}

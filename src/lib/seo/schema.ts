/**
 * Typed JSON-LD schema builders for GharBazaar.
 * All functions return plain objects; caller wraps in <script type="application/ld+json">.
 * Validated against schema.org — do not hand-assemble JSON-LD outside this file.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharbazaar.in";
const SITE_NAME = "GharBazaar";

// ---------------------------------------------------------------------------
// Site-wide schemas (render once in root layout)
// ---------------------------------------------------------------------------

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["English", "Hindi"],
    },
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

// ---------------------------------------------------------------------------
// Listing detail page
// ---------------------------------------------------------------------------

export interface ListingSchemaInput {
  title: string;
  description?: string | null;
  slug: string;
  price: number;
  currency?: string;
  address?: string | null;
  locality?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bedrooms?: number | null;
  builtUpArea?: number | null;
  images?: string[];
  /** "https://pending" | "https://sold" | "https://discontinued" */
  availabilityStatus?: "InStock" | "Discontinued";
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export function listingSchema(p: ListingSchemaInput) {
  const url = `${SITE_URL}/property/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": ["RealEstateListing", "Residence"],
    name: p.title,
    ...(p.description ? { description: p.description } : {}),
    url,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: p.currency ?? "INR",
      availability: p.availabilityStatus === "Discontinued"
        ? "https://schema.org/Discontinued"
        : "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      ...(p.address ? { streetAddress: p.address } : {}),
      ...(p.locality ? { addressLocality: p.locality } : {}),
      ...(p.city ? { addressRegion: p.city } : {}),
      ...(p.state ? { addressRegion: p.state } : {}),
      ...(p.pincode ? { postalCode: p.pincode } : {}),
      addressCountry: "IN",
    },
    ...(p.latitude && p.longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: p.latitude, longitude: p.longitude } }
      : {}),
    ...(p.bedrooms != null ? { numberOfRooms: p.bedrooms } : {}),
    ...(p.builtUpArea ? { floorSize: { "@type": "QuantitativeValue", value: p.builtUpArea, unitCode: "FTK" } } : {}),
    ...(p.images?.length ? { image: p.images } : {}),
    ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
    ...(p.updatedAt ? { dateModified: p.updatedAt } : {}),
  };
}

// ---------------------------------------------------------------------------
// Browse / listing-list pages
// ---------------------------------------------------------------------------

export interface ItemListSchemaItem {
  name: string;
  url: string;
  image?: string;
  description?: string;
  price?: number;
}

export function itemListSchema(items: ItemListSchemaItem[], listName?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(listName ? { name: listName } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

// ---------------------------------------------------------------------------
// College / university page — AggregateOffer for per-bed prices
// ---------------------------------------------------------------------------

export interface AggregateOfferInput {
  name: string;
  url: string;
  lowPrice: number;
  highPrice: number;
  offerCount: number;
  priceCurrency?: string;
}

export function aggregateOfferSchema(o: AggregateOfferInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: o.name,
    url: o.url.startsWith("http") ? o.url : `${SITE_URL}${o.url}`,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: o.lowPrice,
      highPrice: o.highPrice,
      priceCurrency: o.priceCurrency ?? "INR",
      offerCount: o.offerCount,
    },
  };
}

// ---------------------------------------------------------------------------
// Seller profile page
// ---------------------------------------------------------------------------

export interface RealEstateAgentInput {
  name: string;
  slug: string;
  city?: string | null;
  image?: string | null;
  telephone?: string | null;
  description?: string | null;
  listingsCount?: number;
  ratingValue?: number | null;
  reviewCount?: number | null;
}

export function realEstateAgentSchema(s: RealEstateAgentInput) {
  const url = `${SITE_URL}/seller/${s.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: s.name,
    url,
    ...(s.image ? { image: s.image } : {}),
    ...(s.telephone ? { telephone: s.telephone } : {}),
    ...(s.description ? { description: s.description } : {}),
    ...(s.city ? { areaServed: s.city } : {}),
    ...(s.ratingValue && s.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: s.ratingValue,
            reviewCount: s.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

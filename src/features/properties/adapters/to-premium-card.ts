import type { PropertyCardData } from "@/components/properties/property-card";
import { formatArea, formatPrice } from "@/lib/utils/format";
import { resolveCoverImageUrl } from "@/lib/utils/storage";

/**
 * Adapter: existing property row -> premium landing card view model.
 *
 * The landing card renders a flatter, presentation-only shape than
 * PropertyCardData. Keeping the mapping here means the homepage design can
 * change without any query, schema or API change — and the existing
 * PropertyCard used across search and detail pages stays untouched.
 *
 * Every field is derived from real columns. Where a column is null the view
 * model carries null and the card omits that row entirely, so a sparse
 * listing degrades instead of rendering a fabricated value.
 */

/**
 * Property row plus the extra joins the landing card displays.
 *
 * `sellers.is_verified` is the seller's KYC flag — verification is a property
 * of the seller in this schema, not of the listing, so the card's Verified
 * badge reads from the joined seller rather than from the property row.
 */
export type LandingPropertyData = PropertyCardData & {
  bathrooms?: number | null;
  property_types?: { name: string } | null;
  sellers?: { is_verified: boolean } | null;
};

export interface PremiumPropertyView {
  id: string;
  href: string;
  title: string;
  priceLabel: string;
  /** Rent is a recurring figure; sale is not. Rendered smaller, beside price. */
  priceSuffix: string | null;
  city: string | null;
  locality: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaLabel: string | null;
  propertyType: string | null;
  verified: boolean;
  imageUrl: string | null;
}

export function toPremiumCard(property: LandingPropertyData): PremiumPropertyView {
  const cityName = property.cities?.name ?? null;
  const areaName = property.areas?.name ?? null;

  return {
    id: property.id,
    href: `/property/${property.slug}`,
    title: property.title,
    priceLabel: formatPrice(property.price),
    priceSuffix: property.purpose === "rent" ? "/mo" : null,
    city: cityName,
    // Fall back to the city so the location line never renders half-empty;
    // the card suppresses the duplicate when locality and city are equal.
    locality: areaName ?? cityName,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms ?? null,
    areaLabel:
      property.built_up_area != null
        ? formatArea(property.built_up_area, property.area_unit ?? "sqft")
        : null,
    propertyType: property.property_types?.name ?? null,
    verified: property.sellers?.is_verified ?? false,
    imageUrl: resolveCoverImageUrl(property.property_images),
  };
}

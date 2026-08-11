import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, BedDouble, Building2, MapPin, Square } from "lucide-react";
import type { PropertyCardData } from "@/components/properties/property-card";
import { formatArea, formatBhk, formatPrice } from "@/lib/utils/format";
import { resolveCoverImageUrl, SHIMMER_DATA_URL } from "@/lib/utils/storage";
import { cn } from "@/lib/utils";

/**
 * Hero photography panel.
 *
 * Renders a real, published listing — its own cover photo, its own price —
 * so the most prominent image on the site is always live inventory. Until the
 * catalogue has a photographed listing, it falls back to a coverage plate
 * drawn from the cities' real geo-pins, rather than a stock photo standing in
 * for stock we do not have.
 */

export interface CoverageCity {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

interface HeroVisualProps {
  property: PropertyCardData | null;
  coverage?: CoverageCity[];
  className?: string;
}

const frameClass =
  "relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-card " +
  "aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[480px]";

export function HeroVisual({ property, coverage = [], className }: HeroVisualProps) {
  const coverUrl = property ? resolveCoverImageUrl(property.property_images) : null;

  if (!property || !coverUrl) {
    return <HeroVisualFallback coverage={coverage} className={className} />;
  }

  const locality = property.areas?.name ?? property.cities?.name ?? null;
  const cityName = property.cities?.name;

  return (
    <div className={cn(frameClass, className)}>
      <Image
        src={coverUrl}
        alt={property.title}
        fill
        sizes="(max-width: 1024px) 100vw, 46vw"
        className="object-cover"
        placeholder="blur"
        blurDataURL={SHIMMER_DATA_URL}
        loading="eager"
        fetchPriority="high"
      />

      {/* Scrims — keep the overlay card legible and blend the frame into the page */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-transparent" />

      {/* Live-listing spotlight */}
      <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 lg:right-auto lg:w-[19rem]">
        <div className="rounded-2xl border border-white/[0.1] bg-card/80 p-4 backdrop-blur-xl shadow-elevated-lg">
          <div className="mb-2.5 flex items-center gap-2">
            {property.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/12 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
                <BadgeCheck className="h-3 w-3" aria-hidden />
                VERIFIED
              </span>
            )}
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {property.purpose === "rent" ? "For rent" : "For sale"}
            </span>
          </div>

          <h2 className="mb-1 line-clamp-1 text-sm font-semibold text-foreground">
            {property.title}
          </h2>

          {locality && (
            <p className="mb-2.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">
                {locality}
                {cityName && locality !== cityName ? `, ${cityName}` : ""}
              </span>
            </p>
          )}

          <p className="mb-3 text-lg font-semibold tracking-tight text-foreground">
            {formatPrice(property.price)}
            {property.purpose === "rent" && (
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            )}
          </p>

          {(property.bedrooms != null || property.built_up_area != null) && (
            <div className="mb-3 flex items-center gap-4 border-t border-white/[0.06] pt-3 text-xs text-muted-foreground">
              {property.bedrooms != null && (
                <span className="flex items-center gap-1.5">
                  <BedDouble className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
                  {formatBhk(property.bedrooms)}
                </span>
              )}
              {property.built_up_area != null && (
                <span className="flex items-center gap-1.5">
                  <Square className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
                  {formatArea(property.built_up_area, property.area_unit ?? "sqft")}
                </span>
              )}
            </div>
          )}

          <Link
            href={`/property/${property.slug}`}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            View details
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Photography-free state: a coverage plate. Pin positions come from each
 * city's stored latitude/longitude, normalised into the frame — stylised, but
 * drawn from the same geo-pins the university-distance engine uses.
 */
function HeroVisualFallback({
  coverage,
  className,
}: {
  coverage: CoverageCity[];
  className?: string;
}) {
  const geo = coverage.filter(
    (c): c is CoverageCity & { latitude: number; longitude: number } =>
      c.latitude != null && c.longitude != null
  );

  const lats = geo.map((c) => c.latitude);
  const lngs = geo.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  // Plot into the upper band only — the invitation card owns the lower half —
  // and drop labels that would collide, keeping the pin itself.
  const pins =
    geo.length >= 3
      ? geo.map((c, i) => ({
          id: c.id,
          name: c.name,
          left: 12 + ((c.longitude - minLng) / lngSpan) * 64,
          top: 16 + ((maxLat - c.latitude) / latSpan) * 40,
          ringed: i % 3 === 0,
        }))
      : [];

  return (
    <div className={cn(frameClass, "bg-gradient-to-br from-card via-muted/30 to-card", className)}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/[0.12] blur-[90px]" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-primary/[0.05] blur-[80px]" />
      <div className="absolute inset-0 blueprint-grid opacity-[0.045]" aria-hidden />

      <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
          Where we are live
        </p>
        {pins.length > 0 && (
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground">
            Braj &middot; Delhi NCR
          </span>
        )}
      </div>

      {pins.map((pin) => (
        <span
          key={pin.id}
          className="absolute h-2 w-2"
          style={{ left: `${pin.left}%`, top: `${pin.top}%` }}
          title={pin.name}
        >
          <span className="absolute inset-0 rounded-full bg-primary/60" />
          {pin.ringed && (
            <span className="absolute -inset-2 rounded-full border border-primary/20" />
          )}
        </span>
      ))}

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Invitation card */}
      <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 lg:right-auto lg:w-[19rem]">
        <div className="rounded-2xl border border-white/[0.1] bg-card/80 p-4 backdrop-blur-xl shadow-elevated-lg">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.08]">
            <Building2 className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <h2 className="mb-1.5 text-sm font-semibold text-foreground">
            Your property could be the first here
          </h2>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            We are onboarding verified owners across Braj and Delhi NCR. Listing is free,
            and seekers reach you directly.
          </p>
          <Link
            href="/list-property"
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            Post your property
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

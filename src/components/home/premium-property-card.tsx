"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BadgeCheck, Bath, BedDouble, Heart, Maximize, MapPin } from "lucide-react";
import type { PremiumPropertyView } from "@/features/properties/adapters/to-premium-card";
import { SHIMMER_DATA_URL } from "@/lib/utils/storage";
import { useShortlist } from "./shortlist-provider";
import { cn } from "@/lib/utils";

/**
 * Landing-page property card.
 *
 * Presentation only — every value arrives pre-formatted from
 * toPremiumCard(), and the whole card links to the real listing. The heart
 * writes through the favorites API; signed-out visitors are sent to login
 * with a return path rather than having the click quietly do nothing.
 */
export function PremiumPropertyCard({ property }: { property: PremiumPropertyView }) {
  const router = useRouter();
  const { ids, signedIn, toggle } = useShortlist();
  const saved = ids.has(property.id);

  function onHeartClick(e: React.MouseEvent) {
    // The card itself is a link; the heart must not navigate.
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      router.push(`/auth/login?next=${encodeURIComponent("/")}`);
      return;
    }
    void toggle(property.id);
  }

  const showLocality =
    property.locality && property.locality !== property.city ? property.locality : null;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)] transition-colors hover:border-primary/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {property.imageUrl ? (
          <Image
            src={property.imageUrl}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
            placeholder="blur"
            blurDataURL={SHIMMER_DATA_URL}
          />
        ) : (
          // No photo yet — a calm plate rather than a broken frame.
          <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-surface to-surface-2" />
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {property.verified ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-[11px] font-semibold text-success backdrop-blur">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Verified
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onHeartClick}
            aria-pressed={saved}
            aria-label={
              !signedIn
                ? `Sign in to shortlist ${property.title}`
                : saved
                  ? `Remove ${property.title} from shortlist`
                  : `Shortlist ${property.title}`
            }
            className="relative z-10 grid size-9 place-items-center rounded-md bg-background/85 text-foreground backdrop-blur transition-colors hover:text-primary"
          >
            <Heart
              className={cn("size-4.5", saved && "fill-primary text-primary")}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-base font-semibold text-foreground">
            {/* Stretched link — the whole card is the target, the heart sits above it. */}
            <Link href={property.href} className="after:absolute after:inset-0">
              <span className="line-clamp-1">{property.title}</span>
            </Link>
          </h3>
          <span className="shrink-0 text-base font-semibold text-primary">
            {property.priceLabel}
            {property.priceSuffix && (
              <span className="text-xs font-normal text-muted-foreground">
                {property.priceSuffix}
              </span>
            )}
          </span>
        </div>

        {(property.bedrooms != null || property.bathrooms != null || property.areaLabel) && (
          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {property.bedrooms != null && (
              <li className="inline-flex items-center gap-1.5">
                <BedDouble className="size-3.5" aria-hidden="true" />
                {property.bedrooms} BHK
              </li>
            )}
            {property.bathrooms != null && (
              <li className="inline-flex items-center gap-1.5">
                <Bath className="size-3.5" aria-hidden="true" />
                {property.bathrooms} Bath
              </li>
            )}
            {property.areaLabel && (
              <li className="inline-flex items-center gap-1.5">
                <Maximize className="size-3.5" aria-hidden="true" />
                {property.areaLabel}
              </li>
            )}
          </ul>
        )}

        {(showLocality || property.city) && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {showLocality ? `${showLocality}, ${property.city}` : property.city}
            </span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {property.propertyType ?? "Property"}
          </span>
          <span className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors group-hover:border-primary group-hover:text-primary">
            View Details
          </span>
        </div>
      </div>
    </article>
  );
}

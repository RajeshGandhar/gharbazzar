"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { MapPin, BedDouble, Square, CheckCircle2, Clock, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatBhk, formatFreshness, formatArea } from "@/lib/utils/format";
import { resolveOrderedImageUrls } from "@/lib/utils/storage";
import { cn } from "@/lib/utils";

export type PropertyCardData = {
  id: string;
  slug: string;
  title: string;
  price: number;
  purpose: "sale" | "rent" | "lease";
  city_id: number;
  area_id: number | null;
  bedrooms: number | null;
  built_up_area: number | null;
  area_unit?: string | null;
  rental_kind: string | null;
  gender_policy: string | null;
  is_featured: boolean;
  is_verified?: boolean;
  published_at: string | null;
  // from join
  areas?: { name: string; slug: string } | null;
  cities?: { name: string; slug: string } | null;
  property_images?: Array<{
    path: string;
    thumbnail_path?: string | null;
    is_cover: boolean;
    position?: number | null;
  }> | null;
};

interface PropertyCardProps {
  property: PropertyCardData;
  className?: string;
}

// Per-purpose gradient placeholder backgrounds
const placeholderGradients: Record<string, string> = {
  sale:  "from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/40",
  rent:  "from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/40",
  lease: "from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/40",
};

const purposeConfig: Record<string, { label: string; badgeClass: string }> = {
  sale:  { label: "For Sale", badgeClass: "bg-emerald-500/90 text-white border-0" },
  rent:  { label: "For Rent", badgeClass: "bg-blue-500/90 text-white border-0" },
  lease: { label: "Lease",    badgeClass: "bg-amber-500/90 text-white border-0" },
};

const genderLabel: Record<string, string> = {
  boys_only:   "Boys only",
  girls_only:  "Girls only",
  family_only: "Families",
};

// Swipeable / arrow-navigable image strip — native scroll-snap so touch
// swipe works with no gesture library; arrows + dots layer on top for mouse.
function ImageCarousel({ urls, title }: { urls: string[]; title: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function goTo(i: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = trackRef.current;
    if (!el) return;
    const clamped = (i + urls.length) % urls.length;
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }

  function handleScroll() {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none"
      >
        {urls.map((url, i) => (
          <div key={url} className="relative h-full w-full flex-none snap-start">
            <Image
              src={url}
              alt={`${title} — photo ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {urls.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => goTo(index - 1, e)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => goTo(index + 1, e)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {urls.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full bg-white transition-all duration-200",
                  i === index ? "w-3 opacity-100" : "w-1 opacity-50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function SaveButton({ propertyId }: { propertyId: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved((s) => !s);
      }}
      className={cn(
        "absolute top-3 right-3 z-10 h-8 w-8 rounded-full flex items-center justify-center",
        "bg-white/90 dark:bg-black/60 backdrop-blur-sm shadow-sm",
        "transition-all duration-200 hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
      )}
      aria-label={saved ? "Remove from saved" : "Save property"}
      aria-pressed={saved}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors duration-200",
          saved
            ? "fill-rose-500 text-rose-500"
            : "text-foreground/70 hover:text-rose-500"
        )}
      />
    </button>
  );
}

export function PropertyCard({ property: p, className }: PropertyCardProps) {
  const locality = p.areas?.name ?? p.cities?.name ?? "—";
  const imageUrls = resolveOrderedImageUrls(p.property_images, { thumbnail: true, limit: 6 });
  const isStudent = p.rental_kind === "student";
  const genderBadge =
    isStudent && p.gender_policy && p.gender_policy !== "any"
      ? genderLabel[p.gender_policy]
      : null;
  const purposeCfg = purposeConfig[p.purpose] ?? purposeConfig.rent;
  const placeholderGrad = placeholderGradients[p.purpose] ?? placeholderGradients.sale;

  return (
    <Link
      href={`/property/${p.slug}`}
      className={cn("group block focus-visible:outline-none", className)}
    >
      <div
        className={cn(
          "rounded-2xl border border-border bg-card overflow-hidden h-full flex flex-col",
          "shadow-card transition-all duration-300",
          "hover:shadow-elevated hover:-translate-y-0.5",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
        )}
      >
        {/* ── Image container ── */}
        <div className="relative aspect-[4/3] w-full overflow-hidden flex-shrink-0">
          {imageUrls.length > 0 ? (
            <>
              <ImageCarousel urls={imageUrls} title={p.title} />

              {/* Gradient for price readability */}
              <div className="absolute inset-x-0 bottom-0 z-1 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

              {/* Price — bottom left of image */}
              <div className="absolute bottom-3 left-3 z-10">
                <p className="text-white font-bold text-lg leading-none drop-shadow">
                  {formatPrice(p.price)}
                  {p.purpose === "rent" && (
                    <span className="text-sm font-normal text-white/80">/mo</span>
                  )}
                </p>
              </div>
            </>
          ) : (
            /* Premium placeholder — no image */
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br flex flex-col items-center justify-center",
                placeholderGrad
              )}
            >
              <div className="rounded-2xl bg-white/60 dark:bg-black/30 p-4 backdrop-blur-sm">
                <Square className="h-8 w-8 text-muted-foreground/50" />
              </div>
              {/* Price in placeholder */}
              <div className="absolute bottom-3 left-3">
                <p className="font-bold text-lg leading-none text-foreground">
                  {formatPrice(p.price)}
                  {p.purpose === "rent" && (
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            <Badge
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm",
                purposeCfg.badgeClass
              )}
            >
              {purposeCfg.label}
            </Badge>
            {p.is_featured && (
              <Badge className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/90 text-white border-0 shadow-sm">
                ★ Featured
              </Badge>
            )}
            {genderBadge && (
              <Badge className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/85 dark:bg-black/50 backdrop-blur-sm text-foreground border-0 shadow-sm">
                {genderBadge}
              </Badge>
            )}
          </div>

          {/* Save button */}
          <SaveButton propertyId={p.id} />
        </div>

        {/* ── Card body ── */}
        <div className="flex flex-col gap-1.5 p-4 flex-1">
          {/* Title */}
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {p.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
            <span className="truncate">{locality}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer chips */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/60">
            <div className="flex items-center gap-3">
              {p.bedrooms != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BedDouble className="h-3 w-3 text-muted-foreground/70" />
                  {formatBhk(p.bedrooms)}
                </span>
              )}
              {p.built_up_area != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Square className="h-3 w-3 text-muted-foreground/70" />
                  {formatArea(p.built_up_area, p.area_unit ?? "sqft")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {p.is_verified && (
                <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              )}
              {p.published_at && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {formatFreshness(p.published_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ──
export function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-card">
      <div className="aspect-[4/3] w-full skeleton-shimmer" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton-shimmer h-4 w-3/4 rounded-lg" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded-lg" />
        <div className="skeleton-shimmer h-3 w-1/3 rounded-lg" />
        <div className="pt-2 border-t border-border/60 flex gap-3">
          <div className="skeleton-shimmer h-3 w-16 rounded-lg" />
          <div className="skeleton-shimmer h-3 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Grid skeleton ──
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

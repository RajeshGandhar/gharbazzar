import Link from "next/link";
import Image from "next/image";
import { GraduationCap, MapPin } from "lucide-react";
import { isOptimizableImageUrl, SHIMMER_DATA_URL } from "@/lib/utils/storage";
import { cn } from "@/lib/utils";

/**
 * City tile. Renders the city's photograph the moment `cities.image_url` is
 * populated (Supabase-hosted or a local asset); until then it renders a
 * designed monogram plate — never a stock photo of somewhere else.
 */

export interface CityTileData {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
}

interface CityTileProps {
  city: CityTileData;
  href: string;
  /** Live listing count. Rendered only when > 0 — we never pad an empty city. */
  count?: number;
  variant?: "default" | "student";
  className?: string;
}

export function CityTile({
  city,
  href,
  count,
  variant = "default",
  className,
}: CityTileProps) {
  const hasPhoto = isOptimizableImageUrl(city.image_url);
  const Icon = variant === "student" ? GraduationCap : MapPin;
  const accent =
    variant === "student"
      ? "group-hover:border-violet-400/25"
      : "group-hover:border-primary/25";

  return (
    <Link
      href={href}
      // Secondary discovery link — skip the RSC prefetch so a data-light
      // phone does not pull a dozen route payloads on the homepage.
      prefetch={false}
      className={cn(
        "group relative isolate block aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.07]",
        "transition-all duration-300 hover:-translate-y-0.5",
        accent,
        className
      )}
    >
      {hasPhoto ? (
        <Image
          src={city.image_url as string}
          alt={`Property in ${city.name}`}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 15vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          placeholder="blur"
          blurDataURL={SHIMMER_DATA_URL}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            variant === "student"
              ? "from-violet-950/50 via-card to-card"
              : "from-emerald-950/40 via-card to-card"
          )}
          aria-hidden
        >
          <div className="absolute inset-0 blueprint-grid opacity-[0.05]" />
          <span
            className={cn(
              "absolute -right-1 -top-3 select-none text-[4.5rem] font-semibold leading-none tracking-tighter",
              variant === "student" ? "text-violet-400/[0.04]" : "text-primary/[0.04]"
            )}
          >
            {city.name.charAt(0)}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <Icon
          className={cn(
            "mb-1.5 h-3.5 w-3.5",
            variant === "student" ? "text-violet-400" : "text-primary"
          )}
          aria-hidden
        />
        <p className="text-sm font-semibold leading-tight text-foreground">{city.name}</p>
        {count != null && count > 0 && (
          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
            {count} {count === 1 ? "listing" : "listings"}
          </p>
        )}
      </div>
    </Link>
  );
}

import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Square, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatBhk, formatFreshness } from "@/lib/utils/format";
import { resolveCoverImageUrl } from "@/lib/utils/storage";
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
  rental_kind: string | null;
  gender_policy: string | null;
  is_featured: boolean;
  is_verified?: boolean;
  published_at: string | null;
  // from join
  areas?: { name: string; slug: string } | null;
  cities?: { name: string; slug: string } | null;
  // cover image — resolved from the joined property_images array (see resolveCoverImageUrl)
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

const purposeLabel: Record<string, string> = {
  sale:  "For Sale",
  rent:  "For Rent",
  lease: "Lease",
};

const genderLabel: Record<string, string> = {
  boys_only:   "Boys",
  girls_only:  "Girls",
  family_only: "Family",
};

export function PropertyCard({ property: p, className }: PropertyCardProps) {
  const locality = p.areas?.name ?? p.cities?.name ?? "—";
  const coverImageUrl = resolveCoverImageUrl(p.property_images, { thumbnail: true });
  const isStudent = p.rental_kind === "student";
  const genderBadge = isStudent && p.gender_policy && p.gender_policy !== "any"
    ? genderLabel[p.gender_policy]
    : null;

  return (
    <Link href={`/property/${p.slug}`} className={cn("group block", className)}>
      <Card className="tilt-3d shadow-elevated overflow-hidden border-border hover:shadow-elevated-lg hover:border-primary/30 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={p.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-smooth group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Square className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <Badge
              variant="secondary"
              className="bg-background/90 backdrop-blur-sm text-foreground text-[10px] font-semibold"
            >
              {purposeLabel[p.purpose] ?? p.purpose}
            </Badge>
            {p.is_featured && (
              <Badge className="bg-primary text-primary-foreground text-[10px]">
                Featured
              </Badge>
            )}
            {genderBadge && (
              <Badge variant="outline" className="bg-background/80 text-[10px]">
                {genderBadge}
              </Badge>
            )}
          </div>

          {/* Freshness */}
          {p.published_at && (
            <div className="absolute bottom-2 right-2">
              <span className="flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {formatFreshness(p.published_at)}
              </span>
            </div>
          )}
        </div>

        <CardContent className="flex flex-col gap-2 p-3 flex-1">
          {/* Price */}
          <p className="text-lg font-bold text-primary leading-tight">
            {formatPrice(p.price)}
            {p.purpose === "rent" && (
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            )}
          </p>

          {/* Title */}
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
            {p.title}
          </p>

          {/* Locality */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{locality}</span>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-border">
            {p.bedrooms != null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <BedDouble className="h-3 w-3" />
                {formatBhk(p.bedrooms)}
              </span>
            )}
            {p.built_up_area != null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Square className="h-3 w-3" />
                {p.built_up_area.toLocaleString("en-IN")} sqft
              </span>
            )}
            {p.is_verified && (
              <span className="ml-auto flex items-center gap-1 text-xs text-primary font-medium">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

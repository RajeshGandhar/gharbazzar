import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Star,
  StarOff,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { getSellerBySlug } from "@/features/sellers/server/queries";
import { listProperties } from "@/features/properties/server/queries";
import { cn } from "@/lib/utils";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

const sellerTypeLabel: Record<string, string> = {
  owner: "Owner",
  agent: "Agent",
  builder: "Builder",
  property_manager: "Property Manager",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: seller } = await getSellerBySlug(slug);
  if (!seller) return { title: "Seller not found" };

  const city = (seller as unknown as { cities?: { name: string } | null }).cities;
  const name = seller.business_name;
  const type = sellerTypeLabel[seller.seller_type] ?? seller.seller_type;

  return {
    title: `${name} — ${type}${city ? ` in ${city.name}` : ""} | GharBazaar`,
    description: seller.about?.slice(0, 160) || `${name} is a verified ${type.toLowerCase()} on GharBazaar.`,
  };
}

export default async function SellerProfilePage({ params }: Props) {
  const { slug } = await params;
  const { data: seller } = await getSellerBySlug(slug);
  if (!seller) notFound();

  const s = seller as typeof seller & {
    cities?: { id: number; name: string; slug: string } | null;
    profiles?: { full_name: string | null; avatar_url: string | null } | null;
  };

  // Fetch this seller's active listings
  const { data: listingsData } = await listProperties({
    sellerId: s.id,
    pagination: { page: 1, perPage: 12 },
  });
  const listings = (listingsData ?? []) as unknown as PropertyCardData[];

  const displayName = s.business_name || s.profiles?.full_name || "Seller";
  const city = s.cities;
  const typeLabel = sellerTypeLabel[s.seller_type] ?? s.seller_type;

  const memberSince = new Date(s.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/20">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3"
        >
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <li>
              <Link href="/" className="hover:text-primary transition-smooth">
                Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link
                href={city ? `/property-dealers/${city.slug}` : "/property-dealers"}
                className="hover:text-primary transition-smooth"
              >
                Property Dealers
              </Link>
            </li>
            {city && (
              <>
                <li aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li>
                  <Link
                    href={`/property-dealers/${city.slug}`}
                    className="hover:text-primary transition-smooth"
                  >
                    {city.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="font-medium text-foreground truncate max-w-[200px]">
              {displayName}
            </li>
          </ol>
        </nav>
      </div>

      {/* Profile hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
            {/* Avatar / logo */}
            <div className="shrink-0">
              <Avatar className="h-24 w-24 rounded-2xl border border-border shadow-md">
                <AvatarImage
                  src={s.logo_url || s.profiles?.avatar_url || undefined}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl text-2xl font-bold bg-primary/10 text-primary">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="border-primary/20 bg-primary/10 text-primary"
                >
                  {typeLabel}
                </Badge>
                {s.is_verified && (
                  <Badge
                    variant="outline"
                    className="border-green-400/40 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {displayName}
              </h1>

              {city && (
                <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{city.name}</span>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mt-3">
                {(s.avg_rating ?? 0) > 0 ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i <= Math.round(s.avg_rating ?? 0)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-muted text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {(s.avg_rating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({s.total_reviews} review{s.total_reviews !== 1 ? "s" : ""})
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <StarOff className="h-4 w-4" />
                    No reviews yet
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {s.experience_years && s.experience_years > 0 && (
                  <span>{s.experience_years}+ years experience</span>
                )}
                <span>Member since {memberSince}</span>
                <span>{listings.length} active listing{listings.length !== 1 ? "s" : ""}</span>
              </div>

              {/* About */}
              {s.about && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {s.about}
                </p>
              )}

              {/* CTA buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                {s.whatsapp_number && (
                  <a
                    href={`https://wa.me/91${s.whatsapp_number}?text=Hi%2C%20I%20found%20your%20profile%20on%20GharBazaar%20and%20would%20like%20to%20discuss%20a%20property.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants(), "gap-2")}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 fill-white"
                      aria-hidden
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.12 1.533 5.853L0 24l6.335-1.511A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 0 1-5.028-1.386l-.36-.215-3.751.894.953-3.655-.235-.374A9.795 9.795 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z" />
                    </svg>
                    WhatsApp
                  </a>
                )}
                {s.website && (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline" }))}
                  >
                    Visit website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-foreground mb-5">
          {listings.length > 0
            ? `${listings.length} active listing${listings.length !== 1 ? "s" : ""}`
            : "No active listings"}
        </h2>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="rounded-2xl bg-muted p-6">
              <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm max-w-sm">
              {displayName} has no active listings right now. Check back later or WhatsApp them directly.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

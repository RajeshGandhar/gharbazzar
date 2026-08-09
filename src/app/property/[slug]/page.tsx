import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  ChevronRight,
  Compass,
  GraduationCap,
  History,
  Layers,
  MapPin,
  MessageSquare,
  Navigation,
  Ruler,
  Shield,
  Square,
  Star,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { PropertyMap } from "@/features/properties/components/property-map";
import { PropertyQR } from "@/features/properties/components/property-qr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getPropertyBySlug,
  resolveOldSlug,
} from "@/features/properties/server/queries";
import {
  formatPrice,
  formatRent,
  formatBhk,
  formatArea,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { ContactReveal } from "@/components/shared/contact-reveal";
import { InquiryForm } from "@/components/shared/inquiry-form";
import { ScheduleVisitButton } from "@/components/shared/schedule-visit-button";
import { EmiCalculator } from "@/components/properties/emi-calculator";
import { getPropertyImageUrl } from "@/lib/utils/storage";
import { listingSchema } from "@/lib/seo/schema";
import { ShareButton } from "@/components/shared/share-button";
import { SimilarProperties } from "@/components/properties/similar-properties";
import { GalleryGrid } from "@/components/properties/gallery-grid";
import { PriceHistoryChart } from "@/components/properties/price-history-chart";
import { ReportListingDialog } from "@/components/properties/report-listing-dialog";
import { formatFreshness } from "@/lib/utils/format";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

// ---------------------------------------------------------------------------
// Amenity icon mapping
// ---------------------------------------------------------------------------
function AmenityIcon({ slug }: { slug: string }) {
  const cls = "h-4 w-4";
  switch (slug) {
    case "wifi":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
    case "parking":
    case "car_parking":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>;
    case "security":
    case "cctv":
      return <Shield className={cls} />;
    case "lift":
    case "elevator":
      return <Layers className={cls} />;
    case "power_backup":
    case "generator":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
    case "gym":
    case "gymnasium":
    default:
      return <CheckCircle2 className={cls} />;
  }
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

type SellerShape = {
  id: string; slug: string; business_name: string | null; about: string | null;
  whatsapp_number: string | null; logo_url: string | null; is_verified: boolean;
  avg_rating: number | null; total_reviews: number; seller_type: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

const sellerTypeLabel: Record<string, string> = {
  owner: "Owner", agent: "Agent", builder: "Builder", property_manager: "Property Manager",
};

// Contact box — rendered in sidebar and in the mobile sheet. Hoisted to
// module scope (not a render-time closure) so ContactReveal/InquiryForm/
// ScheduleVisitButton keep their own state across parent re-renders.
function PropertyContactBox({
  seller,
  sellerName,
  propertyId,
  propertyTitle,
  propertySlug,
}: {
  seller: SellerShape | null | undefined;
  sellerName: string;
  propertyId: string;
  propertyTitle: string;
  propertySlug: string;
}) {
  const waUrl = seller?.whatsapp_number
    ? `https://wa.me/91${seller.whatsapp_number}?text=Hi%2C%20I%27m%20interested%20in%20${encodeURIComponent(propertyTitle)}`
    : null;

  return (
    <div className="flex flex-col gap-4">
      {seller && (
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={seller.logo_url || seller.profiles?.avatar_url || undefined} alt={sellerName} />
            <AvatarFallback className="text-sm font-semibold">
              {sellerName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link href={`/seller/${seller.slug}`} className="text-sm font-semibold text-foreground hover:text-primary transition-smooth leading-tight">
              {sellerName}
            </Link>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <Badge variant="secondary" className="text-[10px] py-0">
                {sellerTypeLabel[seller.seller_type] ?? seller.seller_type}
              </Badge>
              {seller.is_verified && (
                <Badge variant="outline" className="text-[10px] py-0 border-primary/40 text-primary">
                  <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                  Verified
                </Badge>
              )}
            </div>
            {(seller.avg_rating ?? 0) > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs text-muted-foreground">
                  {seller.avg_rating?.toFixed(1)} ({seller.total_reviews} reviews)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <Separator />

      <ContactReveal
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        sellerName={sellerName}
        propertySlug={propertySlug}
        whatsappNumber={seller?.whatsapp_number ?? null}
      />

      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2")}
        >
          <WhatsAppIcon className="h-4 w-4 text-green-600" />
          WhatsApp
        </a>
      )}

      <Dialog>
        <DialogTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2")}>
          <MessageSquare className="h-4 w-4" />
          Send inquiry
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send an inquiry</DialogTitle>
          </DialogHeader>
          <InquiryForm propertyId={propertyId} sellerName={sellerName} />
        </DialogContent>
      </Dialog>

      <ScheduleVisitButton propertyId={propertyId} propertySlug={propertySlug} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: property } = await getPropertyBySlug(slug);
  if (!property) return { title: "Property not found" };

  const p = property as typeof property & {
    cities?: { name: string } | null;
    areas?: { name: string } | null;
    property_images?: Array<{ path: string; is_cover: boolean }> | null;
  };

  const fallbackTitle = `${p.title} in ${p.areas?.name ?? ""}, ${p.cities?.name ?? ""}`;
  const coverImagePath = (p.property_images ?? []).find((img) => img.is_cover)?.path;
  const coverImage = coverImagePath ? getPropertyImageUrl(coverImagePath) : null;

  return {
    title: p.seo_title || fallbackTitle,
    description: p.seo_description || p.description?.slice(0, 160) || fallbackTitle,
    alternates: { canonical: `/property/${slug}` },
    openGraph: {
      title: p.seo_title || fallbackTitle,
      description: p.seo_description || p.description?.slice(0, 160),
      images: p.og_image_url ? [p.og_image_url] : coverImage ? [coverImage] : [],
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;

  const { data: property } = await getPropertyBySlug(slug);

  if (!property) {
    const oldSlugData = await resolveOldSlug(slug);
    const newSlug = (oldSlugData as unknown as { properties?: { slug: string } | null })?.properties?.slug;
    if (newSlug) redirect(`/property/${newSlug}`);
    notFound();
  }

  // Type the joined shape (SellerShape is hoisted to module scope, above)
  type PropertyImage = { path: string; thumbnail_path: string | null; is_cover: boolean; position: number };
  type AmenityRow = { amenity_id: number; amenities: { id: number; name: string; slug: string; icon: string | null } | null };
  type NearbyPlace = { id: string; kind: string; name: string; distance_km: number };
  type RoomType = {
    id: string; name: string | null; sharing_count: number; monthly_rent_per_bed: number;
    security_deposit: number | null; is_ac: boolean; meal_plan: string | null;
    attached_bathroom: boolean; total_beds: number; available_beds: number; is_active: boolean;
  };
  type PropUni = {
    computed_distance_m: number;
    universities: { id: number; name: string; slug: string; institution_type: string; logo_url: string | null } | null;
  };

  const p = property as typeof property & {
    cities?: { id: number; name: string; slug: string } | null;
    areas?: { id: number; name: string; slug: string } | null;
    property_types?: { id: number; name: string; slug: string; category: string } | null;
    property_images?: PropertyImage[] | null;
    sellers?: SellerShape | null;
    property_amenities?: AmenityRow[] | null;
    nearby_places?: NearbyPlace[] | null;
    room_types?: RoomType[] | null;
    property_universities?: PropUni[] | null;
    price_history?: { old_price: number | null; new_price: number; changed_at: string }[] | null;
  };

  const seller = p.sellers;
  // property_images.path is a Supabase Storage object key, not a fetchable
  // URL — must be resolved before it reaches next/image.
  const rawImages = (p.property_images ?? []) as PropertyImage[];
  const images = [...rawImages]
    .sort((a, b) => (a.is_cover ? -1 : b.is_cover ? 1 : a.position - b.position))
    .map((img): PropertyImage & { url: string | null } => ({ ...img, url: getPropertyImageUrl(img.path) }))
    .filter((img): img is PropertyImage & { url: string } => img.url !== null);
  const amenities = (p.property_amenities ?? []).filter((a) => a.amenities);
  const nearbyPlaces = p.nearby_places ?? [];
  const roomTypes = (p.room_types ?? []).filter((r) => r.is_active);
  const nearbyUniversities = (p.property_universities ?? []).filter((pu) => pu.universities);
  const priceHistory = p.price_history ?? [];

  const isStudentHousing = p.rental_kind === "student";
  const isSale = p.purpose === "sale";
  const priceDisplay = isSale ? formatPrice(p.price) : formatRent(p.price);

  const sellerName = seller?.business_name || seller?.profiles?.full_name || "Seller";
  const breadcrumbSection = isSale
    ? { label: "Buy", href: "/buy" }
    : isStudentHousing
    ? { label: "Student Housing", href: "/student-housing" }
    : { label: "Rent", href: "/rent" };

  const sharingLabel: Record<number, string> = { 1: "Single", 2: "Double sharing", 3: "Triple sharing" };

  const coverImages = rawImages
    .slice(0, 5)
    .map((img) => getPropertyImageUrl(img.path))
    .filter((url): url is string => url !== null);

  const jsonLd = listingSchema({
    title: p.title,
    description: p.description,
    slug: p.slug,
    price: p.price,
    address: p.address,
    locality: p.areas?.name,
    city: p.cities?.name,
    state: p.state,
    pincode: p.pincode,
    latitude: p.latitude,
    longitude: p.longitude,
    bedrooms: p.bedrooms,
    builtUpArea: p.built_up_area,
    images: coverImages,
    availabilityStatus: p.status === "active" ? "InStock" : "Discontinued",
    publishedAt: p.published_at,
    updatedAt: p.updated_at,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-col">
        {p.status !== "active" && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
            <div className="mx-auto max-w-7xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                This listing is currently{" "}
                <strong>{p.status === "expired" ? "expired" : "unavailable"}</strong>.
                It may have been sold or removed by the seller.
              </p>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/20">
          <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
              <li><Link href="/" className="hover:text-primary transition-smooth">Home</Link></li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><Link href={breadcrumbSection.href} className="hover:text-primary transition-smooth">{breadcrumbSection.label}</Link></li>
              {p.cities && (
                <>
                  <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
                  <li>
                    <Link href={`${breadcrumbSection.href}/${p.cities.slug}`} className="hover:text-primary transition-smooth">
                      {p.cities.name}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="font-medium text-foreground truncate max-w-[200px]">{p.title}</li>
            </ol>
          </nav>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">

            {/* ── Main column ──────────────────────────────── */}
            <div className="flex flex-col gap-8 min-w-0">

              {/* Gallery */}
              <section aria-label="Property images">
                {images.length === 0 ? (
                  <div className="aspect-[16/9] w-full rounded-2xl bg-muted flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Square className="h-16 w-16 opacity-20" />
                      <span className="text-sm">No images available</span>
                    </div>
                  </div>
                ) : (
                  <GalleryGrid images={images} title={p.title} />
                )}
              </section>

              {/* Title + Price */}
              <section>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {p.is_featured && <Badge className="bg-primary text-primary-foreground text-[10px]">Featured</Badge>}
                      {p.is_sponsored && <Badge variant="outline" className="text-[10px]">Sponsored</Badge>}
                      {isStudentHousing && (
                        <Badge variant="secondary" className="text-[10px] border-primary/20 bg-primary/10 text-primary">
                          <GraduationCap className="mr-1 h-2.5 w-2.5" />
                          Student Housing
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl leading-tight">{p.title}</h1>
                    {(p.cities || p.areas) && (
                      <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{[p.areas?.name, p.cities?.name].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {p.published_at && (
                        <span className="text-xs text-muted-foreground">
                          Posted {formatFreshness(p.published_at)}
                        </span>
                      )}
                      {(p.views_count ?? 0) > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · {(p.views_count as number).toLocaleString("en-IN")} views
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right flex flex-col items-end gap-2">
                    <p className="text-3xl font-bold text-primary">{priceDisplay}</p>
                    {p.is_negotiable && <Badge variant="secondary" className="text-[10px]">Negotiable</Badge>}
                    {p.price_per_sqft && p.price_per_sqft > 0 && (
                      <p className="text-xs text-muted-foreground">₹{p.price_per_sqft.toLocaleString("en-IN")}/sqft</p>
                    )}
                    <ShareButton url={`/property/${p.slug}`} title={p.title} />
                  </div>
                </div>
              </section>

              {/* Key facts */}
              <section>
                <div className="flex flex-wrap gap-3">
                  {p.bedrooms != null && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <BedDouble className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{formatBhk(p.bedrooms)}</span>
                    </div>
                  )}
                  {p.built_up_area && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <Ruler className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{formatArea(p.built_up_area, p.area_unit ?? "sqft")}</span>
                    </div>
                  )}
                  {p.bathrooms != null && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <Bath className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{p.bathrooms} Bath</span>
                    </div>
                  )}
                  {p.floor_number != null && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Floor {p.floor_number}{p.total_floors ? ` of ${p.total_floors}` : ""}
                      </span>
                    </div>
                  )}
                  {p.furnishing && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium capitalize">{p.furnishing.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  {isSale && p.construction_status && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <Square className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium capitalize">{p.construction_status.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  {isSale && p.possession_date && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Possession: {new Date(p.possession_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {!isSale && p.available_from && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Available: {new Date(p.available_from).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {p.parking_spaces != null && p.parking_spaces > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <Car className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{p.parking_spaces} Parking</span>
                    </div>
                  )}
                  {p.facing && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <Compass className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium capitalize">{p.facing.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  {p.property_age_years != null && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <History className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {p.property_age_years === 0 ? "New construction" : `${p.property_age_years} yr${p.property_age_years > 1 ? "s" : ""} old`}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Description */}
              {p.description && (
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-3">About this property</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{p.description}</p>
                </section>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {amenities.map(({ amenities: amenity }) =>
                      amenity ? (
                        <div key={amenity.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3">
                          <span className="text-primary shrink-0">
                            <AmenityIcon slug={amenity.slug} />
                          </span>
                          <span className="text-xs font-medium text-foreground truncate">{amenity.name}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </section>
              )}

              {/* EMI calculator (purchase properties only) */}
              {isSale && <EmiCalculator price={p.price} />}

              {/* Price history */}
              {priceHistory.length > 0 && (
                <PriceHistoryChart history={priceHistory} currentPrice={p.price} />
              )}

              {/* Room types (student housing) */}
              {isStudentHousing && roomTypes.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Room options &amp; availability</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {roomTypes.map((room) => (
                      <Card key={room.id} className="border-border hover:border-primary/30 transition-smooth">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">
                              {room.name || sharingLabel[room.sharing_count] || `${room.sharing_count}-sharing`}
                            </CardTitle>
                            <span className="text-sm font-bold text-primary shrink-0">{formatRent(room.monthly_rent_per_bed)}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1.5">
                            {room.is_ac && <Badge variant="secondary" className="text-[10px]">AC</Badge>}
                            {room.attached_bathroom && <Badge variant="secondary" className="text-[10px]">Attached bath</Badge>}
                            {room.meal_plan && room.meal_plan !== "none" && (
                              <Badge variant="secondary" className="text-[10px] capitalize">{room.meal_plan.replace(/_/g, " ")} meals</Badge>
                            )}
                            <Badge
                              variant={room.available_beds > 0 ? "default" : "destructive"}
                              className="text-[10px] ml-auto"
                            >
                              {room.available_beds > 0 ? `${room.available_beds} bed${room.available_beds > 1 ? "s" : ""} available` : "Full"}
                            </Badge>
                          </div>
                          {room.security_deposit && (
                            <p className="text-xs text-muted-foreground mt-2">Security deposit: {formatPrice(room.security_deposit)}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Nearby universities */}
              {nearbyUniversities.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Nearby universities</h2>
                  <div className="flex flex-col gap-2">
                    {nearbyUniversities.map(({ universities: uni, computed_distance_m }) =>
                      uni ? (
                        <Link
                          key={uni.id}
                          href={`/college/${uni.slug}`}
                          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-smooth hover:border-primary/40 hover:bg-accent"
                        >
                          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                            <GraduationCap className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{uni.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{uni.institution_type.replace(/_/g, " ")}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Navigation className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-semibold text-primary">{formatDistance(computed_distance_m)}</span>
                          </div>
                        </Link>
                      ) : null
                    )}
                  </div>
                </section>
              )}

              {/* Map */}
              {p.latitude && p.longitude && (
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Location</h2>
                  <PropertyMap latitude={p.latitude} longitude={p.longitude} title={p.title} />
                </section>
              )}

              {/* Nearby places */}
              {nearbyPlaces.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Nearby places</h2>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {nearbyPlaces.map((place) => (
                      <div key={place.id} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{place.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{place.kind.replace(/_/g, " ")}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {place.distance_km < 1 ? `${Math.round(place.distance_km * 1000)} m` : `${place.distance_km.toFixed(1)} km`}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Seller info — mobile only */}
              {seller && (
                <section className="lg:hidden">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Listed by</h2>
                  <Card>
                    <CardContent className="pt-5">
                      <PropertyContactBox
                        seller={seller}
                        sellerName={sellerName}
                        propertyId={p.id}
                        propertyTitle={p.title}
                        propertySlug={p.slug}
                      />
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Similar properties */}
              {p.cities && (
                <SimilarProperties
                  excludeId={p.id}
                  cityId={p.cities.id}
                  purpose={p.purpose}
                  price={p.price}
                  citySlug={p.cities.slug}
                  purposePath={isSale ? "buy" : isStudentHousing ? "student-housing" : "rent"}
                />
              )}

              {/* Platform disclaimer */}
              <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-px" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  GharBazaar is a discovery platform, not a party to any
                  transaction.{" "}
                  <strong className="text-foreground">
                    Never pay deposits before visiting the property.
                  </strong>
                </p>
              </div>

              {/* Report listing */}
              <div className="flex justify-end">
                <ReportListingDialog propertyId={p.id} />
              </div>
            </div>

            {/* ── Desktop sidebar ───────────────────────────────────── */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-3">
                <Card className="shadow-elevated-lg">
                  <CardContent className="pt-6">
                    <PropertyContactBox
                        seller={seller}
                        sellerName={sellerName}
                        propertyId={p.id}
                        propertyTitle={p.title}
                        propertySlug={p.slug}
                      />
                  </CardContent>
                </Card>
                <div className="flex justify-end">
                  <PropertyQR slug={p.slug} title={p.title} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile sticky bottom bar ─────────────────────────────── */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 z-50">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Sheet>
              <SheetTrigger className={cn(buttonVariants({ variant: "outline" }), "flex-1 gap-2")}>
                <MessageSquare className="h-4 w-4" />
                Contact
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[90dvh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Contact seller</SheetTitle>
                </SheetHeader>
                <div className="mt-4 pb-4">
                  <PropertyContactBox
                        seller={seller}
                        sellerName={sellerName}
                        propertyId={p.id}
                        propertyTitle={p.title}
                        propertySlug={p.slug}
                      />
                </div>
              </SheetContent>
            </Sheet>

            {seller?.whatsapp_number && (
              <a
                href={`https://wa.me/91${seller.whatsapp_number}?text=Hi%2C%20I%27m%20interested%20in%20${encodeURIComponent(p.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants(), "flex-1 gap-2 bg-green-600 hover:bg-green-700 border-green-600")}
              >
                <WhatsAppIcon className="h-4 w-4 fill-white" />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Bottom padding for mobile bar */}
        <div className="lg:hidden h-20" aria-hidden />
      </div>
    </>
  );
}

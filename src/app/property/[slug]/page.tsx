import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flag,
  GraduationCap,
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

// WhatsApp SVG icon reused multiple times
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("fill-current", className)}
    aria-hidden
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.12 1.533 5.853L0 24l6.335-1.511A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 0 1-5.028-1.386l-.36-.215-3.751.894.953-3.655-.235-.374A9.795 9.795 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z" />
  </svg>
);

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
  const coverImage = (p.property_images ?? []).find((img) => img.is_cover)?.path;

  return {
    title: p.seo_title || fallbackTitle,
    description: p.seo_description || p.description?.slice(0, 160) || fallbackTitle,
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

  // Type the joined shape
  type PropertyImage = { path: string; thumbnail_path: string | null; is_cover: boolean; position: number };
  type SellerShape = {
    id: string; slug: string; business_name: string | null; about: string | null;
    whatsapp_number: string | null; logo_url: string | null; is_verified: boolean;
    avg_rating: number | null; total_reviews: number; seller_type: string;
    profiles?: { full_name: string | null; avatar_url: string | null } | null;
  };
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
  };

  const seller = p.sellers;
  const images = [...(p.property_images ?? [])].sort(
    (a, b) => (a.is_cover ? -1 : b.is_cover ? 1 : a.position - b.position)
  );
  const amenities = (p.property_amenities ?? []).filter((a) => a.amenities);
  const nearbyPlaces = p.nearby_places ?? [];
  const roomTypes = (p.room_types ?? []).filter((r) => r.is_active);
  const nearbyUniversities = (p.property_universities ?? []).filter((pu) => pu.universities);

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
  const sellerTypeLabel: Record<string, string> = {
    owner: "Owner", agent: "Agent", builder: "Builder", property_manager: "Property Manager",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    description: p.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/property/${p.slug}`,
    offers: { "@type": "Offer", price: p.price, priceCurrency: "INR" },
    address: {
      "@type": "PostalAddress",
      streetAddress: p.address,
      addressLocality: p.areas?.name,
      addressRegion: p.state,
      postalCode: p.pincode,
      addressCountry: "IN",
    },
    ...(p.latitude && p.longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: p.latitude, longitude: p.longitude } }
      : {}),
  };

  // Contact box — rendered both in sidebar and sheet
  function ContactBox() {
    const waUrl = seller?.whatsapp_number
      ? `https://wa.me/91${seller.whatsapp_number}?text=Hi%2C%20I%27m%20interested%20in%20${encodeURIComponent(p.title)}`
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
          propertyId={p.id}
          propertyTitle={p.title}
          sellerName={sellerName}
          propertySlug={p.slug}
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
            <InquiryForm propertyId={p.id} />
          </DialogContent>
        </Dialog>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          GharBazaar connects buyers and sellers.{" "}
          <strong>Never pay deposits before visiting.</strong>
        </p>
      </div>
    );
  }

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
                  <div className={cn("grid gap-2", images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                    <div className={cn(
                      "relative overflow-hidden rounded-xl bg-muted aspect-[4/3]",
                      images.length >= 3 ? "row-span-2" : ""
                    )}>
                      <Image
                        src={images[0].path}
                        alt={`${p.title} — main photo`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 700px"
                        className="object-cover"
                        priority
                      />
                      <div className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs text-white font-medium">
                        1 / {images.length}
                      </div>
                    </div>

                    {images.slice(1, 3).map((img, idx) => (
                      <div key={img.path} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                        <Image
                          src={img.path}
                          alt={`${p.title} — photo ${idx + 2}`}
                          fill
                          sizes="(max-width: 1024px) 50vw, 350px"
                          className="object-cover"
                        />
                        {idx === 1 && images.length > 3 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="text-white font-semibold text-lg">+{images.length - 3} more</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-3xl font-bold text-primary">{priceDisplay}</p>
                    {p.is_negotiable && <Badge variant="secondary" className="text-[10px] mt-1">Negotiable</Badge>}
                    {p.price_per_sqft && p.price_per_sqft > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">₹{p.price_per_sqft.toLocaleString("en-IN")}/sqft</p>
                    )}
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
                      <span className="text-sm font-medium">{formatArea(p.built_up_area, (p.area_unit as "sqft" | "gaj") || "sqft")}</span>
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
                      <ContactBox />
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Report listing */}
              <div className="flex justify-end">
                <Dialog>
                  <DialogTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-smooth">
                    <Flag className="h-3.5 w-3.5" />
                    Report this listing
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Report listing</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-muted-foreground">Why are you reporting this listing?</p>
                      {[
                        "Inaccurate information",
                        "Property no longer available",
                        "Suspected scam or fraud",
                        "Duplicate listing",
                        "Offensive content",
                        "Other",
                      ].map((reason) => (
                        <button
                          key={reason}
                          className="text-left rounded-lg border border-border px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-accent transition-smooth"
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* ── Desktop sidebar ───────────────────────────────────── */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <Card>
                  <CardContent className="pt-6">
                    <ContactBox />
                  </CardContent>
                </Card>
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
                  <ContactBox />
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

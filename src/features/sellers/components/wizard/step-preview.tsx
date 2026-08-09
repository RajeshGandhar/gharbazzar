"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { formatArea, formatPrice, formatRent } from "@/lib/utils/format";

interface StepPreviewProps {
  propertyId: string;
  property: {
    id: string;
    slug: string;
    title: string;
    price: number;
    purpose: "sale" | "rent" | "lease";
    city_id: number;
    area_id: number | null;
    bedrooms: number | null;
    bathrooms?: number | null;
    built_up_area: number | null;
    area_unit?: string | null;
    plot_area?: number | null;
    rental_kind: string | null;
    gender_policy: string | null;
    is_featured: boolean;
    published_at: string | null;
    description?: string;
    address?: string;
    areas?: { name: string; slug: string } | null;
    cities?: { name: string; slug: string } | null;
    property_images?: Array<{ path: string; is_cover: boolean; position?: number }>;
  };
  onBack: () => void;
}

const PURPOSE_LABEL: Record<string, string> = {
  sale: "For Sale",
  rent: "For Rent",
  lease: "For Lease",
};

export function StepPreview({ propertyId, property, onBack }: StepPreviewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const imageCount = property.property_images?.length ?? 0;
  const descLen = property.description?.trim().length ?? 0;
  const areaValue = property.built_up_area ?? property.plot_area;
  const areaUnit = property.area_unit ?? "sqft";

  const checks = [
    { label: "3 or more photos uploaded",  done: imageCount >= 3 },
    { label: "Price set",                  done: property.price > 0 },
    { label: "Description (20+ chars)",    done: descLen >= 20 },
    { label: "Location selected",          done: property.city_id > 0 },
    { label: "Bedrooms or area entered",   done: !!(property.bedrooms || areaValue) },
  ];

  const allGood = checks.every((c) => c.done);

  const cardData: PropertyCardData = {
    id: property.id,
    slug: property.slug,
    title: property.title,
    price: property.price,
    purpose: property.purpose,
    city_id: property.city_id,
    area_id: property.area_id,
    bedrooms: property.bedrooms,
    built_up_area: property.built_up_area,
    area_unit: property.area_unit,
    rental_kind: property.rental_kind,
    gender_policy: property.gender_policy,
    is_featured: property.is_featured,
    published_at: property.published_at,
    areas: property.areas,
    cities: property.cities,
    property_images: property.property_images,
  };

  async function handleSubmit() {
    setLoading(true);
    setServerError(null);
    try {
      const res = await fetch(`/api/v1/properties/${propertyId}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        setSubmitted(true);
        return;
      }
      const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
      setServerError(data?.error?.message ?? "Failed to submit for review. Please try again.");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
          <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Submitted for review!</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            We&apos;ll review your listing within 4 hours and notify you once it&apos;s live.
          </p>
        </div>
        <Link href="/dealer/listings" className={buttonVariants({ className: "mt-2" })}>
          View my listings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Checklist */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
        <p className="text-sm font-semibold">Listing checklist</p>
        {checks.map(({ label, done }) => (
          <div key={label} className="flex items-center gap-3">
            {done ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
        ))}
        {!allGood && (
          <p className="text-xs text-muted-foreground pt-1 border-t border-border">
            Incomplete items may lead to rejection. You can still submit and fix later.
          </p>
        )}
      </div>

      {/* Key specs summary */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-semibold">Listing summary</p>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="font-medium text-foreground">
            {PURPOSE_LABEL[property.purpose] ?? property.purpose}
          </span>
          <span className="font-medium text-primary">
            {property.purpose === "sale"
            ? formatPrice(property.price)
            : formatRent(property.price)}
          </span>
        </div>

        {(property.cities || property.areas || property.address) && (
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-px" />
            <span>
              {[
                property.areas?.name,
                property.cities?.name,
              ].filter(Boolean).join(", ") || property.address || "—"}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
            </span>
          )}
          {areaValue != null && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {formatArea(areaValue, areaUnit)}
            </span>
          )}
        </div>

        {descLen > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground line-clamp-4 leading-relaxed">
              {property.description}
            </p>
          </div>
        )}
      </div>

      {/* Card preview */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">
          How your listing appears in search results:
        </p>
        <div className="max-w-xs mx-auto">
          <PropertyCard property={cardData} />
        </div>
      </div>

      {serverError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button variant="outline" onClick={() => router.push("/dealer/listings")} className="flex-1">
          Save as draft
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            "Submit for review"
          )}
        </Button>
      </div>
    </div>
  );
}

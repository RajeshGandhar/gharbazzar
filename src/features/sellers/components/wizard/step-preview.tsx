"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, CheckSquare, Square, CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";

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
    built_up_area: number | null;
    rental_kind: string | null;
    gender_policy: string | null;
    is_featured: boolean;
    published_at: string | null;
    description?: string;
    areas?: { name: string; slug: string } | null;
    cities?: { name: string; slug: string } | null;
    property_images?: Array<{ path: string; is_cover: boolean }>;
  };
  onBack: () => void;
}

export function StepPreview({ propertyId, property, onBack }: StepPreviewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Checklist
  const imageCount = property.property_images?.length ?? 0;

  const checks = [
    {
      label: "3+ photos uploaded",
      done: imageCount >= 3,
    },
    {
      label: "Price set",
      done: property.price > 0,
    },
    {
      label: "Description written",
      done: (property.description?.trim()?.length ?? 0) >= 20,
    },
    {
      label: "Location selected",
      done: property.city_id > 0,
    },
  ];

  // Build card data — PropertyCard resolves the cover image URL itself from property_images
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
              <CheckSquare className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Preview card */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">
          Preview — how seekers will see your listing:
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

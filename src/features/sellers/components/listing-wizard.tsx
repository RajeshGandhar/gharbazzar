"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { StepBasics } from "./wizard/step-basics";
import { StepLocation } from "./wizard/step-location";
import { StepDetails } from "./wizard/step-details";
import { StepMedia } from "./wizard/step-media";
import { StepPreview } from "./wizard/step-preview";

interface PropertyType {
  id: number;
  name: string;
  slug: string;
  category: string;
}

interface City {
  id: number;
  name: string;
  slug: string;
  state: string;
}

interface Amenity {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

interface PropertyData {
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
  property_type_id?: number;
  is_negotiable?: boolean;
  security_deposit?: number;
  address?: string;
  landmark?: string | null;
  pincode?: string | null;
  state?: string;
  carpet_area?: number | null;
  floor_number?: number | null;
  total_floors?: number | null;
  parking_spaces?: number;
  furnishing?: string | null;
  construction_status?: string | null;
  facing?: string | null;
  available_from?: string | null;
  lock_in_months?: number | null;
  has_warden?: boolean;
  curfew_time?: string | null;
  mess_type?: string | null;
  seller_id?: string;
  areas?: { name: string; slug: string } | null;
  cities?: { name: string; slug: string } | null;
  property_images?: Array<{ id: string; path: string; is_cover: boolean; position: number }>;
  room_types?: Array<{
    id: string;
    name: string | null;
    sharing_count: number;
    monthly_rent_per_bed: number;
    security_deposit: number | null;
    is_ac: boolean;
    meal_plan: string;
    attached_bathroom: boolean;
    total_beds: number;
    available_beds: number;
  }>;
  property_amenities?: Array<{ amenity_id: number }>;
}

interface ListingWizardProps {
  property: PropertyData | null;
  sellerId: string;
  cities: City[];
  propertyTypes: PropertyType[];
  amenities: Amenity[];
  currentStep: number;
}

const STEP_LABELS = ["Basics", "Location", "Details", "Photos", "Preview"];

export function ListingWizard({
  property,
  sellerId,
  cities,
  propertyTypes,
  amenities,
  currentStep,
}: ListingWizardProps) {
  const router = useRouter();

  function navigateToStep(id: string, step: number) {
    router.push(`/dealer/listings/${id}/edit?step=${step}`);
  }

  function handleBasicsSuccess(id: string) {
    navigateToStep(id, 2);
  }

  function handleLocationSuccess(id: string) {
    navigateToStep(id, 3);
  }

  function handleDetailsSuccess(id: string) {
    navigateToStep(id, 4);
  }

  function handleMediaSuccess(id: string) {
    navigateToStep(id, 5);
  }

  const propertyId = property?.id;

  const selectedAmenityIds = (property?.property_amenities ?? []).map((a) => a.amenity_id);

  const existingImages = (property?.property_images ?? []).map((img) => ({
    id: img.id,
    path: img.path,
    is_cover: img.is_cover,
    position: img.position,
  }));

  const existingRoomTypes = (property?.room_types ?? []).map((rt) => ({
    id: rt.id,
    name: rt.name ?? "",
    sharing_count: rt.sharing_count,
    monthly_rent_per_bed: rt.monthly_rent_per_bed,
    security_deposit: rt.security_deposit ?? 0,
    is_ac: rt.is_ac,
    meal_plan: rt.meal_plan,
    attached_bathroom: rt.attached_bathroom,
    total_beds: rt.total_beds,
    available_beds: rt.available_beds,
  }));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-border -z-0" />
          {STEP_LABELS.map((label, idx) => {
            const step = idx + 1;
            const isCurrent = step === currentStep;
            const isDone = step < currentStep;
            return (
              <div key={label} className="flex flex-col items-center gap-1.5 z-10 flex-1">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors",
                    isDone
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-background border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium hidden sm:block",
                    isCurrent ? "text-primary" : isDone ? "text-muted-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-5">
          {STEP_LABELS[currentStep - 1]}
        </h2>

        {currentStep === 1 && (
          <StepBasics
            propertyId={propertyId}
            initialData={property ?? undefined}
            propertyTypes={propertyTypes}
            onSuccess={handleBasicsSuccess}
          />
        )}

        {currentStep === 2 && propertyId && (
          <StepLocation
            propertyId={propertyId}
            initialData={property ?? undefined}
            cities={cities}
            onSuccess={handleLocationSuccess}
            onBack={() => navigateToStep(propertyId, 1)}
          />
        )}

        {currentStep === 3 && propertyId && (
          <StepDetails
            propertyId={propertyId}
            rentalKind={property?.rental_kind}
            initialData={property as unknown as Record<string, unknown>}
            amenities={amenities}
            selectedAmenityIds={selectedAmenityIds}
            onSuccess={handleDetailsSuccess}
            onBack={() => navigateToStep(propertyId, 2)}
          />
        )}

        {currentStep === 4 && propertyId && (
          <StepMedia
            propertyId={propertyId}
            sellerId={sellerId}
            rentalKind={property?.rental_kind}
            existingImages={existingImages}
            existingRoomTypes={existingRoomTypes}
            onSuccess={handleMediaSuccess}
            onBack={() => navigateToStep(propertyId, 3)}
          />
        )}

        {currentStep === 5 && propertyId && property && (
          <StepPreview
            propertyId={propertyId}
            property={property}
            onBack={() => navigateToStep(propertyId, 4)}
          />
        )}
      </div>
    </div>
  );
}

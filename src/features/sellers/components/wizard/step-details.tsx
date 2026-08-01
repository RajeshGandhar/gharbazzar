"use client";

import { useState } from "react";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Amenity {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

interface StepDetailsProps {
  propertyId: string;
  rentalKind?: string | null;
  initialData?: Record<string, unknown>;
  amenities: Amenity[];
  selectedAmenityIds?: number[];
  onSuccess: (id: string) => void;
  onBack: () => void;
}

export function StepDetails({
  propertyId,
  rentalKind,
  initialData,
  amenities,
  selectedAmenityIds: initialAmenityIds,
  onSuccess,
  onBack,
}: StepDetailsProps) {
  const isStudent = rentalKind === "student";

  const [description, setDescription] = useState((initialData?.description as string) ?? "");
  const [bedrooms, setBedrooms] = useState((initialData?.bedrooms as string | undefined)?.toString() ?? "");
  const [bathrooms, setBathrooms] = useState((initialData?.bathrooms as string | undefined)?.toString() ?? "");
  const [balconies, setBalconies] = useState((initialData?.balconies as string | undefined)?.toString() ?? "");
  const [builtUpArea, setBuiltUpArea] = useState((initialData?.built_up_area as string | undefined)?.toString() ?? "");
  const [carpetArea, setCarpetArea] = useState((initialData?.carpet_area as string | undefined)?.toString() ?? "");
  const [floorNumber, setFloorNumber] = useState((initialData?.floor_number as string | undefined)?.toString() ?? "");
  const [totalFloors, setTotalFloors] = useState((initialData?.total_floors as string | undefined)?.toString() ?? "");
  const [parkingSpaces, setParkingSpaces] = useState((initialData?.parking_spaces as string | undefined)?.toString() ?? "0");
  const [furnishing, setFurnishing] = useState((initialData?.furnishing as string) ?? "");
  const [constructionStatus, setConstructionStatus] = useState((initialData?.construction_status as string) ?? "");
  const [facing, setFacing] = useState((initialData?.facing as string) ?? "");
  // Student housing extras
  const [genderPolicy, setGenderPolicy] = useState((initialData?.gender_policy as string) ?? "any");
  const [availableFrom, setAvailableFrom] = useState((initialData?.available_from as string) ?? "");
  const [lockInMonths, setLockInMonths] = useState((initialData?.lock_in_months as string | undefined)?.toString() ?? "");
  const [hasWarden, setHasWarden] = useState((initialData?.has_warden as boolean) ?? false);
  const [curfewTime, setCurfewTime] = useState((initialData?.curfew_time as string) ?? "");
  const [messType, setMessType] = useState((initialData?.mess_type as string) ?? "");
  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<Set<number>>(
    new Set(initialAmenityIds ?? [])
  );
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function toggleAmenity(id: number) {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setServerError(null);

    const body: Record<string, unknown> = {
      description,
    };
    if (bedrooms) body.bedrooms = parseInt(bedrooms, 10);
    if (bathrooms) body.bathrooms = parseInt(bathrooms, 10);
    if (balconies) body.balconies = parseInt(balconies, 10);
    if (builtUpArea) body.built_up_area = parseFloat(builtUpArea);
    if (carpetArea) body.carpet_area = parseFloat(carpetArea);
    if (floorNumber) body.floor_number = parseInt(floorNumber, 10);
    if (totalFloors) body.total_floors = parseInt(totalFloors, 10);
    body.parking_spaces = parseInt(parkingSpaces || "0", 10);
    if (furnishing) body.furnishing = furnishing;
    if (constructionStatus) body.construction_status = constructionStatus;
    if (facing) body.facing = facing;

    if (isStudent) {
      body.gender_policy = genderPolicy;
      if (availableFrom) body.available_from = availableFrom;
      if (lockInMonths) body.lock_in_months = parseInt(lockInMonths, 10);
      body.has_warden = hasWarden;
      if (curfewTime) body.curfew_time = curfewTime;
      if (messType) body.mess_type = messType;
    }

    try {
      // Save property details
      const res = await fetch(`/api/v1/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setServerError((data as { error?: { message?: string } })?.error?.message ?? "Failed to save. Please try again.");
        return;
      }

      // Save amenities — full replace (delete existing, insert selected)
      const amenitiesRes = await fetch(`/api/v1/properties/${propertyId}/amenities`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amenity_ids: Array.from(selectedAmenities) }),
      });

      if (!amenitiesRes.ok) {
        const data = await amenitiesRes.json().catch(() => ({}));
        setServerError((data as { error?: { message?: string } })?.error?.message ?? "Failed to save amenities. Please try again.");
        return;
      }

      onSuccess(propertyId);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the property — highlights, nearby places, what makes it special..."
          rows={5}
          maxLength={3000}
          className="mt-1 resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {description.length}/3000
        </p>
      </div>

      {/* Bedrooms / Bathrooms / Balconies */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Select value={bedrooms} onValueChange={(v) => { if (v != null) setBedrooms(v); }}>
            <SelectTrigger id="bedrooms" className="mt-1">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Studio</SelectItem>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} BHK
                </SelectItem>
              ))}
              <SelectItem value="6">5+ BHK</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Select value={bathrooms} onValueChange={(v) => { if (v != null) setBathrooms(v); }}>
            <SelectTrigger id="bathrooms" className="mt-1">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="balconies">Balconies</Label>
          <Select value={balconies} onValueChange={(v) => { if (v != null) setBalconies(v); }}>
            <SelectTrigger id="balconies" className="mt-1">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Area */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="built_up_area">Built-up area (sqft)</Label>
          <Input
            id="built_up_area"
            type="number"
            value={builtUpArea}
            onChange={(e) => setBuiltUpArea(e.target.value)}
            placeholder="e.g. 1200"
            className="mt-1"
            min={0}
          />
        </div>
        <div>
          <Label htmlFor="carpet_area">
            Carpet area (sqft) <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="carpet_area"
            type="number"
            value={carpetArea}
            onChange={(e) => setCarpetArea(e.target.value)}
            placeholder="e.g. 980"
            className="mt-1"
            min={0}
          />
        </div>
      </div>

      {/* Floor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="floor_number">
            Floor number <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="floor_number"
            type="number"
            value={floorNumber}
            onChange={(e) => setFloorNumber(e.target.value)}
            placeholder="e.g. 3"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="total_floors">
            Total floors <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="total_floors"
            type="number"
            value={totalFloors}
            onChange={(e) => setTotalFloors(e.target.value)}
            placeholder="e.g. 10"
            className="mt-1"
            min={1}
          />
        </div>
      </div>

      {/* Parking */}
      <div>
        <Label htmlFor="parking_spaces">Parking spaces</Label>
        <Select value={parkingSpaces} onValueChange={(v) => { if (v != null) setParkingSpaces(v); }}>
          <SelectTrigger id="parking_spaces" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Furnishing / Construction status / Facing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="furnishing">Furnishing</Label>
          <Select value={furnishing} onValueChange={(v) => { if (v != null) setFurnishing(v); }}>
            <SelectTrigger id="furnishing" className="mt-1">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unfurnished">Unfurnished</SelectItem>
              <SelectItem value="semi_furnished">Semi Furnished</SelectItem>
              <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="construction_status">Construction</Label>
          <Select value={constructionStatus} onValueChange={(v) => { if (v != null) setConstructionStatus(v); }}>
            <SelectTrigger id="construction_status" className="mt-1">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ready_to_move">Ready to Move</SelectItem>
              <SelectItem value="under_construction">Under Construction</SelectItem>
              <SelectItem value="new_launch">New Launch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="facing">Facing</Label>
          <Select value={facing} onValueChange={(v) => { if (v != null) setFacing(v); }}>
            <SelectTrigger id="facing" className="mt-1">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"].map((f) => (
                <SelectItem key={f} value={f}>
                  {f.replace("_", "-").replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Student housing extras */}
      {isStudent && (
        <div className="space-y-4 border border-primary/20 rounded-xl p-4 bg-primary/5">
          <p className="text-sm font-semibold text-primary">Student Housing Details</p>

          <div>
            <Label>Gender policy</Label>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {[
                { value: "any", label: "Any" },
                { value: "boys_only", label: "Boys Only" },
                { value: "girls_only", label: "Girls Only" },
                { value: "family_only", label: "Family Only" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGenderPolicy(value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    genderPolicy === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="available_from">Available from</Label>
              <Input
                id="available_from"
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lock_in_months">Lock-in (months)</Label>
              <Input
                id="lock_in_months"
                type="number"
                value={lockInMonths}
                onChange={(e) => setLockInMonths(e.target.value)}
                placeholder="e.g. 6"
                className="mt-1"
                min={0}
                max={60}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="curfew_time">Curfew time <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="curfew_time"
                type="time"
                value={curfewTime}
                onChange={(e) => setCurfewTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mess_type">Mess type</Label>
              <Select value={messType} onValueChange={(v) => { if (v != null) setMessType(v); }}>
                <SelectTrigger id="mess_type" className="mt-1">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="veg">Veg only</SelectItem>
                  <SelectItem value="veg_nonveg">Veg &amp; Non-veg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasWarden}
              onChange={(e) => setHasWarden(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm">Warden / caretaker available</span>
          </label>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div>
          <Label>Amenities</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {amenities.map((amenity) => {
              const checked = selectedAmenities.has(amenity.id);
              return (
                <label
                  key={amenity.id}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer text-sm transition-colors ${
                    checked
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(amenity.id)}
                    className="sr-only"
                  />
                  {amenity.icon && <span>{amenity.icon}</span>}
                  <span className="truncate">{amenity.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

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
        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save & Continue"
          )}
        </Button>
      </div>
    </div>
  );
}

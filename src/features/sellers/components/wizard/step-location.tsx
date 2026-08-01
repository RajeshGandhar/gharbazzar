"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPicker } from "@/features/properties/components/location-picker";
import { PINCODE_REGEX } from "@/features/properties/schemas";

interface City {
  id: number;
  name: string;
  slug: string;
  state: string;
}

interface Area {
  id: number;
  name: string;
  slug: string;
}

interface StepLocationProps {
  propertyId: string;
  initialData?: {
    city_id?: number;
    area_id?: number | null;
    address?: string;
    landmark?: string | null;
    pincode?: string | null;
    state?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  cities: City[];
  onSuccess: (id: string) => void;
  onBack: () => void;
}

export function StepLocation({
  propertyId,
  initialData,
  cities,
  onSuccess,
  onBack,
}: StepLocationProps) {
  const [cityId, setCityId] = useState(
    initialData?.city_id && initialData.city_id > 0 ? String(initialData.city_id) : ""
  );
  const [areaId, setAreaId] = useState(
    initialData?.area_id ? String(initialData.area_id) : ""
  );
  const [address, setAddress] = useState(
    initialData?.address && initialData.address !== "TBD" ? initialData.address : ""
  );
  const [landmark, setLandmark] = useState(initialData?.landmark ?? "");
  const [pincode, setPincode] = useState(initialData?.pincode ?? "");
  const [state, setState] = useState(initialData?.state ?? "UP");
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude ?? null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Load areas when city changes
  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      setAreaId("");
      return;
    }
    setLoadingAreas(true);
    fetch(`/api/v1/areas?city_id=${cityId}`)
      .then((r) => r.json())
      .then((data) => {
        setAreas(data?.data ?? []);
      })
      .catch(() => setAreas([]))
      .finally(() => setLoadingAreas(false));

    // Set state from selected city
    const selectedCity = cities.find((c) => String(c.id) === cityId);
    if (selectedCity) setState(selectedCity.state);
  }, [cityId, cities]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!cityId) errs.city_id = "Select a city";
    if (!address.trim() || address.trim().length < 5)
      errs.address = "Enter a valid address (min 5 characters)";
    if (pincode && !PINCODE_REGEX.test(pincode)) errs.pincode = "Enter a valid 6-digit pincode";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setServerError(null);

    const body: Record<string, unknown> = {
      city_id: parseInt(cityId, 10),
      address: address.trim(),
      state,
    };
    if (areaId) body.area_id = parseInt(areaId, 10);
    if (landmark.trim()) body.landmark = landmark.trim();
    if (pincode.trim()) body.pincode = pincode.trim();
    if (latitude != null) body.latitude = latitude;
    if (longitude != null) body.longitude = longitude;

    try {
      const res = await fetch(`/api/v1/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSuccess(propertyId);
        return;
      }

      const data = await res.json().catch(() => ({}));
      setServerError(data?.error?.message ?? "Failed to save location. Please try again.");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* City */}
      <div>
        <Label htmlFor="city">
          City <span className="text-destructive">*</span>
        </Label>
        <Select value={cityId} onValueChange={(v) => { if (v != null) setCityId(v); }}>
          <SelectTrigger id="city" className="mt-1">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.city_id && <p className="text-xs text-destructive mt-1">{errors.city_id}</p>}
      </div>

      {/* Area — conditional on city */}
      {cityId && (
        <div>
          <Label htmlFor="area">
            Area / locality <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Select value={areaId} onValueChange={(v) => { if (v != null) setAreaId(v); }} disabled={loadingAreas}>
            <SelectTrigger id="area" className="mt-1">
              <SelectValue placeholder={loadingAreas ? "Loading areas..." : "Select area"} />
            </SelectTrigger>
            <SelectContent>
              {areas.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Address */}
      <div>
        <Label htmlFor="address">
          Full address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House/plot no., street, locality"
          className="mt-1"
        />
        {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
      </div>

      {/* Landmark */}
      <div>
        <Label htmlFor="landmark">
          Landmark <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="landmark"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          placeholder="e.g. Near ISKCON Temple"
          className="mt-1"
          maxLength={120}
        />
      </div>

      {/* Pincode */}
      <div>
        <Label htmlFor="pincode">
          Pincode <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="281121"
          className="mt-1"
          inputMode="numeric"
        />
        {errors.pincode && <p className="text-xs text-destructive mt-1">{errors.pincode}</p>}
      </div>

      {/* State — auto-filled, read-only */}
      <div>
        <Label htmlFor="state">State</Label>
        <Input id="state" value={state} readOnly className="mt-1 bg-muted cursor-not-allowed" />
      </div>

      {/* Map pin picker */}
      <div>
        <Label className="mb-2 block">Pin exact location <span className="text-muted-foreground text-xs">(optional but recommended)</span></Label>
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
        />
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

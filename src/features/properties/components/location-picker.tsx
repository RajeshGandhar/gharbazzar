"use client";

import { useState, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import type { MapMouseEvent } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  /** Default map center when no pin yet */
  defaultCenter?: { lat: number; lng: number };
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/** Default center: Mathura, UP */
const MATHURA = { lat: 27.4924, lng: 77.6737 };

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  defaultCenter = MATHURA,
}: LocationPickerProps) {
  const [latStr, setLatStr] = useState(latitude != null ? String(latitude) : "");
  const [lngStr, setLngStr] = useState(longitude != null ? String(longitude) : "");

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const lat = e.detail.latLng?.lat;
      const lng = e.detail.latLng?.lng;
      if (lat != null && lng != null) {
        setLatStr(lat.toFixed(6));
        setLngStr(lng.toFixed(6));
        onChange(lat, lng);
      }
    },
    [onChange]
  );

  function handleManualChange(field: "lat" | "lng", value: string) {
    if (field === "lat") setLatStr(value);
    else setLngStr(value);
    const lat = field === "lat" ? parseFloat(value) : parseFloat(latStr);
    const lng = field === "lng" ? parseFloat(value) : parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) onChange(lat, lng);
  }

  const center =
    latitude != null && longitude != null
      ? { lat: latitude, lng: longitude }
      : defaultCenter;

  const pin = latitude != null && longitude != null
    ? { lat: latitude, lng: longitude }
    : null;

  if (!API_KEY) {
    // No API key — show manual lat/lng inputs only
    return (
      <div className="space-y-3">
        <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" />
          Enter coordinates manually below. Map pin picker activates once{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> is set.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Latitude</Label>
            <Input
              value={latStr}
              onChange={(e) => handleManualChange("lat", e.target.value)}
              placeholder="e.g. 27.4924"
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Longitude</Label>
            <Input
              value={lngStr}
              onChange={(e) => handleManualChange("lng", e.target.value)}
              placeholder="e.g. 77.6737"
              className="text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <MapPin className="size-3.5 shrink-0" />
        Click the map to pin the exact property location
      </p>
      <APIProvider apiKey={API_KEY}>
        <div className="w-full h-64 rounded-xl overflow-hidden border">
          <Map
            defaultCenter={center}
            defaultZoom={14}
            gestureHandling="cooperative"
            mapId="gharbazaar-picker"
            onClick={handleMapClick}
          >
            {pin && <AdvancedMarker position={pin} />}
          </Map>
        </div>
      </APIProvider>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Latitude</Label>
          <Input
            value={latStr}
            onChange={(e) => handleManualChange("lat", e.target.value)}
            placeholder="e.g. 27.4924"
            className="text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Longitude</Label>
          <Input
            value={lngStr}
            onChange={(e) => handleManualChange("lng", e.target.value)}
            placeholder="e.g. 77.6737"
            className="text-sm"
          />
        </div>
      </div>
      {pin && (
        <p className="text-[10px] text-muted-foreground">
          Pinned: {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}

"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function PropertyMap({ latitude, longitude, title }: PropertyMapProps) {
  if (!API_KEY) {
    // Graceful fallback — map activates when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set
    return (
      <div className="w-full h-56 rounded-xl border bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <MapPin className="size-6" />
        <p className="text-sm">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
        <p className="text-xs">Map view coming soon</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="w-full h-56 rounded-xl overflow-hidden border">
        <Map
          defaultCenter={{ lat: latitude, lng: longitude }}
          defaultZoom={15}
          gestureHandling="cooperative"
          disableDefaultUI
          mapId="gharbazaar-property"
        >
          <AdvancedMarker position={{ lat: latitude, lng: longitude }} title={title} />
        </Map>
      </div>
    </APIProvider>
  );
}

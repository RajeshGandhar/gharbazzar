"use client";

import { useState } from "react";
import Link from "next/link";
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatRent } from "@/lib/utils/format";

interface MapProperty {
  id: string;
  title: string;
  slug: string;
  price: number;
  purpose: string;
  latitude: number | null;
  longitude: number | null;
  cities: { name: string } | null;
}

interface SearchMapViewProps {
  properties: MapProperty[];
  /** Default center when no properties */
  defaultCenter?: { lat: number; lng: number };
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
/** Default center: Mathura */
const MATHURA = { lat: 27.4924, lng: 77.6737 };

export function SearchMapView({ properties, defaultCenter = MATHURA }: SearchMapViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const plotted = properties.filter((p) => p.latitude != null && p.longitude != null);

  if (!API_KEY) {
    return (
      <div className="h-[480px] rounded-xl border bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <MapPin className="size-8" />
        <p className="font-medium">Map view not yet configured</p>
        <p className="text-sm max-w-xs text-center">
          Add <code className="text-xs bg-background border rounded px-1 py-0.5">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment to enable this view.
        </p>
        <p className="text-xs">{plotted.length} of {properties.length} listings have coordinates</p>
      </div>
    );
  }

  const center =
    plotted.length > 0
      ? { lat: plotted[0].latitude!, lng: plotted[0].longitude! }
      : defaultCenter;

  const activeProperty = plotted.find((p) => p.id === activeId) ?? null;

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="h-[480px] rounded-xl overflow-hidden border">
        <Map
          defaultCenter={center}
          defaultZoom={13}
          gestureHandling="cooperative"
          mapId="gharbazaar-search"
        >
          {plotted.map((prop) => (
            <AdvancedMarker
              key={prop.id}
              position={{ lat: prop.latitude!, lng: prop.longitude! }}
              onClick={() => setActiveId(prop.id === activeId ? null : prop.id)}
            >
              <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap cursor-pointer hover:bg-primary/90 transition-colors">
                {prop.purpose === "rent" || prop.purpose === "student"
                  ? formatRent(prop.price)
                  : formatPrice(prop.price)}
              </div>
            </AdvancedMarker>
          ))}

          {activeProperty && activeProperty.latitude != null && activeProperty.longitude != null && (
            <InfoWindow
              position={{ lat: activeProperty.latitude, lng: activeProperty.longitude }}
              onCloseClick={() => setActiveId(null)}
              pixelOffset={[0, -32]}
            >
              <div className="p-2 min-w-[180px]">
                <Link href={`/property/${activeProperty.slug}`} className="font-semibold text-sm text-foreground hover:text-primary">
                  {activeProperty.title}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] capitalize">{activeProperty.purpose}</Badge>
                  {activeProperty.cities?.name && (
                    <span className="text-xs text-muted-foreground">{activeProperty.cities.name}</span>
                  )}
                </div>
                <p className="text-sm font-bold text-primary mt-1">
                  {activeProperty.purpose === "rent" || activeProperty.purpose === "student"
                    ? formatRent(activeProperty.price)
                    : formatPrice(activeProperty.price)}
                </p>
                <Link href={`/property/${activeProperty.slug}`} className="text-xs text-primary hover:underline block mt-1">
                  View details →
                </Link>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {plotted.length} of {properties.length} listings shown on map
      </p>
    </APIProvider>
  );
}

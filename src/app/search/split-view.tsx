"use client";

import { useState } from "react";
import Link from "next/link";
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
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

interface SplitViewProps {
  properties: PropertyCardData[];
  mapProperties: MapProperty[];
  defaultCenter?: { lat: number; lng: number };
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MATHURA = { lat: 27.4924, lng: 77.6737 };

export function SearchSplitView({ properties, mapProperties, defaultCenter = MATHURA }: SplitViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const plotted = mapProperties.filter((p) => p.latitude != null && p.longitude != null);
  const center =
    plotted.length > 0
      ? { lat: plotted[0].latitude!, lng: plotted[0].longitude! }
      : defaultCenter;

  const activeProperty = plotted.find((p) => p.id === activeId) ?? null;

  if (!API_KEY) {
    return (
      <div className="h-[600px] rounded-xl border bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <MapPin className="size-8" />
        <p className="font-medium">Map view not yet configured</p>
        <p className="text-sm max-w-xs text-center">
          Add <code className="text-xs bg-background border rounded px-1 py-0.5">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable map view.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* List column — scrollable */}
        <div className="w-full lg:w-[45%] overflow-y-auto pr-2 scrollbar-thin">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {properties.map((p) => (
              <div
                key={p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <PropertyCard property={p} />
              </div>
            ))}
          </div>
        </div>

        {/* Map column — sticky, hidden on mobile */}
        <div className="hidden lg:block lg:w-[55%] rounded-xl overflow-hidden border sticky top-24 h-[calc(100vh-200px)]">
          <Map
            defaultCenter={center}
            defaultZoom={13}
            gestureHandling="cooperative"
            mapId="gharbazaar-split"
          >
            {plotted.map((prop) => (
              <AdvancedMarker
                key={prop.id}
                position={{ lat: prop.latitude!, lng: prop.longitude! }}
                onClick={() => setActiveId(prop.id === activeId ? null : prop.id)}
              >
                <div
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap cursor-pointer transition-all duration-200 ${
                    hoveredId === prop.id
                      ? "bg-foreground text-background scale-110"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {prop.purpose === "rent" ? formatRent(prop.price) : formatPrice(prop.price)}
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
                  <Link
                    href={`/property/${activeProperty.slug}`}
                    className="font-semibold text-sm text-foreground hover:text-primary"
                  >
                    {activeProperty.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {activeProperty.purpose}
                    </Badge>
                    {activeProperty.cities?.name && (
                      <span className="text-xs text-muted-foreground">{activeProperty.cities.name}</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-primary mt-1">
                    {activeProperty.purpose === "rent"
                      ? formatRent(activeProperty.price)
                      : formatPrice(activeProperty.price)}
                  </p>
                  <Link
                    href={`/property/${activeProperty.slug}`}
                    className="text-xs text-primary hover:underline block mt-1"
                  >
                    View details →
                  </Link>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 lg:hidden">
        {plotted.length} of {mapProperties.length} listings shown on map
      </p>
    </APIProvider>
  );
}

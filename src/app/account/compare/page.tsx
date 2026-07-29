"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { GitCompare, Loader2, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatRent, formatArea } from "@/lib/utils/format";

interface PropertyImage { path: string; is_cover: boolean; position: number }
interface CompareProperty {
  id: string;
  title: string;
  slug: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  built_up_area: number | null;
  area_unit: string;
  purpose: string;
  furnishing: string | null;
  property_images: PropertyImage[];
  cities: { name: string } | null;
}

function coverImage(images: PropertyImage[]): string | null {
  if (!images?.length) return null;
  const cover = images.find((i) => i.is_cover) ?? images.sort((a, b) => a.position - b.position)[0];
  return cover?.path ?? null;
}

const FURNISHING_LABELS: Record<string, string> = {
  furnished: "Furnished",
  semi_furnished: "Semi-furnished",
  unfurnished: "Unfurnished",
};

export default function ComparePage() {
  const [properties, setProperties] = useState<CompareProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/me/compare");
      if (res.ok) {
        const json = await res.json() as { data: { properties: CompareProperty[] } };
        setProperties(json.data?.properties ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function removeOne(propertyId: string) {
    setRemoving(propertyId);
    try {
      const res = await fetch(`/api/v1/me/compare/${propertyId}`, { method: "DELETE" });
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== propertyId));
        toast.success("Removed from comparison");
      } else {
        toast.error("Failed to remove");
      }
    } finally {
      setRemoving(null);
    }
  }

  async function clearAll() {
    setClearing(true);
    try {
      const res = await fetch("/api/v1/me/compare", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_ids: [] }),
      });
      if (res.ok) {
        setProperties([]);
        toast.success("Comparison cleared");
      } else {
        toast.error("Failed to clear");
      }
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Compare Properties</h1>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="rounded-full bg-muted p-5">
            <GitCompare className="size-8 text-muted-foreground" />
          </div>
          <p className="font-medium">Nothing to compare yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Use the compare button on any listing to add up to 4 properties here.
          </p>
          <Link href="/buy">
            <Button variant="outline">Browse properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  const rows: { label: string; getValue: (p: CompareProperty) => string | null }[] = [
    { label: "Price", getValue: (p) => p.purpose === "rent" || p.purpose === "student" ? formatRent(p.price) : formatPrice(p.price) },
    { label: "Purpose", getValue: (p) => p.purpose.charAt(0).toUpperCase() + p.purpose.slice(1) },
    { label: "Bedrooms", getValue: (p) => p.bedrooms != null ? `${p.bedrooms} BHK` : "—" },
    { label: "Bathrooms", getValue: (p) => p.bathrooms != null ? String(p.bathrooms) : "—" },
    { label: "Built-up Area", getValue: (p) => p.built_up_area != null ? formatArea(p.built_up_area, p.area_unit as "sqft" | "gaj") : "—" },
    { label: "Furnishing", getValue: (p) => p.furnishing ? (FURNISHING_LABELS[p.furnishing] ?? p.furnishing) : "—" },
    { label: "City", getValue: (p) => p.cities?.name ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compare Properties</h1>
          <p className="text-muted-foreground mt-1">{properties.length} of 4 slots used</p>
        </div>
        <Button variant="outline" size="sm" onClick={clearAll} disabled={clearing}>
          {clearing ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Trash2 className="size-4 mr-1.5" />}
          Clear all
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-32">Attribute</th>
              {properties.map((p) => {
                const imgPath = coverImage(p.property_images);
                return (
                  <th key={p.id} className="px-4 py-3 text-left">
                    <div className="flex flex-col gap-2">
                      <div className="relative h-24 w-full rounded-lg overflow-hidden bg-muted">
                        {imgPath ? (
                          <Image src={imgPath} alt={p.title} fill className="object-cover" sizes="200px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">No image</div>
                        )}
                      </div>
                      <div className="flex items-start gap-1">
                        <Link href={`/property/${p.slug}`} className="text-sm font-medium hover:text-primary line-clamp-2 flex-1">
                          {p.title}
                        </Link>
                        <button
                          onClick={() => removeOne(p.id)}
                          disabled={removing === p.id}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label="Remove"
                        >
                          {removing === p.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{row.label}</td>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-sm">
                    {row.getValue(p) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

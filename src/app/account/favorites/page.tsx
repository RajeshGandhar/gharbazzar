"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Heart, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatRent } from "@/lib/utils/format";
import { resolveCoverImageUrl } from "@/lib/utils/storage";

interface PropertyImage { path: string; is_cover: boolean; position: number }
interface FavoriteProperty {
  property_id: string;
  created_at: string;
  properties: {
    id: string;
    title: string;
    slug: string;
    price: number;
    purpose: string;
    status: string;
    approval_status: string;
    property_images: PropertyImage[];
    cities: { name: string } | null;
  } | null;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/me/favorites");
      if (res.ok) {
        const json = await res.json() as { data: FavoriteProperty[] };
        setFavorites(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function remove(propertyId: string) {
    setRemoving(propertyId);

    // Optimistic: remove immediately and restore on failure, rather than
    // waiting for the server to confirm before updating the UI.
    let removedIndex = -1;
    let removedItem: FavoriteProperty | undefined;
    setFavorites((prev) => {
      removedIndex = prev.findIndex((f) => f.property_id === propertyId);
      removedItem = prev[removedIndex];
      return prev.filter((f) => f.property_id !== propertyId);
    });

    try {
      const res = await fetch(`/api/v1/me/favorites/${propertyId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Removed from favorites");
      } else {
        if (removedItem) {
          const restore = removedItem;
          const insertAt = removedIndex;
          setFavorites((prev) => {
            const next = [...prev];
            next.splice(insertAt, 0, restore);
            return next;
          });
        }
        toast.error("Failed to remove. Please try again.");
      }
    } catch {
      if (removedItem) {
        const restore = removedItem;
        const insertAt = removedIndex;
        setFavorites((prev) => {
          const next = [...prev];
          next.splice(insertAt, 0, restore);
          return next;
        });
      }
      toast.error("Network error. Please try again.");
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Favorites</h1>
        <p className="text-muted-foreground mt-1">{favorites.length} saved {favorites.length === 1 ? "property" : "properties"}</p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="rounded-full bg-muted p-5">
            <Heart className="size-8 text-muted-foreground" />
          </div>
          <p className="font-medium">No favorites yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Tap the heart icon on any listing to save it here.
          </p>
          <Link href="/buy">
            <Button variant="outline">Browse properties</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const prop = fav.properties;
            if (!prop) return null;
            const imgUrl = resolveCoverImageUrl(prop.property_images);
            const isRent = prop.purpose === "rent" || prop.purpose === "student";
            return (
              <div key={fav.property_id} className="rounded-xl border overflow-hidden hover:border-primary transition-colors relative group">
                <Link href={`/property/${prop.slug}`}>
                  <div className="relative h-44 bg-muted">
                    {imgUrl ? (
                      <Image src={imgUrl} alt={prop.title} fill className="object-cover" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                    )}
                    <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] capitalize">
                      {prop.purpose}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <p className="font-medium truncate text-sm">{prop.title}</p>
                    {prop.cities?.name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{prop.cities.name}</p>
                    )}
                    <p className="text-primary font-semibold mt-1 text-sm">
                      {isRent ? formatRent(prop.price) : formatPrice(prop.price)}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => remove(fav.property_id)}
                  disabled={removing === fav.property_id}
                  className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove from favorites"
                >
                  {removing === fav.property_id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

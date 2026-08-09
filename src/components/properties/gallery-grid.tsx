"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHIMMER_DATA_URL } from "@/lib/utils/storage";
import { PhotoGallery } from "@/components/properties/photo-gallery";

interface GalleryGridProps {
  images: { url: string; path: string }[];
  title: string;
}

export function GalleryGrid({ images, title }: GalleryGridProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  function openAt(i: number) {
    setStartIndex(i);
    setGalleryOpen(true);
  }

  const galleryImages = images.map((img, i) => ({
    url: img.url,
    alt: `${title} — photo ${i + 1}`,
  }));

  return (
    <>
      <div className={cn("grid gap-2", images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {/* Main / hero image */}
        <button
          type="button"
          onClick={() => openAt(0)}
          className={cn(
            "shadow-elevated relative overflow-hidden rounded-xl bg-muted aspect-[4/3] cursor-zoom-in group",
            images.length >= 3 ? "row-span-2" : ""
          )}
        >
          <Image
            src={images[0].url}
            alt={`${title} — main photo`}
            fill
            sizes="(max-width: 1024px) 100vw, 700px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            placeholder="blur"
            blurDataURL={SHIMMER_DATA_URL}
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs text-white font-medium">
              1 / {images.length}
            </span>
            <span className="rounded-full bg-black/60 backdrop-blur-sm p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Expand className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>

        {/* Side images */}
        {images.slice(1, 3).map((img, idx) => (
          <button
            key={img.path}
            type="button"
            onClick={() => openAt(idx + 1)}
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted cursor-zoom-in group"
          >
            <Image
              src={img.url}
              alt={`${title} — photo ${idx + 2}`}
              fill
              sizes="(max-width: 1024px) 50vw, 350px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              placeholder="blur"
              blurDataURL={SHIMMER_DATA_URL}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            {idx === 1 && images.length > 3 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                <span className="text-white font-semibold text-lg">+{images.length - 3} more</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* View all photos button — shown below grid when > 3 images */}
      {images.length > 3 && (
        <button
          type="button"
          onClick={() => openAt(0)}
          className="mt-2 w-full rounded-xl border border-border py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          View all {images.length} photos
        </button>
      )}

      {/* Lightbox */}
      {galleryOpen && (
        <PhotoGallery
          images={galleryImages}
          initialIndex={startIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}

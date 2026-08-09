"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHIMMER_DATA_URL } from "@/lib/utils/storage";

interface PhotoGalleryProps {
  images: { url: string; alt: string }[];
  initialIndex?: number;
  onClose: () => void;
}

export function PhotoGallery({ images, initialIndex = 0, onClose }: PhotoGalleryProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const current = images[index];

  const goTo = useCallback(
    (i: number) => {
      setIndex((i + images.length) % images.length);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    },
    [images.length]
  );

  const toggleZoom = useCallback(() => {
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  }, [zoom]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowLeft":
          goTo(index - 1);
          break;
        case "ArrowRight":
          goTo(index + 1);
          break;
        case "Escape":
          onClose();
          break;
        case "+":
        case "=":
          setZoom((z) => Math.min(z + 0.5, 4));
          break;
        case "-":
          setZoom((z) => {
            const next = Math.max(z - 0.5, 1);
            if (next === 1) setPan({ x: 0, y: 0 });
            return next;
          });
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index, goTo, onClose]);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Touch swipe
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    if (zoom > 1) return; // let pan handle it when zoomed
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current || zoom > 1) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;
    touchStart.current = null;

    // Swipe threshold: >60px horizontal, <100px vertical, <400ms
    if (Math.abs(dx) > 60 && Math.abs(dy) < 100 && dt < 400) {
      goTo(dx > 0 ? index - 1 : index + 1);
    }
  }

  // Mouse drag for panning when zoomed
  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  // Double-tap / double-click to zoom
  const lastTap = useRef(0);
  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      toggleZoom();
    }
    lastTap.current = now;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-label="Photo gallery"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white/90">
        <span className="text-sm font-medium tabular-nums">
          {index + 1} / {images.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setZoom((z) => {
                const next = Math.max(z - 0.5, 1);
                if (next === 1) setPan({ x: 0, y: 0 });
                return next;
              });
            }}
            className="rounded-full p-2 hover:bg-white/10 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.5, 4))}
            className="rounded-full p-2 hover:bg-white/10 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 rounded-full p-2 hover:bg-white/10 transition-colors"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleDoubleTap}
        style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        <div
          className="relative w-full h-full transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transitionProperty: isDragging ? "none" : "transform",
          }}
        >
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            fill
            sizes="100vw"
            className="object-contain"
            placeholder="blur"
            blurDataURL={SHIMMER_DATA_URL}
            priority
          />
        </div>

        {/* Arrow buttons */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(index - 1);
              }}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(index + 1);
              }}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                "relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200",
                i === index
                  ? "ring-2 ring-white opacity-100 scale-105"
                  : "opacity-50 hover:opacity-80"
              )}
              aria-label={`View photo ${i + 1}`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PropertySearch, type SearchCity, type SearchPropertyType } from "./property-search";

/**
 * Hero with a slow parallax drift on the backdrop.
 *
 * The image is a fixed editorial asset, not listing inventory — it sets the
 * tone above the fold while the real catalogue is reached through the search
 * beneath it. Transform-only animation, so the drift never triggers layout.
 */
export function Hero({
  cities,
  propertyTypes,
}: {
  cities: SearchCity[];
  propertyTypes: SearchPropertyType[];
}) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Respect a reduced-motion preference: no parallax, no listener.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setOffset(Math.min(window.scrollY * 0.12, 60))
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/home/hero-villa.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover will-change-transform"
          style={{ transform: `translate3d(0, ${offset}px, 0) scale(1.08)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      <div className="container-page pb-10 pt-14 sm:pt-20 lg:pb-16 lg:pt-24">
        {/* Entrance is CSS-driven — no mount state, so nothing differs
            between the server render and hydration. */}
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
            Trusted by Home Seekers
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            Find Your Perfect Home
            <span className="block">
              Where <span className="text-primary">Life</span> Happens
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            Explore verified properties across India.
          </p>
        </div>

        <div className="mt-8 animate-in fade-in slide-in-from-bottom-6 fill-mode-both delay-150 duration-700 lg:mt-10">
          <PropertySearch cities={cities} propertyTypes={propertyTypes} />
        </div>
      </div>
    </section>
  );
}

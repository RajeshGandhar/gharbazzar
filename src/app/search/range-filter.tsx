"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils/format";

interface RangeFilterProps {
  label: string;
  minParam: string;
  maxParam: string;
  currentMin?: number;
  currentMax?: number;
  absoluteMin: number;
  absoluteMax: number;
  step: number;
  baseUrl: string;
}

export function RangeFilter({
  label,
  minParam,
  maxParam,
  currentMin,
  currentMax,
  absoluteMin,
  absoluteMax,
  step,
  baseUrl,
}: RangeFilterProps) {
  const [min, setMin] = useState(currentMin ?? absoluteMin);
  const [max, setMax] = useState(currentMax ?? absoluteMax);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const navigate = useCallback(
    (newMin: number, newMax: number) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const url = new URL(baseUrl, window.location.origin);
        if (newMin > absoluteMin) url.searchParams.set(minParam, String(newMin));
        else url.searchParams.delete(minParam);
        if (newMax < absoluteMax) url.searchParams.set(maxParam, String(newMax));
        else url.searchParams.delete(maxParam);
        url.searchParams.delete("page");
        router.push(url.pathname + url.search);
      }, 500);
    },
    [baseUrl, absoluteMin, absoluteMax, minParam, maxParam, router]
  );

  const range = absoluteMax - absoluteMin;
  const minPercent = ((min - absoluteMin) / range) * 100;
  const maxPercent = ((max - absoluteMin) / range) * 100;

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-3">{label}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>{formatPrice(min)}</span>
        <span>{formatPrice(max)}</span>
      </div>

      {/* Dual-thumb range slider */}
      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-border" />
        {/* Active range */}
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={absoluteMin}
          max={absoluteMax}
          step={step}
          value={min}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), max - step);
            setMin(v);
            navigate(v, max);
          }}
          className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          aria-label={`Minimum ${label.toLowerCase()}`}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={absoluteMin}
          max={absoluteMax}
          step={step}
          value={max}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), min + step);
            setMax(v);
            navigate(min, v);
          }}
          className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          aria-label={`Maximum ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}

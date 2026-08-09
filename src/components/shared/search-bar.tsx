"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SuggestResult } from "@/app/api/v1/search/suggest/route";

interface SearchBarProps {
  className?: string;
  initialQ?: string;
  initialPurpose?: string;
  initialCity?: string;
}

const PURPOSES = [
  { value: "all", label: "All" },
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "student", label: "Student Housing" },
] as const;

// Static city list — seeded cities
const CITIES = [
  { value: "mathura", label: "Mathura" },
  { value: "vrindavan", label: "Vrindavan" },
  { value: "delhi", label: "Delhi" },
  { value: "noida", label: "Noida" },
  { value: "greater-noida", label: "Greater Noida" },
  { value: "gurgaon", label: "Gurgaon" },
  { value: "faridabad", label: "Faridabad" },
  { value: "ghaziabad", label: "Ghaziabad" },
];

const CATEGORY_ICON = {
  city: MapPin,
  area: MapPin,
  university: GraduationCap,
} as const;

const CATEGORY_LABEL = {
  city: "City",
  area: "Area",
  university: "College / University",
} as const;

export function SearchBar({
  className,
  initialQ = "",
  initialPurpose = "all",
  initialCity = "",
}: SearchBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [purpose, setPurpose] = useState(initialPurpose);
  const [city, setCity] = useState(initialCity);

  const [suggestions, setSuggestions] = useState<SuggestResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`/api/v1/search/suggest?q=${encodeURIComponent(value)}`);
      if (!res.ok) return;
      const json = await res.json() as { data: SuggestResult[] };
      const results = json.data ?? [];
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch {
      // ignore network errors in typeahead
    }
  }, []);

  function handleQChange(value: string) {
    setQ(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  }

  function applySuggestion(s: SuggestResult) {
    if (s.category === "city") {
      setCity(s.value);
      setQ("");
    } else if (s.category === "area") {
      setQ(s.label);
      if (s.cityName) {
        const cityMatch = CITIES.find((c) => c.label === s.cityName);
        if (cityMatch) setCity(cityMatch.value);
      }
    } else {
      // university — goes to FTS
      setQ(s.label);
    }
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      applySuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (purpose && purpose !== "all") {
      if (purpose === "student") {
        params.set("rental_kind", "student");
        params.set("purpose", "rent");
      } else {
        params.set("purpose", purpose);
      }
    }
    if (city) params.set("city", city);
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={handleSearch}
      className={cn("flex flex-col gap-2.5 sm:flex-row sm:items-center", className)}
      role="search"
      aria-label="Property search"
    >
      {/* Query input with typeahead */}
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 z-10"
          aria-hidden
        />
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => handleQChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          placeholder="Search by city, area, or keyword…"
          className="pl-9 h-10 bg-card border-white/[0.08] focus-visible:border-primary/40 focus-visible:ring-primary/20"
          aria-label="Search query"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          autoComplete="off"
        />

        {/* Suggestion dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-2 z-50 rounded-lg border border-white/[0.08] bg-popover shadow-elevated-lg overflow-hidden"
            role="listbox"
          >
            {suggestions.map((s, i) => {
              const Icon = CATEGORY_ICON[s.category];
              return (
                <button
                  key={`${s.category}-${s.value}`}
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseDown={(e) => { e.preventDefault(); applySuggestion(s); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    i === activeIndex ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {CATEGORY_LABEL[s.category]}{s.cityName ? ` · ${s.cityName}` : ""}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Select value={purpose} onValueChange={(v) => { if (v != null) setPurpose(v); }}>
        <SelectTrigger className="w-full sm:w-40" aria-label="Property purpose">
          <SelectValue placeholder="Purpose" />
        </SelectTrigger>
        <SelectContent>
          {PURPOSES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={city} onValueChange={(v) => { if (v != null) setCity(v); }}>
        <SelectTrigger className="w-full sm:w-40" aria-label="City filter">
          <SelectValue placeholder="Any city" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Any city</SelectItem>
          {CITIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" disabled={isPending} className="gap-2 shrink-0">
        <Search className="h-4 w-4" aria-hidden />
        Search
      </Button>
    </form>
  );
}

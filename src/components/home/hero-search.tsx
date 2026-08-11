"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { GraduationCap, Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SuggestResult } from "@/app/api/v1/search/suggest/route";

/**
 * Journey-scoped hero search.
 *
 * Buy / Rent / Student Housing stay separated experiences — a search always
 * runs inside exactly one journey, never across a mixed feed. Emits the same
 * /search query params the site already uses, so filters, sorting, saved
 * searches and the results page are unchanged.
 */

type Journey = "sale" | "rent" | "student";

const JOURNEYS: { value: Journey; label: string }[] = [
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "student", label: "Student housing" },
];

/** Budget bands, in rupees, per journey. Encoded as "min-max" (blank = open). */
const BUDGETS: Record<Journey, { value: string; label: string }[]> = {
  sale: [
    { value: "", label: "Any budget" },
    { value: "-2500000", label: "Under ₹25 L" },
    { value: "2500000-5000000", label: "₹25 L – ₹50 L" },
    { value: "5000000-10000000", label: "₹50 L – ₹1 Cr" },
    { value: "10000000-20000000", label: "₹1 Cr – ₹2 Cr" },
    { value: "20000000-", label: "₹2 Cr and above" },
  ],
  rent: [
    { value: "", label: "Any budget" },
    { value: "-10000", label: "Under ₹10,000" },
    { value: "10000-20000", label: "₹10,000 – ₹20,000" },
    { value: "20000-35000", label: "₹20,000 – ₹35,000" },
    { value: "35000-60000", label: "₹35,000 – ₹60,000" },
    { value: "60000-", label: "₹60,000 and above" },
  ],
  student: [
    { value: "", label: "Any budget" },
    { value: "-6000", label: "Under ₹6,000" },
    { value: "6000-10000", label: "₹6,000 – ₹10,000" },
    { value: "10000-15000", label: "₹10,000 – ₹15,000" },
    { value: "15000-", label: "₹15,000 and above" },
  ],
};

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

const PLACEHOLDER: Record<Journey, string> = {
  sale: "Search a city, locality or landmark",
  rent: "Search a city, locality or landmark",
  student: "Search a college, university or city",
};

export interface HeroSearchCity {
  id: number;
  name: string;
  slug: string;
}

export interface HeroSearchPropertyType {
  id: number;
  name: string;
  slug: string;
}

interface HeroSearchProps {
  cities: HeroSearchCity[];
  propertyTypes: HeroSearchPropertyType[];
  className?: string;
}

const segmentTrigger =
  "h-9 w-full justify-between rounded-lg border-white/[0.06] bg-white/[0.03] text-[13px] font-medium text-foreground/90 hover:bg-white/[0.06] data-placeholder:text-muted-foreground";

export function HeroSearch({ cities, propertyTypes, className }: HeroSearchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const listboxId = useId();

  const [journey, setJourney] = useState<Journey>("sale");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [budget, setBudget] = useState("");
  const [university, setUniversity] = useState<string | null>(null);

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
      const json = (await res.json()) as { data: SuggestResult[] };
      const results = json.data ?? [];
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch {
      // typeahead is best-effort — a failed lookup must never block search
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Close the suggestion popover on outside click.
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

  function handleQChange(value: string) {
    setQ(value);
    setUniversity(null); // typing invalidates a picked campus
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  }

  function handleJourneyChange(value: Journey) {
    setJourney(value);
    setBudget(""); // bands differ per journey — never carry a sale band into rent
    if (value !== "student") setUniversity(null);
  }

  function applySuggestion(s: SuggestResult) {
    if (s.category === "city") {
      setCity(s.value);
      setQ("");
    } else if (s.category === "area") {
      setQ(s.label);
      const cityMatch = cities.find((c) => c.name === s.cityName);
      if (cityMatch) setCity(cityMatch.slug);
    } else {
      // A campus pick is a student-housing intent — switch the journey and
      // filter by computed campus distance rather than free text.
      setUniversity(s.value);
      setQ(s.label);
      setJourney("student");
      setBudget("");
      const cityMatch = cities.find((c) => c.name === s.cityName);
      if (cityMatch) setCity(cityMatch.slug);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);

    const params = new URLSearchParams();

    if (journey === "student") {
      params.set("purpose", "rent");
      params.set("rental_kind", "student");
    } else {
      params.set("purpose", journey);
    }

    if (university) {
      params.set("university", university);
    } else if (q.trim()) {
      params.set("q", q.trim());
    }

    if (city) params.set("city", city);
    if (propertyType) params.set("property_type", propertyType);

    if (budget) {
      const [min, max] = budget.split("-");
      if (min) params.set("min_price", min);
      if (max) params.set("max_price", max);
    }

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Property search"
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-card/70 p-2 backdrop-blur-xl",
        "shadow-elevated-lg",
        className
      )}
    >
      {/* Primary row — query + submit */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground/70"
            aria-hidden
          />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => handleQChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder={PLACEHOLDER[journey]}
            className={cn(
              "h-12 w-full rounded-xl border border-transparent bg-transparent pl-10 pr-3",
              "text-[15px] text-foreground placeholder:text-muted-foreground/80",
              "outline-none transition-colors focus-visible:border-primary/30 focus-visible:bg-white/[0.03]"
            )}
            aria-label="Search query"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={listboxId}
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            autoComplete="off"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              id={listboxId}
              role="listbox"
              className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/[0.08] bg-popover shadow-elevated-lg"
            >
              {suggestions.map((s, i) => {
                const Icon = CATEGORY_ICON[s.category];
                return (
                  <button
                    key={`${s.category}-${s.value}`}
                    id={`${listboxId}-option-${i}`}
                    type="button"
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applySuggestion(s);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      i === activeIndex ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{s.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {CATEGORY_LABEL[s.category]}
                        {s.cityName ? ` · ${s.cityName}` : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="h-12 shrink-0 gap-2 rounded-xl px-6 text-sm sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Search className="h-4 w-4" aria-hidden />
          )}
          Search
        </Button>
      </div>

      {/* Secondary row — journey-scoped refinements */}
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.05] pt-2 lg:grid-cols-4">
        <Select
          value={journey}
          onValueChange={(v) => {
            if (v != null) handleJourneyChange(v as Journey);
          }}
        >
          <SelectTrigger className={segmentTrigger} aria-label="What are you looking for">
            <SelectValue>
              {(value: string | null) =>
                JOURNEYS.find((j) => j.value === value)?.label ?? "Buy"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {JOURNEYS.map((j) => (
              <SelectItem key={j.value} value={j.value}>
                {j.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={propertyType}
          onValueChange={(v) => {
            if (v != null) setPropertyType(v);
          }}
        >
          <SelectTrigger className={segmentTrigger} aria-label="Property type">
            <SelectValue>
              {(value: string | null) =>
                propertyTypes.find((t) => t.slug === value)?.name ?? "Property type"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any type</SelectItem>
            {propertyTypes.map((t) => (
              <SelectItem key={t.id} value={t.slug}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={budget}
          onValueChange={(v) => {
            if (v != null) setBudget(v);
          }}
        >
          <SelectTrigger className={segmentTrigger} aria-label="Budget">
            <SelectValue>
              {(value: string | null) =>
                BUDGETS[journey].find((b) => b.value === value && b.value !== "")?.label ??
                "Budget"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {BUDGETS[journey].map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={city}
          onValueChange={(v) => {
            if (v != null) setCity(v);
          }}
        >
          <SelectTrigger className={segmentTrigger} aria-label="City">
            <SelectValue>
              {(value: string | null) =>
                cities.find((c) => c.slug === value)?.name ?? "Any city"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any city</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </form>
  );
}

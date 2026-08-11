"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Clock, Mic, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Landing search.
 *
 * This is a front-end for the existing /search route — it builds a query
 * string from the params `searchSchema` already validates and navigates.
 * It owns no search logic of its own.
 *
 * Every control maps to a real, supported filter:
 *   q · purpose · city · property_type · bedrooms · min_price · max_price · furnishing
 * Nothing here filters client-side, and nothing renders a control the
 * backend cannot honour.
 */

export interface SearchCity {
  slug: string;
  name: string;
}

export interface SearchPropertyType {
  slug: string;
  name: string;
  category: string | null;
}

/** Tabs scope both the purpose and which property types are offered. */
type TabId = "buy" | "rent" | "commercial" | "plots";

interface TabConfig {
  id: TabId;
  label: string;
  purpose: "sale" | "rent";
  categories: string[];
  /**
   * Seed type for tabs that are meaningless without one. Named explicitly
   * rather than taking the first alphabetically — "Commercial" should open on
   * a shop, not on "Commercial Plot" purely because C sorts first.
   */
  defaultType?: string;
}

const TABS: TabConfig[] = [
  { id: "buy", label: "Buy", purpose: "sale", categories: ["residential"] },
  { id: "rent", label: "Rent", purpose: "rent", categories: ["residential"] },
  {
    id: "commercial",
    label: "Commercial",
    purpose: "sale",
    categories: ["commercial"],
    defaultType: "shop-showroom",
  },
  {
    id: "plots",
    label: "Plots",
    purpose: "sale",
    categories: ["land", "agricultural"],
    defaultType: "residential-plot",
  },
];

const BUDGETS: Record<"sale" | "rent", { label: string; min?: number; max?: number }[]> = {
  sale: [
    { label: "Budget" },
    { label: "Under ₹25 Lakh", max: 2500000 },
    { label: "₹25 – 50 Lakh", min: 2500000, max: 5000000 },
    { label: "₹50 Lakh – 1 Cr", min: 5000000, max: 10000000 },
    { label: "₹1 – 2 Cr", min: 10000000, max: 20000000 },
    { label: "Above ₹2 Cr", min: 20000000 },
  ],
  rent: [
    { label: "Budget" },
    { label: "Under ₹10,000", max: 10000 },
    { label: "₹10,000 – 25,000", min: 10000, max: 25000 },
    { label: "₹25,000 – 50,000", min: 25000, max: 50000 },
    { label: "Above ₹50,000", min: 50000 },
  ],
};

const BHK = [
  { label: "BHK" },
  { label: "1 BHK", value: "1" },
  { label: "2 BHK", value: "2" },
  { label: "3 BHK", value: "3" },
  { label: "4+ BHK", value: "4" },
];

const FURNISHING = [
  { label: "Furnishing", value: "" },
  { label: "Unfurnished", value: "unfurnished" },
  { label: "Semi-Furnished", value: "semi_furnished" },
  { label: "Fully Furnished", value: "fully_furnished" },
];

const RECENT_KEY = "gharbazaar:recent-searches";
const RECENT_EVENT = "gharbazaar:recent-searches-change";
const MAX_RECENT = 6;

interface RecentSearch {
  label: string;
  href: string;
}

/* -------------------------------------------------------------------------
 * Recent searches live in localStorage — a client-only external store, read
 * through useSyncExternalStore rather than an effect. The server snapshot is
 * empty, so the server render and hydration always agree and React fills in
 * the real value on the following commit.
 *
 * Snapshots are cached against the raw string because getSnapshot must return
 * a referentially stable value; parsing on every call would loop forever.
 * ---------------------------------------------------------------------- */

const EMPTY_RECENT: RecentSearch[] = [];
let recentCache: { raw: string | null; value: RecentSearch[] } = {
  raw: null,
  value: EMPTY_RECENT,
};

function subscribeRecent(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(RECENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(RECENT_EVENT, onChange);
  };
}

function getRecentSnapshot(): RecentSearch[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(RECENT_KEY);
  } catch {
    return EMPTY_RECENT;
  }
  if (raw === recentCache.raw) return recentCache.value;

  let value = EMPTY_RECENT;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) value = parsed.slice(0, MAX_RECENT) as RecentSearch[];
  } catch {
    /* corrupt entry — fall through to empty */
  }
  recentCache = { raw, value };
  return value;
}

function getRecentServerSnapshot(): RecentSearch[] {
  return EMPTY_RECENT;
}

function pushRecent(entry: RecentSearch) {
  const next = [
    entry,
    ...getRecentSnapshot().filter(
      (r) => r.label.toLowerCase() !== entry.label.toLowerCase()
    ),
  ].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    /* storage unavailable (private mode) — navigation still proceeds */
  }
}

function Field({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none truncate rounded-md border border-border bg-surface-2 px-3 py-3 pr-9 text-sm text-foreground transition-colors hover:border-primary/40 focus:border-primary/60 focus:outline-none"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
}

export function PropertySearch({
  cities,
  propertyTypes,
}: {
  cities: SearchCity[];
  propertyTypes: SearchPropertyType[];
}) {
  const router = useRouter();

  const [tab, setTab] = useState<TabId>("buy");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [budget, setBudget] = useState("Budget");
  const [bhk, setBhk] = useState("BHK");
  const [furnishing, setFurnishing] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");

  const recent = useSyncExternalStore(
    subscribeRecent,
    getRecentSnapshot,
    getRecentServerSnapshot
  );

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const purpose = activeTab.purpose;

  // Types available under the current tab. Commercial/Plots have no meaning
  // without one, so those tabs preselect the first — visibly, in the control,
  // never as a hidden default.
  const scopedTypes = propertyTypes.filter((t) =>
    activeTab.categories.includes(t.category ?? "")
  );

  function selectTab(next: TabId) {
    setTab(next);
    setBudget("Budget");
    const nextTab = TABS.find((t) => t.id === next);
    const nextTypes = propertyTypes.filter((t) =>
      nextTab?.categories.includes(t.category ?? "")
    );
    // Buy/Rent default to "any type"; Commercial/Plots need a concrete type
    // for the tab to mean anything, so seed one and show it in the control.
    if (!nextTab?.defaultType) {
      setPropertyType("");
      return;
    }
    const seeded = nextTypes.find((t) => t.slug === nextTab.defaultType) ?? nextTypes[0];
    setPropertyType(seeded?.slug ?? "");
  }

  function buildHref(term: string) {
    const params = new URLSearchParams();
    const trimmed = term.trim();
    if (trimmed) params.set("q", trimmed);
    params.set("purpose", purpose);
    if (city) params.set("city", city);
    if (propertyType) params.set("property_type", propertyType);

    const budgetOption = BUDGETS[purpose].find((b) => b.label === budget);
    if (budgetOption?.min != null) params.set("min_price", String(budgetOption.min));
    if (budgetOption?.max != null) params.set("max_price", String(budgetOption.max));

    const bhkOption = BHK.find((b) => b.label === bhk);
    if (bhkOption?.value) params.set("bedrooms", bhkOption.value);

    if (furnishing) params.set("furnishing", furnishing);

    return `/search?${params.toString()}`;
  }

  function runSearch(term: string) {
    const href = buildHref(term);
    const label =
      term.trim() ||
      cities.find((c) => c.slug === city)?.name ||
      `${activeTab.label} properties`;

    pushRecent({ label, href });
    router.push(href);
  }

  function toggleVoice() {
    const SR = getSpeechRecognition();
    if (!SR) {
      setStatus("Voice search isn't supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition: SpeechRecognitionLike = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      setQuery(transcript);
      setListening(false);
      if (transcript) runSearch(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      setStatus("Couldn't hear that. Please try again.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setStatus("Listening…");
    setListening(true);
    recognition.start();
  }

  return (
    <section
      aria-label="Property search"
      className="rounded-xl border border-border bg-surface/95 p-4 shadow-elevated-lg backdrop-blur-xl sm:p-5"
    >
      {/* Tabs */}
      <div className="border-b border-border pb-3">
        <div
          role="tablist"
          aria-label="Listing type"
          className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1"
        >
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => selectTab(t.id)}
                className={cn(
                  "relative shrink-0 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <form
        className="pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
      >
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 focus-within:border-primary/60">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="property-search-input" className="sr-only">
            Search by locality, society, builder or city
          </label>
          <input
            id="property-search-input"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by locality, society, builder or city"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-base"
          />
          {/* Always rendered. Support is probed on click rather than at mount,
              so the control is identical on the server and after hydration;
              an unsupported browser gets a spoken-aloud explanation instead
              of a button that silently vanishes. */}
          <button
            type="button"
            onClick={toggleVoice}
            aria-label={listening ? "Stop voice search" : "Search by voice"}
            aria-pressed={listening}
            aria-describedby="voice-disclosure"
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-md border transition-colors",
              listening
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            <Mic className={cn("size-4.5", listening && "animate-pulse")} aria-hidden="true" />
          </button>
        </div>

        {/* Primary filters */}
        <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
            <Field id="filter-city" label="City" value={city} onChange={setCity}>
              <option value="">Any City</option>
              {cities.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Field>

            <Field
              id="filter-property-type"
              label="Property type"
              value={propertyType}
              onChange={setPropertyType}
            >
              <option value="">Property Type</option>
              {scopedTypes.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </Field>

            <Field id="filter-budget" label="Budget" value={budget} onChange={setBudget}>
              {BUDGETS[purpose].map((b) => (
                <option key={b.label} value={b.label}>
                  {b.label}
                </option>
              ))}
            </Field>

            {/* BHK is meaningless for land and commercial space. */}
            {(tab === "buy" || tab === "rent") && (
              <Field id="filter-bhk" label="Bedrooms" value={bhk} onChange={setBhk}>
                {BHK.map((b) => (
                  <option key={b.label} value={b.label}>
                    {b.label}
                  </option>
                ))}
              </Field>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
              aria-controls="advanced-filters"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filters
            </button>
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-soft lg:flex-none"
            >
              <Search className="size-4" aria-hidden="true" />
              Search
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div
            id="advanced-filters"
            className="mt-3 grid gap-2 rounded-lg border border-border bg-surface-2/60 p-3 sm:grid-cols-3"
          >
            <Field id="filter-furnishing" label="Furnishing" value={furnishing} onChange={setFurnishing}>
              {FURNISHING.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Field>
          </div>
        )}
      </form>

      {recent.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            Recent Searches
          </span>
          {recent.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className="rounded-full border border-border bg-surface-2/70 px-3 py-1.5 text-xs font-medium text-foreground/90 transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <p id="voice-disclosure" className="mt-3 text-[11px] leading-relaxed text-muted-foreground/70">
        Voice search uses your browser&apos;s built-in speech recognition, which may send audio to
        your browser vendor for processing. GharBazaar never records or stores audio.
      </p>

      <p aria-live="polite" className="sr-only">
        {status}
      </p>
    </section>
  );
}

/* -------------------------------------------------------------------------
 * Web Speech API — not in TypeScript's DOM lib, and vendor-prefixed in
 * Chrome. Typed narrowly to what this component actually uses.
 * ---------------------------------------------------------------------- */

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

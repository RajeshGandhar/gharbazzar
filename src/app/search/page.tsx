import type { Metadata } from "next";
import Link from "next/link";
import { Filter, LayoutList, Map, Search, SlidersHorizontal, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { PropertyCardData } from "@/components/properties/property-card";
import { Pagination } from "@/components/shared/pagination";
import { SearchBar } from "@/components/shared/search-bar";
import { searchProperties } from "@/features/search/server/queries";
import { searchSchema } from "@/features/search/schemas";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import { SearchMapView } from "./map-view";
import { SearchSplitView } from "./split-view";
import { RangeFilter } from "./range-filter";
import { LoadMoreResults } from "./load-more";
import { SaveSearchButton } from "./save-search-button";
import { SortSelect } from "./sort-select";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Search Properties — Buy, Rent & Student Housing | GharBazaar",
  description: "Search verified properties for sale, rent and student housing across Mathura, Vrindavan and Delhi NCR.",
  robots: { index: false, follow: true },
};

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getStr(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const val = sp[key];
  return Array.isArray(val) ? val[0] : val;
}

const purposeLabel: Record<string, string> = { sale: "For Sale", rent: "For Rent", lease: "Lease" };

const bhkOptions = [
  { value: "0", label: "Studio" },
  { value: "1", label: "1 BHK" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4", label: "4+ BHK" },
];

const distanceOptions = [
  { value: "500", label: "500m" },
  { value: "1000", label: "1 km" },
  { value: "2000", label: "2 km" },
  { value: "5000", label: "5 km" },
];

const baseSortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "popular", label: "Most popular" },
];

// "Nearest to campus" only makes sense once a university filter is applied.
const distanceSortOption = { value: "distance", label: "Nearest to campus" };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;

  const parsed = searchSchema.safeParse({
    q: getStr(sp, "q"),
    purpose: getStr(sp, "purpose"),
    city: getStr(sp, "city"),
    area: getStr(sp, "area"),
    min_price: getStr(sp, "min_price"),
    max_price: getStr(sp, "max_price"),
    bedrooms: getStr(sp, "bedrooms"),
    property_type: getStr(sp, "property_type"),
    rental_kind: getStr(sp, "rental_kind"),
    gender_policy: getStr(sp, "gender_policy"),
    furnishing: getStr(sp, "furnishing"),
    university: getStr(sp, "university"),
    max_distance: getStr(sp, "max_distance"),
    sort: getStr(sp, "sort") ?? "newest",
    page: getStr(sp, "page") ?? "1",
    per_page: "20",
  });

  const input = parsed.success ? parsed.data : searchSchema.parse({ sort: "newest", page: 1, per_page: 20 });
  const viewMode = getStr(sp, "view") === "map" ? "map" : "list";
  const sortOptions = input.university ? [...baseSortOptions, distanceSortOption] : baseSortOptions;

  // Parallel: search results + auth + master data
  const admin = createAdminClient();
  const supabase = await createClient();

  const [
    { data: searchData, count },
    { data: { user } },
    { data: propertyTypes },
    { data: amenitiesData },
  ] = await Promise.all([
    searchProperties(input),
    supabase.auth.getUser(),
    admin.from("property_types").select("id, name, slug").eq("is_active", true).order("name"),
    admin.from("amenities").select("id, name, slug").eq("is_active", true).order("name"),
  ]);

  // Universities: only when city is active (needs city_id lookup first)
  let universitiesData: Array<{ id: number; name: string; slug: string }> = [];
  if (input.city) {
    const { data: cityRow } = await admin
      .from("cities")
      .select("id")
      .eq("slug", input.city)
      .single();
    if (cityRow) {
      const { data: unis } = await admin
        .from("universities")
        .select("id, name, slug")
        .eq("is_active", true)
        .eq("city_id", cityRow.id)
        .order("name");
      universitiesData = unis ?? [];
    }
  }

  const properties = (searchData ?? []) as unknown as PropertyCardData[];
  const types = propertyTypes ?? [];
  const universities = universitiesData;
  const amenities = amenitiesData ?? [];
  const selectedAmenitySlugs = new Set((input.amenities ?? "").split(",").map((s) => s.trim()).filter(Boolean));

  // Build base params (without page)
  const baseParams = new URLSearchParams();
  if (input.q) baseParams.set("q", input.q);
  if (input.purpose) baseParams.set("purpose", input.purpose);
  if (input.city) baseParams.set("city", input.city);
  if (input.area) baseParams.set("area", input.area);
  if (input.min_price) baseParams.set("min_price", String(input.min_price));
  if (input.max_price) baseParams.set("max_price", String(input.max_price));
  if (input.bedrooms !== undefined) baseParams.set("bedrooms", String(input.bedrooms));
  if (input.property_type) baseParams.set("property_type", input.property_type);
  if (input.rental_kind) baseParams.set("rental_kind", input.rental_kind);
  if (input.gender_policy) baseParams.set("gender_policy", input.gender_policy);
  if (input.furnishing) baseParams.set("furnishing", input.furnishing);
  if (input.university) baseParams.set("university", input.university);
  if (input.max_distance) baseParams.set("max_distance", String(input.max_distance));
  if (input.sort) baseParams.set("sort", input.sort);
  const baseUrl = `/search?${baseParams.toString()}`;

  // Active filter chips
  const activeFilters: { label: string; removeKey: string }[] = [];
  if (input.purpose) activeFilters.push({ label: purposeLabel[input.purpose] ?? input.purpose, removeKey: "purpose" });
  if (input.city) activeFilters.push({ label: `City: ${input.city}`, removeKey: "city" });
  if (input.area) activeFilters.push({ label: `Area: ${input.area}`, removeKey: "area" });
  if (input.min_price) activeFilters.push({ label: `From ₹${(input.min_price / 100000).toFixed(0)}L`, removeKey: "min_price" });
  if (input.max_price) activeFilters.push({ label: `Up to ₹${(input.max_price / 100000).toFixed(0)}L`, removeKey: "max_price" });
  if (input.bedrooms !== undefined) activeFilters.push({ label: input.bedrooms === 0 ? "Studio" : `${input.bedrooms} BHK`, removeKey: "bedrooms" });
  if (input.property_type) activeFilters.push({ label: types.find((t) => t.slug === input.property_type)?.name ?? input.property_type, removeKey: "property_type" });
  if (input.rental_kind) activeFilters.push({ label: input.rental_kind === "student" ? "Student Housing" : "Standard", removeKey: "rental_kind" });
  if (input.gender_policy && input.gender_policy !== "any") activeFilters.push({ label: input.gender_policy.replace(/_/g, " "), removeKey: "gender_policy" });
  if (input.furnishing) activeFilters.push({ label: input.furnishing.replace(/_/g, " "), removeKey: "furnishing" });
  if (input.university) activeFilters.push({ label: `Near: ${universities.find((u) => u.slug === input.university)?.name ?? input.university}`, removeKey: "university" });
  if (selectedAmenitySlugs.size > 0) activeFilters.push({ label: `${selectedAmenitySlugs.size} amenities`, removeKey: "amenities" });

  function removeFilterUrl(key: string): string {
    const p = new URLSearchParams(baseParams);
    p.delete(key);
    if (key === "university") p.delete("max_distance");
    p.delete("page");
    return `/search?${p.toString()}`;
  }

  function sortUrl(sort: string): string {
    const p = new URLSearchParams(baseParams);
    p.set("sort", sort);
    p.delete("page");
    return `/search?${p.toString()}`;
  }

  function filterUrl(key: string, value: string): string {
    const p = new URLSearchParams(baseParams);
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    return `/search?${p.toString()}`;
  }

  // Amenities are multi-select (comma-separated slugs), unlike every other
  // filter above which replaces a single value — so toggling one adds/
  // removes it from the list rather than replacing the whole param.
  function amenityToggleUrl(slug: string): string {
    const current = new Set(selectedAmenitySlugs);
    if (current.has(slug)) current.delete(slug);
    else current.add(slug);
    const p = new URLSearchParams(baseParams);
    if (current.size > 0) p.set("amenities", [...current].join(","));
    else p.delete("amenities");
    p.delete("page");
    return `/search?${p.toString()}`;
  }

  // Filter summary for saved search name
  const filterSummaryParts: string[] = [];
  if (input.bedrooms !== undefined) filterSummaryParts.push(input.bedrooms === 0 ? "Studio" : `${input.bedrooms} BHK`);
  if (input.city) filterSummaryParts.push(input.city.charAt(0).toUpperCase() + input.city.slice(1));
  if (input.purpose) filterSummaryParts.push(purposeLabel[input.purpose] ?? "");
  if (input.q) filterSummaryParts.push(`"${input.q}"`);
  const filterSummary = filterSummaryParts.join(" · ");

  // Filters payload for DB storage
  const savedFilters: Record<string, unknown> = {};
  if (input.city) savedFilters.city = input.city;
  if (input.area) savedFilters.area = input.area;
  if (input.min_price) savedFilters.min_price = input.min_price;
  if (input.max_price) savedFilters.max_price = input.max_price;
  if (input.bedrooms !== undefined) savedFilters.bedrooms = input.bedrooms;
  if (input.property_type) savedFilters.property_type = input.property_type;
  if (input.rental_kind) savedFilters.rental_kind = input.rental_kind;
  if (input.gender_policy) savedFilters.gender_policy = input.gender_policy;
  if (input.furnishing) savedFilters.furnishing = input.furnishing;
  if (input.university) savedFilters.university = input.university;
  if (input.max_distance) savedFilters.max_distance = input.max_distance;
  if (input.q) savedFilters.q = input.q;
  if (input.amenities) savedFilters.amenities = input.amenities;

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Purpose</p>
        <div className="flex flex-wrap gap-2">
          {[{ value: "", label: "All" }, { value: "sale", label: "Buy" }, { value: "rent", label: "Rent" }].map(({ value, label }) => {
            const active = (input.purpose ?? "") === value;
            return (
              <Link key={label} href={filterUrl("purpose", value)} className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"
              )}>{label}</Link>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground mb-3">BHK type</p>
        <div className="flex flex-wrap gap-2">
          {bhkOptions.map(({ value, label }) => {
            const active = String(input.bedrooms ?? "") === value;
            return (
              <Link key={value} href={filterUrl("bedrooms", active ? "" : value)} className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"
              )}>{label}</Link>
            );
          })}
        </div>
      </div>

      {/* Price range slider */}
      <RangeFilter
        label={input.purpose === "rent" ? "Rent range" : "Price range"}
        minParam="min_price"
        maxParam="max_price"
        currentMin={input.min_price}
        currentMax={input.max_price}
        absoluteMin={input.purpose === "rent" ? 1000 : 100000}
        absoluteMax={input.purpose === "rent" ? 100000 : 50000000}
        step={input.purpose === "rent" ? 1000 : 100000}
        formatValue={(v) =>
          v >= 10000000
            ? `₹${(v / 10000000).toFixed(1)}Cr`
            : v >= 100000
              ? `₹${(v / 100000).toFixed(0)}L`
              : `₹${v.toLocaleString("en-IN")}`
        }
        baseUrl={baseUrl}
      />

      {types.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Property type</p>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => {
              const active = input.property_type === t.slug;
              return (
                <Link key={t.slug} href={filterUrl("property_type", active ? "" : t.slug)} className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"
                )}>{t.name}</Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Furnishing</p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "unfurnished", label: "Unfurnished" },
            { value: "semi_furnished", label: "Semi" },
            { value: "fully_furnished", label: "Fully furnished" },
          ].map(({ value, label }) => {
            const active = input.furnishing === value;
            return (
              <Link key={value} href={filterUrl("furnishing", active ? "" : value)} className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"
              )}>{label}</Link>
            );
          })}
        </div>
      </div>

      {amenities.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {amenities.map((a) => {
              const active = selectedAmenitySlugs.has(a.slug);
              return (
                <Link
                  key={a.slug}
                  href={amenityToggleUrl(a.slug)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"
                  )}
                >
                  {a.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-foreground mb-3">For students</p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "boys_only", label: "Boys" },
            { value: "girls_only", label: "Girls" },
            { value: "family_only", label: "Family" },
          ].map(({ value, label }) => {
            const active = input.gender_policy === value;
            const p = new URLSearchParams(baseParams);
            if (active) { p.delete("gender_policy"); }
            else { p.set("gender_policy", value); p.set("rental_kind", "student"); }
            p.delete("page");
            return (
              <Link key={value} href={`/search?${p.toString()}`} className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"
              )}>{label}</Link>
            );
          })}
        </div>
      </div>

      {/* University proximity — only shown when a city is selected */}
      {input.city && universities.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Near college / university</p>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {universities.slice(0, 6).map((u) => {
                const active = input.university === u.slug;
                return (
                  <Link key={u.slug} href={filterUrl("university", active ? "" : u.slug)} className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"
                  )}>{u.name}</Link>
                );
              })}
            </div>
            {input.university && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Within</p>
                <div className="flex flex-wrap gap-2">
                  {distanceOptions.map(({ value, label }) => {
                    const active = String(input.max_distance ?? "2000") === value;
                    return (
                      <Link key={value} href={filterUrl("max_distance", value)} className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary hover:text-primary"
                      )}>{label}</Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* Search bar */}
      <div className="border-b border-border bg-muted/20 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SearchBar
            initialQ={input.q ?? ""}
            initialPurpose={input.purpose ?? "all"}
            initialCity={input.city ?? ""}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {input.q ? <>Results for &ldquo;{input.q}&rdquo;</> : "Property search results"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {count.toLocaleString("en-IN")} propert{count === 1 ? "y" : "ies"} found
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Save search */}
            <SaveSearchButton
              searchUrl={`/search?${baseParams.toString()}`}
              filterSummary={filterSummary}
              isLoggedIn={!!user}
              purpose={input.purpose}
              filters={savedFilters}
            />

            {/* Sort */}
            <SortSelect
              value={input.sort ?? "newest"}
              options={sortOptions.map(({ value, label }) => ({ value, label, url: sortUrl(value) }))}
            />

            {/* List / Map toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden text-sm">
              <Link
                href={`${baseUrl}&view=list`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
                List
              </Link>
              <Link
                href={`${baseUrl}&view=map`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 transition-colors border-l border-border",
                  viewMode === "map" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <Map className="h-3.5 w-3.5" />
                Map
              </Link>
            </div>

            {/* Mobile filter button */}
            <Sheet>
              <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 lg:hidden")}>
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilters.length > 0 && (
                  <Badge className="h-4 w-4 rounded-full p-0 flex items-center justify-center text-[9px]">
                    {activeFilters.length}
                  </Badge>
                )}
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Sort link chips (desktop) */}
        <div className="hidden lg:flex gap-2 mb-4">
          {sortOptions.map(({ value, label }) => (
            <Link
              key={value}
              href={sortUrl(value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-smooth",
                (input.sort ?? "newest") === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeFilters.map(({ label, removeKey }) => (
              <Link
                key={removeKey}
                href={removeFilterUrl(removeKey)}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15 transition-smooth"
                aria-label={`Remove filter: ${label}`}
              >
                {label}
                <X className="h-3 w-3" />
              </Link>
            ))}
            <Link href="/search" className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-smooth">
              Clear all
            </Link>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar filters — hidden in map/split view to give space */}
          {viewMode !== "map" && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <Filter className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold text-foreground">Filters</h2>
                  </div>
                  <FilterPanel />
                </div>
              </div>
            </aside>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            {properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="rounded-2xl bg-muted p-6">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">No properties found</h2>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Try adjusting your filters or search term. Save this search and we&apos;ll alert you when a matching listing goes live.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <SaveSearchButton
                    searchUrl={`/search?${baseParams.toString()}`}
                    filterSummary={filterSummary}
                    isLoggedIn={!!user}
                    purpose={input.purpose}
                    filters={savedFilters}
                  />
                  {activeFilters.length > 0 && (
                    <Link href="/search" className={buttonVariants({ variant: "outline" })}>
                      Clear all filters
                    </Link>
                  )}
                </div>
              </div>
            ) : viewMode === "map" ? (
              <>
                {/* Desktop: split view (list + map side by side) */}
                <div className="hidden lg:block">
                  <SearchSplitView
                    properties={properties}
                    mapProperties={properties.map((p) => ({
                      id: p.id,
                      title: p.title,
                      slug: p.slug,
                      price: p.price,
                      purpose: p.purpose,
                      latitude: (p as unknown as { latitude?: number | null }).latitude ?? null,
                      longitude: (p as unknown as { longitude?: number | null }).longitude ?? null,
                      cities: (p as unknown as { cities?: { name: string } | null }).cities ?? null,
                    }))}
                  />
                </div>
                {/* Mobile: map only */}
                <div className="lg:hidden">
                  <SearchMapView
                    properties={properties.map((p) => ({
                      id: p.id,
                      title: p.title,
                      slug: p.slug,
                      price: p.price,
                      purpose: p.purpose,
                      latitude: (p as unknown as { latitude?: number | null }).latitude ?? null,
                      longitude: (p as unknown as { longitude?: number | null }).longitude ?? null,
                      cities: (p as unknown as { cities?: { name: string } | null }).cities ?? null,
                    }))}
                  />
                </div>
                <Pagination page={input.page} perPage={input.per_page} total={count} baseUrl={baseUrl} />
              </>
            ) : (
              <LoadMoreResults
                initialProperties={properties}
                total={count}
                perPage={input.per_page}
                searchUrl={baseUrl}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

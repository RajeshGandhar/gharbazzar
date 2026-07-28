import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { Pagination } from "@/components/shared/pagination";
import { SearchBar } from "@/components/shared/search-bar";
import { searchProperties } from "@/features/search/server/queries";
import { searchSchema } from "@/features/search/schemas";
import { cn } from "@/lib/utils";

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

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "popular", label: "Most popular" },
];

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
    sort: getStr(sp, "sort") ?? "newest",
    page: getStr(sp, "page") ?? "1",
    per_page: "20",
  });

  const input = parsed.success ? parsed.data : searchSchema.parse({ sort: "newest", page: 1, per_page: 20 });

  const { data, count } = await searchProperties(input);
  const properties = (data ?? []) as unknown as PropertyCardData[];

  // Build base params (without page)
  const baseParams = new URLSearchParams();
  if (input.q) baseParams.set("q", input.q);
  if (input.purpose) baseParams.set("purpose", input.purpose);
  if (input.city) baseParams.set("city", input.city);
  if (input.area) baseParams.set("area", input.area);
  if (input.min_price) baseParams.set("min_price", String(input.min_price));
  if (input.max_price) baseParams.set("max_price", String(input.max_price));
  if (input.bedrooms !== undefined) baseParams.set("bedrooms", String(input.bedrooms));
  if (input.rental_kind) baseParams.set("rental_kind", input.rental_kind);
  if (input.gender_policy) baseParams.set("gender_policy", input.gender_policy);
  if (input.furnishing) baseParams.set("furnishing", input.furnishing);
  if (input.sort) baseParams.set("sort", input.sort);
  const baseUrl = `/search?${baseParams.toString()}`;

  // Active filters
  const activeFilters: { label: string; removeKey: string }[] = [];
  if (input.purpose) activeFilters.push({ label: purposeLabel[input.purpose] ?? input.purpose, removeKey: "purpose" });
  if (input.city) activeFilters.push({ label: `City: ${input.city}`, removeKey: "city" });
  if (input.area) activeFilters.push({ label: `Area: ${input.area}`, removeKey: "area" });
  if (input.min_price) activeFilters.push({ label: `From ₹${(input.min_price / 100000).toFixed(0)}L`, removeKey: "min_price" });
  if (input.max_price) activeFilters.push({ label: `Up to ₹${(input.max_price / 100000).toFixed(0)}L`, removeKey: "max_price" });
  if (input.bedrooms !== undefined) activeFilters.push({ label: input.bedrooms === 0 ? "Studio" : `${input.bedrooms} BHK`, removeKey: "bedrooms" });
  if (input.rental_kind) activeFilters.push({ label: input.rental_kind === "student" ? "Student Housing" : "Standard", removeKey: "rental_kind" });
  if (input.gender_policy && input.gender_policy !== "any") activeFilters.push({ label: input.gender_policy.replace(/_/g, " "), removeKey: "gender_policy" });
  if (input.furnishing) activeFilters.push({ label: input.furnishing.replace(/_/g, " "), removeKey: "furnishing" });

  function removeFilterUrl(key: string): string {
    const p = new URLSearchParams(baseParams);
    p.delete(key);
    p.delete("page");
    return `/search?${p.toString()}`;
  }

  function sortUrl(sort: string): string {
    const p = new URLSearchParams(baseParams);
    p.set("sort", sort);
    p.delete("page");
    return `/search?${p.toString()}`;
  }

  function filterUrl(key: string, value: string, toggle = false): string {
    const p = new URLSearchParams(baseParams);
    if (toggle && p.get(key) === value) p.delete(key);
    else if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    return `/search?${p.toString()}`;
  }

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

          <div className="flex items-center gap-2">
            {/* Sort links */}
            <div className="relative">
              <select
                defaultValue={input.sort ?? "newest"}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30"
                onChange={(e) => {
                  if (typeof window !== "undefined") {
                    window.location.href = sortUrl(e.target.value);
                  }
                }}
              >
                {sortOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
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
          {/* Desktop sidebar filters */}
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

          {/* Results */}
          <div className="flex-1 min-w-0">
            {properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="rounded-2xl bg-muted p-6">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">No properties found</h2>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Try adjusting your filters or search term. Or create an alert and be notified when a matching listing goes live.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/auth/login?next=/alerts/new" className={buttonVariants()}>
                    <Bell className="mr-2 h-4 w-4" />
                    Create alert for this search
                  </Link>
                  {activeFilters.length > 0 && (
                    <Link href="/search" className={buttonVariants({ variant: "outline" })}>
                      Clear all filters
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {properties.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>

                <Pagination page={input.page} perPage={input.per_page} total={count} baseUrl={baseUrl} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

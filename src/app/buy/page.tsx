import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Filter, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PropertyCard, PropertyCardSkeleton, type PropertyCardData } from "@/components/properties/property-card";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Property for Sale — Verified Listings in Mathura, Vrindavan & NCR",
  description:
    "Browse verified properties for sale in Mathura, Vrindavan and Braj region. Apartments, plots, independent houses and villas — real prices, no middlemen.",
};

async function getSaleProperties() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select(
      `id, slug, title, price, purpose, city_id, area_id, bedrooms,
       built_up_area, rental_kind, gender_policy, is_featured, published_at,
       areas!area_id ( name, slug ),
       cities!city_id ( name, slug ),
       property_images ( path, thumbnail_path, is_cover, position )`
    )
    .eq("status", "active")
    .eq("approval_status", "approved")
    .eq("purpose", "sale")
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(24);
  return (data ?? []) as unknown as PropertyCardData[];
}

export default async function BuyPage() {
  const properties = await getSaleProperties();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/8 to-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">Home</Link>
              {" / "}
              <span className="font-medium text-foreground">Buy</span>
            </nav>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Properties for Sale
          </h1>
          <p className="mt-2 text-muted-foreground">
            Verified listings across Mathura, Vrindavan and Braj region.
          </p>

          {/* City filters */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { label: "All", href: "/buy" },
              { label: "Mathura",   href: "/buy/mathura" },
              { label: "Vrindavan", href: "/buy/vrindavan" },
              { label: "Govardhan", href: "/buy/govardhan" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium transition-smooth hover:border-primary hover:text-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:border-primary"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {properties.length === 0 ? (
          <EmptyState purpose="sale" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {properties.length} verified properties
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function EmptyState({ purpose }: { purpose: "sale" | "rent" }) {
  const label = purpose === "sale" ? "sale" : "rent";
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="rounded-2xl bg-muted p-6">
        <Home className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">
        No listings yet in this area
      </h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        We&apos;re onboarding sellers. Save an alert and we&apos;ll notify
        you the moment a matching property is listed.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/auth/login?next=/alerts/new?purpose=${label}`} className={buttonVariants()}>
          <Bell className="mr-2 h-4 w-4" />
          Get notified first
        </Link>
        <Link href="/list-property" className={buttonVariants({ variant: "outline" })}>
          List your property
        </Link>
      </div>
    </div>
  );
}

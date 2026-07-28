import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Filter, Key } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Property for Rent — PG, Flats & Rooms in Mathura, Vrindavan & NCR",
  description:
    "Find rentals in Mathura, Vrindavan and Braj region. PG, co-living, flats and rooms. Contact sellers directly — zero brokerage for seekers.",
};

async function getRentProperties() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select(
      `id, slug, title, price, purpose, city_id, area_id, bedrooms,
       built_up_area, rental_kind, gender_policy, is_featured, published_at,
       areas!area_id ( name, slug ),
       cities!city_id ( name, slug )`
    )
    .eq("status", "active")
    .eq("approval_status", "approved")
    .in("purpose", ["rent", "lease"])
    .neq("rental_kind", "student")         // student housing has its own hub
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(24);
  return (data ?? []) as unknown as PropertyCardData[];
}

export default async function RentPage() {
  const properties = await getRentProperties();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/8 to-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">Home</Link>
              {" / "}
              <span className="font-medium text-foreground">Rent</span>
            </nav>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Properties for Rent
          </h1>
          <p className="mt-2 text-muted-foreground">
            PG rooms, flats and co-living spaces in Mathura, Vrindavan and Braj.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { label: "All",       href: "/rent" },
              { label: "Mathura",   href: "/rent/mathura" },
              { label: "Vrindavan", href: "/rent/vrindavan" },
              { label: "PG / Co-living", href: "/rent/mathura/pg-co-living" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium transition-smooth hover:border-primary hover:text-primary"
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
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="rounded-2xl bg-muted p-6">
              <Key className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              No rental listings yet
            </h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              We&apos;re onboarding landlords and PG operators. Save an alert
              and be first to know when a match is listed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/login?next=/alerts/new?purpose=rent" className={buttonVariants()}>
                <Bell className="mr-2 h-4 w-4" />
                Get notified first
              </Link>
              <Link href="/list-property" className={buttonVariants({ variant: "outline" })}>
                List your property
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {properties.length} rentals found
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

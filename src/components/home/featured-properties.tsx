import Link from "next/link";
import { Building2 } from "lucide-react";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { PremiumPropertyCard } from "./premium-property-card";
import { ShortlistProvider } from "./shortlist-provider";
import type { PremiumPropertyView } from "@/features/properties/adapters/to-premium-card";

/**
 * Featured grid.
 *
 * When the catalogue is empty this renders an honest invitation rather than
 * skeleton cards or placeholder listings — the page never implies inventory
 * that does not exist.
 */
export function FeaturedProperties({ properties }: { properties: PremiumPropertyView[] }) {
  return (
    <section id="featured" className="container-page scroll-mt-24 py-14 sm:py-16">
      <ScrollReveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Featured Properties
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hand-picked homes from verified owners, agents and builders.
            </p>
          </div>
          {properties.length > 0 && (
            <Link
              href="/search"
              className="text-sm font-semibold text-primary hover:text-primary-soft"
            >
              View all properties →
            </Link>
          )}
        </div>
      </ScrollReveal>

      {properties.length > 0 ? (
        <ShortlistProvider>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, i) => (
              <ScrollReveal as="li" key={property.id} delay={(i % 3) * 90}>
                <PremiumPropertyCard property={property} />
              </ScrollReveal>
            ))}
          </ul>
        </ShortlistProvider>
      ) : (
        <ScrollReveal>
          <div className="mt-7 rounded-xl border border-border bg-surface p-10 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-lg border border-primary/15 bg-primary/[0.08]">
              <Building2 className="size-5 text-primary" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              Listings are going live city by city
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Every seller is identity-checked before their property appears, so this page only
              ever shows real, approved listings. Be the first in your city.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/list-property"
                className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-soft"
              >
                Post your property
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
              >
                Browse listings
              </Link>
            </div>
          </div>
        </ScrollReveal>
      )}
    </section>
  );
}

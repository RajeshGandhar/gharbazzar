import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { ScrollReveal } from "@/components/shared/scroll-reveal";

/**
 * City tiles.
 *
 * Cities come from the `cities` table, so a new city is a data row and no
 * code change — the region -> city -> area model stays intact. Photography is
 * optional: a city without an image gets a designed plate rather than a
 * stand-in photo of somewhere else.
 */

export interface LocalityTile {
  id: number;
  name: string;
  slug: string;
  state: string | null;
  count: number;
  image: string | null;
}

export function PopularLocalities({ localities }: { localities: LocalityTile[] }) {
  if (localities.length === 0) return null;

  return (
    <section id="localities" className="scroll-mt-24 border-y border-border bg-surface/30">
      <div className="container-page py-14 sm:py-16">
        <ScrollReveal>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Explore Popular Localities
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Discover where home seekers are searching the most.
          </p>
        </ScrollReveal>

        <ul className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
          {localities.map((locality, i) => (
            <ScrollReveal as="li" key={locality.id} delay={(i % 4) * 70}>
              <Link
                href={`/buy/${locality.slug}`}
                className="group relative block aspect-[5/4] overflow-hidden rounded-lg border border-border"
              >
                {locality.image ? (
                  <Image
                    src={locality.image}
                    alt={`Properties in ${locality.name}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-surface to-surface-2">
                    <MapPin
                      className="absolute left-4 top-4 size-5 text-primary/40"
                      aria-hidden="true"
                    />
                  </div>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block text-base font-semibold text-foreground">
                    {locality.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {locality.count > 0
                      ? `${locality.count.toLocaleString("en-IN")} ${locality.count === 1 ? "property" : "properties"}`
                      : (locality.state ?? "Explore")}
                  </span>
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

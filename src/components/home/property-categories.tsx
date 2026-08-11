import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/shared/scroll-reveal";

/**
 * Category rail — real property types, not marketing buckets.
 *
 * Each tile links into /search with a property_type the backend actually
 * filters on. Counts come from live inventory and are omitted entirely when
 * a type has none, so the rail never advertises stock that isn't there.
 */

export interface CategoryTile {
  id: number;
  name: string;
  slug: string;
  purpose: "sale" | "rent";
  count: number;
  image: string;
}

export function PropertyCategories({ categories }: { categories: CategoryTile[] }) {
  if (categories.length === 0) return null;

  return (
    <section id="categories" className="border-y border-border bg-surface/40">
      <div className="container-page py-6 sm:py-8">
        <ScrollReveal>
          <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-6">
            {categories.map((cat) => (
              <li key={cat.id} className="w-[210px] shrink-0 md:w-auto">
                <Link
                  href={`/search?purpose=${cat.purpose}&property_type=${cat.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5 transition-colors hover:border-primary/40"
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={cat.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {cat.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {cat.count > 0
                        ? `${cat.count.toLocaleString("en-IN")} ${cat.count === 1 ? "listing" : "listings"}`
                        : "Explore"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </section>
  );
}

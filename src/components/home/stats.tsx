import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { cn } from "@/lib/utils";

/**
 * Platform figures.
 *
 * The reference design carried round marketing numbers (50K+ properties,
 * 10K+ seekers). Those are not shipped. Callers pass live aggregates, and
 * any count that is still zero is filtered out upstream rather than
 * displayed — a young catalogue shows fewer, true figures instead of
 * inflated ones.
 */

export interface StatItem {
  id: string;
  value: string;
  label: string;
}

export function Stats({ items }: { items: StatItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface/40">
      <div className="container-page py-10 sm:py-12">
        {/* Column count follows the number of true figures, so dropping a
            zero-value stat closes the row instead of leaving a hole in it. */}
        <ul
          className={cn(
            "grid grid-cols-2 gap-6",
            items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4"
          )}
        >
          {items.map((stat, i) => (
            <ScrollReveal as="li" key={stat.id} delay={i * 0.06}>
              <p className="font-display text-3xl font-semibold text-primary sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

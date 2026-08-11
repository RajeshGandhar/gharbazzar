import Link from "next/link";
import { GraduationCap, MapPinned, Tag, Upload } from "lucide-react";
import { ScrollReveal } from "@/components/shared/scroll-reveal";

/**
 * Four entry points into the journeys that actually exist.
 *
 * The reference design carried "Home Loan" and "Property Valuation" tiles;
 * neither is built, so rather than link to nothing they are replaced with
 * Sell and Student Housing — real, separately-routed experiences.
 */
const actions = [
  {
    id: "post",
    title: "Post Property for Free",
    text: "Reach genuine seekers directly. No brokerage, no middlemen.",
    cta: "Post Now",
    href: "/list-property",
    Icon: Upload,
  },
  {
    id: "sell",
    title: "Sell Your Property",
    text: "Price it right and close with buyers who contact you directly.",
    cta: "Start Selling",
    href: "/sell",
    Icon: Tag,
  },
  {
    id: "student",
    title: "Student Housing",
    text: "Per-bed pricing near campus, with distances from the university gate.",
    cta: "Explore Housing",
    href: "/student-housing",
    Icon: GraduationCap,
  },
  {
    id: "near",
    title: "Find Property Near You",
    text: "Browse by city and locality across Braj and Delhi NCR.",
    cta: "Explore Now",
    href: "/search",
    Icon: MapPinned,
  },
] as const;

export function ActionCards() {
  return (
    <section className="container-page py-14 sm:py-16">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(({ id, title, text, cta, href, Icon }, i) => (
          <ScrollReveal as="li" key={id} delay={i * 70}>
            <Link
              href={href}
              className="group flex h-full flex-col justify-between rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/45"
            >
              <div>
                <span className="grid size-10 place-items-center rounded-md border border-border bg-surface-2 text-primary">
                  <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {cta}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>
          </ScrollReveal>
        ))}
      </ul>
    </section>
  );
}

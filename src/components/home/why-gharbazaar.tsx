import { BadgeCheck, Bookmark, MapPin, PhoneCall, Search, Upload } from "lucide-react";
import { ScrollReveal } from "@/components/shared/scroll-reveal";

/**
 * Value propositions. Each one describes behaviour the platform actually
 * has — identity checks before publish, saved shortlists, direct contact
 * with no brokerage — so nothing here overstates the product.
 */
const benefits = [
  {
    Icon: BadgeCheck,
    title: "Verified Listings",
    text: "Every seller is identity-checked and each listing is reviewed before it goes live.",
  },
  {
    Icon: Search,
    title: "Smart Search",
    text: "Filter by locality, budget, BHK, furnishing and campus distance.",
  },
  {
    Icon: MapPin,
    title: "Local Property Discovery",
    text: "Browse city by city and locality by locality across Braj and Delhi NCR.",
  },
  {
    Icon: Bookmark,
    title: "Save & Shortlist",
    text: "Keep every property you like in one place and pick up where you left off.",
  },
  {
    Icon: PhoneCall,
    title: "Direct Contact",
    text: "Reach the owner directly. No agent in the middle, no fee for seekers.",
  },
  {
    Icon: Upload,
    title: "Easy Property Posting",
    text: "List a property in a few minutes — free, with no charge to publish.",
  },
] as const;

export function WhyGharBazaar() {
  return (
    <section id="why" className="scroll-mt-24 border-y border-border bg-surface/30">
      <div className="container-page py-14 sm:py-16">
        <ScrollReveal>
          <h2 className="max-w-xl font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Property Search, Made Simpler.
          </h2>
        </ScrollReveal>
        <ul className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ Icon, title, text }, i) => (
            <ScrollReveal as="li" key={title} delay={(i % 3) * 0.07}>
              <div className="flex gap-3.5">
                <Icon
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

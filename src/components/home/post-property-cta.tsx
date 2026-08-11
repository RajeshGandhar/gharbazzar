import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/shared/scroll-reveal";

/** Closing CTA into the real post-property flow. */
export function PostPropertyCTA() {
  return (
    <section id="cta" className="container-page scroll-mt-24 py-14 sm:py-16">
      <ScrollReveal>
        <div className="grid overflow-hidden rounded-xl border border-border bg-surface lg:grid-cols-2">
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Have a Property to Sell or Rent?
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              List it free, get it verified, and talk to genuine seekers directly. Most owners
              publish in about five minutes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/list-property"
                className="inline-flex items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-soft"
              >
                Post Property for Free
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="relative order-first min-h-52 overflow-hidden lg:order-none lg:min-h-[22rem]">
            <Image
              src="/images/home/prop-villa.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent lg:bg-gradient-to-r lg:from-surface lg:via-surface/25 lg:to-transparent" />
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

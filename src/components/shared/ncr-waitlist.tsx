import Link from "next/link";
import { ChevronRight, Clock, Bell, GraduationCap, Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface NcrWaitlistProps {
  city: { name: string; slug: string };
  purpose: "sale" | "rent";
}

export function NcrWaitlist({ city, purpose }: NcrWaitlistProps) {
  const purposePath = purpose === "sale" ? "buy" : "rent";
  const purposeLabel = purpose === "sale" ? "buy" : "rent";

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/20">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <li>
              <Link href="/" className="hover:text-primary transition-smooth">
                Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link
                href={`/${purposePath}`}
                className="hover:text-primary transition-smooth capitalize"
              >
                {purpose === "sale" ? "Buy" : "Rent"}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="text-foreground font-medium">{city.name}</li>
          </ol>
        </nav>
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-16 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6">
          <Clock className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          {purpose === "sale" ? "Properties for Sale" : "Rentals"} in {city.name}
        </h1>
        <p className="text-lg font-medium text-primary mb-4">Launching soon</p>

        <p className="text-muted-foreground leading-relaxed mb-2 max-w-lg mx-auto">
          GharBazaar is expanding to {city.name} in phases. We launched first in the{" "}
          <strong className="text-foreground">Braj region</strong> (Mathura &amp; Vrindavan)
          and{" "}
          <strong className="text-foreground">NCR student housing</strong> — general{" "}
          {purposeLabel} listings across NCR are next.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Save a search alert and we&apos;ll notify you the moment listings go live in{" "}
          {city.name}.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link
            href="/auth/login?next=/account/saved-searches"
            className={buttonVariants({ size: "lg" })}
          >
            <Bell className="h-4 w-4 mr-2" />
            Notify me when live
          </Link>
          <Link
            href={`/student-housing/${city.slug}`}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Student housing in {city.name}
          </Link>
        </div>

        {/* Seller CTA */}
        <div className="rounded-xl border border-border bg-muted/30 p-5 text-left max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-0.5">
                Have a property in {city.name}?
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                List it now — we&apos;ll surface it to verified seekers as soon as we
                launch general listings in your city.
              </p>
              <Link href="/sell" className={buttonVariants({ variant: "outline", size: "sm" })}>
                List a property
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

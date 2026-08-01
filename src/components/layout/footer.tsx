import Link from "next/link";
import { Building2, Shield, Star, Zap, Heart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const cityLinks = [
  { label: "Mathura",       href: "/buy/mathura" },
  { label: "Vrindavan",     href: "/buy/vrindavan" },
  { label: "Delhi",         href: "/student-housing/delhi" },
  { label: "Noida",         href: "/student-housing/noida" },
  { label: "Greater Noida", href: "/student-housing/greater-noida" },
  { label: "Govardhan",     href: "/buy/govardhan" },
  { label: "Gurgaon",       href: "/student-housing/gurgaon" },
  { label: "Ghaziabad",     href: "/student-housing/ghaziabad" },
];

const navGroups = [
  {
    title: "Buy",
    links: [
      { label: "Flats in Mathura",       href: "/buy/mathura" },
      { label: "Plots in Mathura",       href: "/buy/mathura" },
      { label: "Houses in Vrindavan",    href: "/buy/vrindavan" },
      { label: "Villas in Mathura",      href: "/buy/mathura" },
    ],
  },
  {
    title: "Rent",
    links: [
      { label: "PG in Delhi",            href: "/rent/delhi" },
      { label: "PG in Noida",            href: "/rent/noida" },
      { label: "Flats in Mathura",       href: "/rent/mathura" },
      { label: "Flats in Greater Noida", href: "/rent/greater-noida" },
    ],
  },
  {
    title: "Student Housing",
    links: [
      { label: "Near GLA University",    href: "/college/gla-university" },
      { label: "Near DU North Campus",   href: "/college/du-north-campus" },
      { label: "Near Amity Noida",       href: "/college/amity-university-noida" },
      { label: "Near Jamia Millia",      href: "/college/jamia-millia-islamia" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Post a property",        href: "/list-property" },
      { label: "Seller dashboard",       href: "/dealer/dashboard" },
      { label: "Search properties",      href: "/search" },
      { label: "Sign in",                href: "/auth/login" },
    ],
  },
];

const trustPoints = [
  { icon: Shield, label: "Verified sellers",  desc: "KYC-checked identity" },
  { icon: Star,   label: "Real prices",       desc: "Mandatory on every listing" },
  { icon: Zap,    label: "Instant alerts",    desc: "< 15 min on new matches" },
  { icon: Heart,  label: "Free for seekers",  desc: "Always — no contact fees" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30 mt-auto" role="contentinfo">
      {/* Trust strip */}
      <div className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {trustPoints.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* City quick-links */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Browse by city
          </p>
          <div className="flex flex-wrap gap-2">
            {cityLinks.map((c) => (
              <Link
                key={c.href + c.label}
                href={c.href}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:text-primary hover:bg-primary/5"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 mb-10">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-foreground mb-4">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors leading-relaxed"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold">
              <span className="text-primary">Ghar</span>
              <span className="text-foreground">Bazaar</span>
            </span>
          </Link>

          {/* Legal */}
          <p className="text-xs text-muted-foreground">
            © {year} GharBazaar · Built for Braj &amp; NCR ·{" "}
            <span className="font-medium text-foreground/70">Seekers never pay for contacts.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

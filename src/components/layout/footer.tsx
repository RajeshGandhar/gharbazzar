import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const launchCities = [
  { label: "Mathura",       href: "/buy/mathura" },
  { label: "Vrindavan",     href: "/buy/vrindavan" },
  { label: "Delhi",         href: "/student-housing/delhi" },
  { label: "Noida",         href: "/student-housing/noida" },
  { label: "Greater Noida", href: "/student-housing/greater-noida" },
  { label: "Govardhan",     href: "/buy/govardhan" },
];

const links = {
  Buy: [
    { label: "Flats in Mathura",    href: "/buy/mathura/apartment-flat" },
    { label: "Plots in Mathura",    href: "/buy/mathura/residential-plot" },
    { label: "Houses in Vrindavan", href: "/buy/vrindavan/independent-house" },
  ],
  Rent: [
    { label: "PG in Delhi",         href: "/rent/delhi/pg-co-living" },
    { label: "PG in Noida",         href: "/rent/noida/pg-co-living" },
    { label: "Flats for Rent",      href: "/rent/mathura" },
  ],
  "Student Housing": [
    { label: "Near GLA University",        href: "/college/gla-university" },
    { label: "Near DU North Campus",       href: "/college/du-north-campus" },
    { label: "Near Amity Noida",           href: "/college/amity-university-noida" },
    { label: "Mukherjee Nagar UPSC PG",    href: "/college/mukherjee-nagar-coaching" },
  ],
  Company: [
    { label: "About Us",      href: "/about" },
    { label: "Contact",       href: "/contact" },
    { label: "Privacy Policy",href: "/privacy" },
    { label: "Terms of Use",  href: "/terms" },
    { label: "For Sellers",   href: "/list-property" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* City quick-links */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Browse by City
          </p>
          <div className="flex flex-wrap gap-2">
            {launchCities.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground transition-smooth hover:border-primary hover:text-primary"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-foreground mb-3">{section}</h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-smooth hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-primary">
            Ghar<span className="text-foreground">Bazaar</span>
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GharBazaar. All rights reserved. ·{" "}
            <span className="font-medium">Seekers never pay for contacts.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

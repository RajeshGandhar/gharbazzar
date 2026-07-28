"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Home, Search, GraduationCap, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const journeys = [
  { href: "/buy",             label: "Buy",             icon: Home },
  { href: "/rent",            label: "Rent",            icon: Search },
  { href: "/student-housing", label: "Student Housing", icon: GraduationCap },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const activeJourney = journeys.find((j) => pathname.startsWith(j.href));

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/60">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight text-primary transition-smooth hover:opacity-80"
        >
          Ghar<span className="text-foreground">Bazaar</span>
        </Link>

        {/* Journey tabs — desktop */}
        <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Primary">
          {journeys.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-smooth",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Journey accent bar — shows which journey is active (mobile) */}
        {activeJourney && (
          <span className="md:hidden ml-2 text-xs font-semibold text-primary">
            {activeJourney.label}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-smooth dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-smooth dark:rotate-0 dark:scale-100" />
          </Button>

          {/* List property — prominent CTA */}
          <Link
            href="/list-property"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:flex shrink-0")}
          >
            List your property
          </Link>

          {/* Sign in */}
          <Link
            href="/auth/login"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:flex shrink-0")}
          >
            Sign in
          </Link>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setOpen((p) => !p)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background px-4 py-4 space-y-1">
          {journeys.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-smooth min-h-[44px]",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/list-property"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants(), "w-full justify-center")}
            >
              List your property
            </Link>
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

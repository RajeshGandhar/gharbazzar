"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Home, Key, GraduationCap, Moon, Sun, Building2, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const journeys = [
  { href: "/buy",             label: "Buy",             icon: Home,          desc: "Find your home" },
  { href: "/rent",            label: "Rent",            icon: Key,           desc: "Monthly rentals" },
  { href: "/student-housing", label: "Student Housing", icon: GraduationCap, desc: "Near campus" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const activeJourney = journeys.find((j) => pathname.startsWith(j.href));

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full glass border-b transition-all duration-300",
          scrolled
            ? "border-border/80 shadow-[0_2px_20px_-4px_oklch(0.12_0_0_/_10%)]"
            : "border-transparent shadow-none"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 flex items-center gap-1.5 group"
            aria-label="GharBazaar home"
          >
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-[17px] font-bold tracking-tight">
              <span className="text-primary">Ghar</span>
              <span className="text-foreground">Bazaar</span>
            </span>
          </Link>

          {/* Divider */}
          <div className="hidden md:block h-5 w-px bg-border mx-1" aria-hidden />

          {/* Journey tabs — desktop */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Primary navigation">
            {journeys.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile: active journey badge */}
          {activeJourney && (
            <span className="md:hidden ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <activeJourney.icon className="h-3 w-3" aria-hidden />
              {activeJourney.label}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Sign in */}
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden sm:flex text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              Sign in
            </Link>

            {/* List property — primary CTA */}
            <Link
              href="/list-property"
              className={cn(
                buttonVariants({ size: "sm" }),
                "hidden sm:flex gap-1.5 font-semibold shadow-sm hover:shadow-md transition-shadow"
              )}
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              Post property
            </Link>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg md:hidden"
              onClick={() => setOpen((p) => !p)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu — outside header to avoid stacking context conflicts */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[57px] inset-x-0 z-50 md:hidden glass-heavy border-b border-border/60 px-4 py-4"
            >
              {/* Journey links */}
              <div className="space-y-1 mb-4">
                {journeys.map(({ href, label, icon: Icon, desc }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                        active
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-foreground hover:bg-accent"
                      )}
                    >
                      <div className={cn(
                        "rounded-lg p-1.5",
                        active ? "bg-primary/15" : "bg-muted"
                      )}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <ChevronRight className={cn(
                        "ml-auto h-4 w-4",
                        active ? "text-primary" : "text-muted-foreground"
                      )} />
                    </Link>
                  );
                })}
              </div>

              {/* Auth CTAs */}
              <div className="border-t border-border/60 pt-4 grid grid-cols-2 gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center font-medium")}
                >
                  Sign in
                </Link>
                <Link
                  href="/list-property"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants(), "w-full justify-center gap-1.5 font-semibold")}
                >
                  <Building2 className="h-3.5 w-3.5" aria-hidden />
                  Post property
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

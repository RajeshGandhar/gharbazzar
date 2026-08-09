"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Home, Key, GraduationCap, Building2, ChevronRight } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const activeJourney = journeys.find((j) => pathname.startsWith(j.href));

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full glass transition-all duration-300",
          scrolled
            ? "border-b border-white/[0.06]"
            : "border-b border-transparent"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 flex items-center gap-1.5 group"
            aria-label="GharBazaar home"
          >
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center transition-colors">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              <span className="text-primary">Ghar</span>
              <span className="text-foreground">Bazaar</span>
            </span>
          </Link>

          {/* Divider */}
          <div className="hidden md:block h-4 w-px bg-white/[0.08] mx-1" aria-hidden />

          {/* Journey tabs — desktop */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Primary navigation">
            {journeys.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-md bg-primary/8 border border-primary/12 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile: active journey badge */}
          {activeJourney && (
            <span className="md:hidden ml-1 inline-flex items-center gap-1 rounded-md bg-primary/8 border border-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
              <activeJourney.icon className="h-3 w-3" aria-hidden />
              {activeJourney.label}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
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
                "hidden sm:flex gap-1.5 font-medium"
              )}
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              Post property
            </Link>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md md:hidden"
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

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[49px] inset-x-0 z-50 md:hidden glass-heavy border-b border-white/[0.06] px-4 py-4"
            >
              <div className="space-y-1 mb-4">
                {journeys.map(({ href, label, icon: Icon, desc }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
                        active
                          ? "bg-primary/8 text-primary border border-primary/12"
                          : "text-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      <div className={cn(
                        "rounded-md p-1.5",
                        active ? "bg-primary/12" : "bg-white/[0.04]"
                      )}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{label}</p>
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

              <div className="border-t border-white/[0.06] pt-4 grid grid-cols-2 gap-2">
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
                  className={cn(buttonVariants(), "w-full justify-center gap-1.5 font-medium")}
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

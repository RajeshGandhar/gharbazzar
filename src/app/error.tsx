"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCw, AlertTriangle, ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      {/* Icon */}
      <div className="mb-8">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center shadow-card">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-2">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground mb-2 leading-relaxed">
        We hit an unexpected error loading this page. This has been logged and we&apos;ll look into it.
      </p>
      {error.digest && (
        <p className="mb-8 font-mono text-[11px] text-muted-foreground/60 bg-card rounded-md px-3 py-1">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => reset()} className="gap-2">
          <RotateCw className="h-4 w-4" />
          Try again
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
          <Home className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      {/* Quick links */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
        {[
          { label: "Browse properties", href: "/search" },
          { label: "Buy a home",        href: "/buy" },
          { label: "Rent a property",   href: "/rent" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/3 transition-all shadow-card"
          >
            {link.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

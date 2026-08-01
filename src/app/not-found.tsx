import Link from "next/link";
import { Home, Search, MapPinOff, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      {/* Decorative number */}
      <div className="relative mb-8">
        <span className="text-[120px] sm:text-[160px] font-black text-muted/50 select-none leading-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-3xl bg-muted/80 p-5 backdrop-blur-sm shadow-card">
            <MapPinOff className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground mb-8 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
        Let&apos;s get you back on track.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={cn(buttonVariants(), "gap-2")}>
          <Home className="h-4 w-4" />
          Back to home
        </Link>
        <Link href="/search" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
          <Search className="h-4 w-4" />
          Search properties
        </Link>
      </div>

      {/* Quick links */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
        {[
          { label: "Buy property",    href: "/buy" },
          { label: "Rent property",   href: "/rent" },
          { label: "Student Housing", href: "/student-housing" },
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

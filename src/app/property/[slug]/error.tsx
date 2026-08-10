"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, AlertTriangle, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PropertyError({
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
      <div className="mx-auto mb-6 w-16 h-16 rounded-xl bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold text-foreground mb-2">Couldn&apos;t load this property</h1>
      <p className="max-w-sm text-sm text-muted-foreground mb-6">
        The listing may have been removed or there was a temporary issue. Try again or browse other properties.
      </p>
      {error.digest && (
        <p className="mb-6 font-mono text-[11px] text-muted-foreground/60 bg-card rounded-md px-3 py-1">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex gap-3">
        <Button onClick={() => reset()} variant="outline" className="gap-2">
          <RotateCw className="h-4 w-4" /> Try again
        </Button>
        <Link href="/search" className={cn(buttonVariants(), "gap-2")}>
          <Search className="h-4 w-4" /> Browse properties
        </Link>
      </div>
    </div>
  );
}

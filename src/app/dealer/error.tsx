"use client";

import { useEffect } from "react";
import { RotateCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DealerError({
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
      <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground mb-6">
        We couldn&apos;t load this page. Your data is safe — try refreshing.
      </p>
      {error.digest && (
        <p className="mb-6 font-mono text-[11px] text-muted-foreground/60 bg-muted rounded-lg px-3 py-1">
          Error ID: {error.digest}
        </p>
      )}
      <Button onClick={() => reset()} className="gap-2">
        <RotateCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, AlertTriangle, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AccountError({
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
      <h1 className="text-xl font-bold text-foreground mb-2">Couldn&apos;t load your account</h1>
      <p className="max-w-sm text-sm text-muted-foreground mb-6">
        There was a problem loading this page. Your data is safe.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()} variant="outline" className="gap-2">
          <RotateCw className="h-4 w-4" /> Try again
        </Button>
        <Link href="/" className={cn(buttonVariants(), "gap-2")}>
          <Home className="h-4 w-4" /> Home
        </Link>
      </div>
    </div>
  );
}

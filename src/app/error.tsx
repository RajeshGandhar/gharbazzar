"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCw, AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

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
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center gap-4">
      <div className="rounded-2xl bg-destructive/10 p-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We hit an unexpected error loading this page. Please try again, or head back home.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => reset()}>
          <RotateCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          <Home className="mr-2 h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}

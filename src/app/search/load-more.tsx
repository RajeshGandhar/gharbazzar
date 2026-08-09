"use client";

import { useCallback, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard, type PropertyCardData } from "@/components/properties/property-card";

interface LoadMoreResultsProps {
  initialProperties: PropertyCardData[];
  total: number;
  perPage: number;
  /** The current search URL base (without page param) for fetching more pages */
  searchUrl: string;
}

export function LoadMoreResults({
  initialProperties,
  total,
  perPage,
  searchUrl,
}: LoadMoreResultsProps) {
  const [properties, setProperties] = useState(initialProperties);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const hasMore = properties.length < total;

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const qs = searchUrl.split("?")[1] ?? "";
        const res = await fetch(`/api/v1/search?${qs}&page=${nextPage}&per_page=${perPage}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        const newItems = (json.data ?? []) as PropertyCardData[];
        setProperties((prev) => [...prev, ...newItems]);
        setPage(nextPage);
      } catch {
        // silently fail — user can retry
      }
    });
  }, [page, searchUrl, perPage]);

  return (
    <>
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={isPending}
            className="gap-2 px-8"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load more
                <span className="text-xs text-muted-foreground">
                  ({properties.length} of {total})
                </span>
              </>
            )}
          </Button>
        </div>
      )}

      {!hasMore && properties.length > perPage && (
        <p className="text-center text-sm text-muted-foreground mt-8">
          All {total} properties loaded
        </p>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  perPage: number;
  total: number;
  baseUrl: string; // URL with existing params (without page param)
}

function buildUrl(baseUrl: string, page: number): string {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}page=${page}`;
}

export function Pagination({ page, perPage, total, baseUrl }: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // Generate page numbers to show: always show first, last, current ±2, and ellipsis
  const pages: (number | "ellipsis")[] = [];
  const delta = 2;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - delta && i <= page + delta)
    ) {
      pages.push(i);
    } else if (
      pages[pages.length - 1] !== "ellipsis"
    ) {
      pages.push("ellipsis");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 py-8"
    >
      {hasPrev ? (
        <Link
          href={buildUrl(baseUrl, page - 1)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1"
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1 opacity-40 cursor-not-allowed pointer-events-none"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === "ellipsis") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
                aria-hidden
              >
                &hellip;
              </span>
            );
          }
          return p === page ? (
            <span
              key={p}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "pointer-events-none h-9 w-9 p-0"
              )}
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildUrl(baseUrl, p)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-9 w-9 p-0"
              )}
              aria-label={`Page ${p}`}
            >
              {p}
            </Link>
          );
        })}
      </div>

      {hasNext ? (
        <Link
          href={buildUrl(baseUrl, page + 1)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1"
          )}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1 opacity-40 cursor-not-allowed pointer-events-none"
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}

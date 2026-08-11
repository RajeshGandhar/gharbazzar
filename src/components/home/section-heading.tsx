import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Small uppercase kicker above the title. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Optional trailing link, rendered right-aligned on ≥sm. */
  action?: { href: string; label: string };
  /** Centre the block — used by the full-width bands. */
  align?: "start" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "mb-8 flex gap-4 sm:mb-10",
        centered
          ? "flex-col items-center text-center"
          : "flex-col sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("max-w-xl", centered && "max-w-lg")}>
        {eyebrow && (
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
            {eyebrow}
          </p>
        )}
        <h2 className="text-balance text-2xl font-semibold leading-tight text-foreground sm:text-[1.75rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

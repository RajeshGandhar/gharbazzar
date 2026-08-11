"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One-shot fade/slide reveal driven by viewport entry.
 *
 * The motion is pure CSS (see `.reveal` in globals.css) and the observer
 * only flips a data attribute, once, before disconnecting — so a page full
 * of revealed sections costs no per-frame main-thread work and pulls no
 * animation library into the landing bundle.
 *
 * `as` exists so a reveal can wrap a list item without inserting a <div>
 * between <ul> and <li> — invalid markup that browsers silently reparent,
 * which breaks grid layout on the landing page's card grids.
 */
const TAGS = {
  div: "div",
  li: "li",
  section: "section",
  article: "article",
} as const;

export function ScrollReveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  /** Stagger offset in milliseconds. */
  delay?: number;
  className?: string;
  as?: keyof typeof TAGS;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = TAGS[as];

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-visible={visible}
      className={cn("reveal", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

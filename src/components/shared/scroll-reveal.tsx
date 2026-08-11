"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * One-shot fade/slide reveal driven by viewport entry.
 *
 * `as` exists so a reveal can wrap a list item without inserting a <div>
 * between <ul> and <li> — invalid markup that browsers silently reparent,
 * which breaks grid layout on the landing page's card grids.
 */
const TAGS = {
  div: motion.div,
  li: motion.li,
  section: motion.section,
  article: motion.article,
} as const;

export function ScrollReveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof typeof TAGS;
}) {
  const Tag = TAGS[as];

  return (
    <Tag
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}

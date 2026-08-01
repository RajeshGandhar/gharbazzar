"use client";

import { useRouter } from "next/navigation";

type SortSelectProps = {
  value: string;
  options: ReadonlyArray<{ value: string; label: string; url: string }>;
};

// Compact sort dropdown for the /search results header. Extracted into its
// own client component because a Server Component cannot pass an onChange
// handler to a native <select> — React Server Components can't serialize
// event handlers as props on any element, client or native.
export function SortSelect({ value, options }: SortSelectProps) {
  const router = useRouter();

  return (
    <div className="relative">
      <select
        defaultValue={value}
        aria-label="Sort results"
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30"
        onChange={(e) => {
          const url = options.find((o) => o.value === e.target.value)?.url;
          if (url) router.push(url);
        }}
      >
        {options.map(({ value: optValue, label }) => (
          <option key={optValue} value={optValue}>{label}</option>
        ))}
      </select>
    </div>
  );
}

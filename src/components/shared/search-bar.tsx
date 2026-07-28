"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  initialQ?: string;
  initialPurpose?: string;
  initialCity?: string;
}

const PURPOSES = [
  { value: "all", label: "All" },
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "student", label: "Student Housing" },
] as const;

// Static city list — no DB call needed; these are the seeded cities
const CITIES = [
  { value: "mathura", label: "Mathura" },
  { value: "vrindavan", label: "Vrindavan" },
  { value: "delhi", label: "Delhi" },
  { value: "noida", label: "Noida" },
  { value: "greater-noida", label: "Greater Noida" },
  { value: "gurgaon", label: "Gurgaon" },
  { value: "faridabad", label: "Faridabad" },
  { value: "ghaziabad", label: "Ghaziabad" },
];

export function SearchBar({
  className,
  initialQ = "",
  initialPurpose = "all",
  initialCity = "",
}: SearchBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [purpose, setPurpose] = useState(initialPurpose);
  const [city, setCity] = useState(initialCity);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (purpose && purpose !== "all") {
      if (purpose === "student") {
        params.set("rental_kind", "student");
        params.set("purpose", "rent");
      } else {
        params.set("purpose", purpose);
      }
    }
    if (city) params.set("city", city);
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={handleSearch}
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center",
        className
      )}
      role="search"
      aria-label="Property search"
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by city, area, or keyword…"
          className="pl-9"
          aria-label="Search query"
        />
      </div>

      <Select
        value={purpose}
        onValueChange={(v) => setPurpose(v ?? "all")}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Property purpose">
          <SelectValue placeholder="Purpose" />
        </SelectTrigger>
        <SelectContent>
          {PURPOSES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={city} onValueChange={(v) => setCity(v ?? "")}>
        <SelectTrigger className="w-full sm:w-40" aria-label="City filter">
          <SelectValue placeholder="Any city" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Any city</SelectItem>
          {CITIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" disabled={isPending} className="gap-2 shrink-0">
        <Search className="h-4 w-4" aria-hidden />
        Search
      </Button>
    </form>
  );
}

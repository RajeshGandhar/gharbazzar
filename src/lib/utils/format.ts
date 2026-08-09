// Price and area formatters — all India-specific conventions

/**
 * Format a price in Indian number system (₹ Lakh / Crore)
 * e.g. 4500000 → "₹45 L"  |  12500000 → "₹1.25 Cr"
 */
export function formatPrice(amount: number): string {
  if (amount >= 10_000_000) {
    const cr = amount / 10_000_000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2).replace(/\.?0+$/, "")} Cr`;
  }
  if (amount >= 100_000) {
    const l = amount / 100_000;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1).replace(/\.?0+$/, "")} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Format a monthly rent concisely
 * e.g. 8500 → "₹8,500/mo"
 */
export function formatRent(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}/mo`;
}

/**
 * Format a canonical sqft value for display in the given unit.
 * The DB always stores area in sqft; unit is a display preference.
 * Conversions: 1 gaj = 9 sqft · 1 sqm ≈ 10.764 sqft
 *              1 acre = 43 560 sqft · 1 marla = 272.25 sqft
 */
export function formatArea(sqft: number, unit: string = "sqft"): string {
  switch (unit) {
    case "gaj":   return `${Math.round(sqft / 9).toLocaleString("en-IN")} gaj`;
    case "sqm":   return `${Math.round(sqft / 10.764).toLocaleString("en-IN")} sqm`;
    case "acre":  return `${(sqft / 43560).toFixed(2)} acre`;
    case "marla": return `${Math.round(sqft / 272.25).toLocaleString("en-IN")} marla`;
    default:      return `${sqft.toLocaleString("en-IN")} sqft`;
  }
}

/** Convert a value entered in `unit` to canonical sqft for DB storage. */
export function toSqft(value: number, unit: string): number {
  switch (unit) {
    case "gaj":   return value * 9;
    case "sqm":   return value * 10.764;
    case "acre":  return value * 43560;
    case "marla": return value * 272.25;
    default:      return value;
  }
}

/** Convert a canonical sqft value back to the given display unit (for form init). */
export function fromSqft(sqft: number, unit: string): number {
  switch (unit) {
    case "gaj":   return Math.round(sqft / 9);
    case "sqm":   return Math.round((sqft / 10.764) * 100) / 100;
    case "acre":  return Math.round((sqft / 43560) * 1000) / 1000;
    case "marla": return Math.round(sqft / 272.25);
    default:      return sqft;
  }
}

/**
 * Returns a human-readable freshness label
 * e.g. "Today", "2 days ago", "3 weeks ago"
 */
export function formatFreshness(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

/**
 * BHK label: 0 → "Studio", 1 → "1 BHK", etc.
 */
export function formatBhk(bedrooms: number | null | undefined): string {
  if (bedrooms == null) return "";
  if (bedrooms === 0) return "Studio";
  return `${bedrooms} BHK`;
}

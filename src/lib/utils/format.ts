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
 * Format area in sqft with optional gaj conversion
 * 1 gaj = 9 sqft
 */
export function formatArea(sqft: number, unit: "sqft" | "gaj" = "sqft"): string {
  if (unit === "gaj") {
    const gaj = sqft / 9;
    return `${Math.round(gaj)} gaj`;
  }
  return `${sqft.toLocaleString("en-IN")} sqft`;
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
  return `${Math.floor(days / 30)} months ago`;
}

/**
 * BHK label: 0 → "Studio", 1 → "1 BHK", etc.
 */
export function formatBhk(bedrooms: number | null | undefined): string {
  if (bedrooms == null) return "";
  if (bedrooms === 0) return "Studio";
  return `${bedrooms} BHK`;
}

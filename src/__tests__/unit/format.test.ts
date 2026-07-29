import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatRent,
  formatArea,
  formatBhk,
  formatFreshness,
} from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// formatPrice — Indian number system (₹ Lakh / Crore)
// ---------------------------------------------------------------------------
describe("formatPrice", () => {
  it("formats sub-lakh amounts with commas", () => {
    expect(formatPrice(50_000)).toBe("₹50,000");
  });

  it("formats whole lakhs without decimal", () => {
    expect(formatPrice(500_000)).toBe("₹5 L");
    expect(formatPrice(100_000)).toBe("₹1 L");
    expect(formatPrice(4_500_000)).toBe("₹45 L");
  });

  it("formats fractional lakhs with one decimal, dropping trailing zero", () => {
    expect(formatPrice(1_250_000)).toBe("₹12.5 L");
    expect(formatPrice(1_500_000)).toBe("₹15 L");
  });

  it("formats whole crores without decimal", () => {
    expect(formatPrice(10_000_000)).toBe("₹1 Cr");
    expect(formatPrice(50_000_000)).toBe("₹5 Cr");
  });

  it("formats fractional crores with two decimals, dropping trailing zeros", () => {
    expect(formatPrice(12_500_000)).toBe("₹1.25 Cr");
    expect(formatPrice(15_000_000)).toBe("₹1.5 Cr");
  });

  it("handles large crore values", () => {
    expect(formatPrice(100_000_000)).toBe("₹10 Cr");
    expect(formatPrice(250_000_000)).toBe("₹25 Cr");
  });
});

// ---------------------------------------------------------------------------
// formatRent — monthly rent with /mo suffix
// ---------------------------------------------------------------------------
describe("formatRent", () => {
  it("formats rent with Indian comma formatting and /mo", () => {
    expect(formatRent(8_500)).toBe("₹8,500/mo");
    expect(formatRent(15_000)).toBe("₹15,000/mo");
  });

  it("formats small rent amounts", () => {
    expect(formatRent(3_000)).toBe("₹3,000/mo");
  });

  it("formats high rent amounts", () => {
    expect(formatRent(1_00_000)).toBe("₹1,00,000/mo");
  });
});

// ---------------------------------------------------------------------------
// formatArea — sqft and gaj
// ---------------------------------------------------------------------------
describe("formatArea", () => {
  it("formats sqft by default", () => {
    expect(formatArea(1200)).toBe("1,200 sqft");
    expect(formatArea(500)).toBe("500 sqft");
  });

  it("converts sqft to gaj (1 gaj = 9 sqft)", () => {
    expect(formatArea(900, "gaj")).toBe("100 gaj");
    expect(formatArea(450, "gaj")).toBe("50 gaj");
  });

  it("rounds gaj to nearest integer", () => {
    expect(formatArea(100, "gaj")).toBe("11 gaj");
  });
});

// ---------------------------------------------------------------------------
// formatBhk
// ---------------------------------------------------------------------------
describe("formatBhk", () => {
  it("returns Studio for 0 bedrooms", () => {
    expect(formatBhk(0)).toBe("Studio");
  });

  it("returns N BHK for positive bedrooms", () => {
    expect(formatBhk(1)).toBe("1 BHK");
    expect(formatBhk(3)).toBe("3 BHK");
    expect(formatBhk(6)).toBe("6 BHK");
  });

  it("returns empty string for null or undefined", () => {
    expect(formatBhk(null)).toBe("");
    expect(formatBhk(undefined)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// formatFreshness — relative date label
// ---------------------------------------------------------------------------
describe("formatFreshness", () => {
  const daysAgo = (n: number) =>
    new Date(Date.now() - n * 86_400_000).toISOString();

  it("returns empty string for null/undefined", () => {
    expect(formatFreshness(null)).toBe("");
    expect(formatFreshness(undefined)).toBe("");
  });

  it("returns Today for today", () => {
    expect(formatFreshness(daysAgo(0))).toBe("Today");
  });

  it("returns Yesterday for 1 day ago", () => {
    expect(formatFreshness(daysAgo(1))).toBe("Yesterday");
  });

  it("returns N days ago for 2–6 days", () => {
    expect(formatFreshness(daysAgo(3))).toBe("3 days ago");
    expect(formatFreshness(daysAgo(6))).toBe("6 days ago");
  });

  it("returns 1 week ago for exactly 7 days", () => {
    expect(formatFreshness(daysAgo(7))).toBe("1 week ago");
  });

  it("returns N weeks ago for 8–29 days", () => {
    expect(formatFreshness(daysAgo(14))).toBe("2 weeks ago");
    expect(formatFreshness(daysAgo(21))).toBe("3 weeks ago");
  });

  it("returns N months ago for 30+ days", () => {
    expect(formatFreshness(daysAgo(30))).toBe("1 months ago");
    expect(formatFreshness(daysAgo(60))).toBe("2 months ago");
  });
});

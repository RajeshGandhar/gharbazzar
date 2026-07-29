import { describe, it, expect } from "vitest";
import { searchSchema } from "@/features/search/schemas";

describe("searchSchema", () => {
  // ---------------------------------------------------------------------------
  // Defaults
  // ---------------------------------------------------------------------------
  describe("defaults", () => {
    it("applies default sort=newest when omitted", () => {
      const result = searchSchema.parse({});
      expect(result.sort).toBe("newest");
    });

    it("applies default page=1 when omitted", () => {
      expect(searchSchema.parse({}).page).toBe(1);
    });

    it("applies default per_page=20 when omitted", () => {
      expect(searchSchema.parse({}).per_page).toBe(20);
    });
  });

  // ---------------------------------------------------------------------------
  // Coercion — numeric fields arrive as strings from URLSearchParams
  // ---------------------------------------------------------------------------
  describe("numeric coercion", () => {
    it("coerces min_price from string", () => {
      const result = searchSchema.parse({ min_price: "500000" });
      expect(result.min_price).toBe(500_000);
    });

    it("coerces max_price from string", () => {
      const result = searchSchema.parse({ max_price: "2000000" });
      expect(result.max_price).toBe(2_000_000);
    });

    it("coerces bedrooms from string", () => {
      const result = searchSchema.parse({ bedrooms: "3" });
      expect(result.bedrooms).toBe(3);
    });

    it("coerces page from string", () => {
      const result = searchSchema.parse({ page: "2" });
      expect(result.page).toBe(2);
    });

    it("coerces max_distance from string", () => {
      const result = searchSchema.parse({ max_distance: "1000" });
      expect(result.max_distance).toBe(1000);
    });
  });

  // ---------------------------------------------------------------------------
  // Valid inputs
  // ---------------------------------------------------------------------------
  describe("valid inputs", () => {
    it("accepts a full search payload", () => {
      const result = searchSchema.parse({
        q: "2 bhk mathura",
        purpose: "rent",
        city: "mathura",
        area: "vrindavan",
        min_price: "5000",
        max_price: "15000",
        bedrooms: "2",
        rental_kind: "standard",
        furnishing: "semi_furnished",
        sort: "price_asc",
        page: "1",
        per_page: "20",
      });
      expect(result.purpose).toBe("rent");
      expect(result.city).toBe("mathura");
      expect(result.bedrooms).toBe(2);
      expect(result.furnishing).toBe("semi_furnished");
    });

    it("accepts purpose=sale", () => {
      expect(searchSchema.parse({ purpose: "sale" }).purpose).toBe("sale");
    });

    it("accepts rental_kind=student", () => {
      expect(searchSchema.parse({ rental_kind: "student" }).rental_kind).toBe("student");
    });

    it("accepts all valid sort values", () => {
      for (const sort of ["price_asc", "price_desc", "newest", "popular"] as const) {
        expect(searchSchema.parse({ sort }).sort).toBe(sort);
      }
    });

    it("accepts max_distance up to 20000", () => {
      expect(searchSchema.parse({ max_distance: "20000" }).max_distance).toBe(20_000);
    });

    it("accepts gender_policy values", () => {
      for (const gp of ["any", "boys_only", "girls_only", "family_only"] as const) {
        expect(searchSchema.parse({ gender_policy: gp }).gender_policy).toBe(gp);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid inputs — must be rejected
  // ---------------------------------------------------------------------------
  describe("invalid inputs", () => {
    it("rejects unknown purpose", () => {
      expect(() => searchSchema.parse({ purpose: "buy" })).toThrow();
    });

    it("rejects unknown sort value", () => {
      expect(() => searchSchema.parse({ sort: "cheapest" })).toThrow();
    });

    it("rejects negative min_price", () => {
      expect(() => searchSchema.parse({ min_price: "-1" })).toThrow();
    });

    it("rejects bedrooms > 10", () => {
      expect(() => searchSchema.parse({ bedrooms: "11" })).toThrow();
    });

    it("rejects negative bedrooms", () => {
      expect(() => searchSchema.parse({ bedrooms: "-1" })).toThrow();
    });

    it("rejects max_distance over 20000m", () => {
      expect(() => searchSchema.parse({ max_distance: "20001" })).toThrow();
    });

    it("rejects q longer than 200 chars", () => {
      expect(() => searchSchema.parse({ q: "a".repeat(201) })).toThrow();
    });

    it("rejects per_page over 100", () => {
      expect(() => searchSchema.parse({ per_page: "101" })).toThrow();
    });

    it("rejects unknown rental_kind", () => {
      expect(() => searchSchema.parse({ rental_kind: "pg" })).toThrow();
    });

    it("rejects unknown gender_policy", () => {
      expect(() => searchSchema.parse({ gender_policy: "couples" })).toThrow();
    });
  });
});

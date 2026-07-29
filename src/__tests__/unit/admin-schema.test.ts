import { describe, it, expect } from "vitest";
import {
  rejectSchema,
  addCitySchema,
  addAreaSchema,
  prospectSchema,
} from "@/features/admin/schemas";

// ---------------------------------------------------------------------------
// rejectSchema — guards the approve/reject admin action
// ---------------------------------------------------------------------------
describe("rejectSchema", () => {
  it("accepts all known rejection reason codes", () => {
    const codes = [
      "PHOTOS_INSUFFICIENT",
      "PHOTOS_FAKE",
      "PRICE_IMPLAUSIBLE",
      "LOCATION_MISMATCH",
      "DUPLICATE",
      "CONTENT_POLICY",
      "INCOMPLETE",
      "SUSPECTED_FRAUD",
    ] as const;

    for (const reason_code of codes) {
      const result = rejectSchema.parse({ reason_code });
      expect(result.reason_code).toBe(reason_code);
    }
  });

  it("rejects an unknown reason_code — critical for input safety", () => {
    expect(() => rejectSchema.parse({ reason_code: "RANDOM_STRING" })).toThrow();
    expect(() => rejectSchema.parse({ reason_code: "" })).toThrow();
    expect(() => rejectSchema.parse({ reason_code: null })).toThrow();
  });

  it("accepts optional internal_notes up to 1000 chars", () => {
    const result = rejectSchema.parse({
      reason_code: "DUPLICATE",
      internal_notes: "Already listed as prop-123",
    });
    expect(result.internal_notes).toBe("Already listed as prop-123");
  });

  it("rejects internal_notes longer than 1000 chars", () => {
    expect(() =>
      rejectSchema.parse({
        reason_code: "DUPLICATE",
        internal_notes: "a".repeat(1001),
      })
    ).toThrow();
  });

  it("omits internal_notes when not provided", () => {
    const result = rejectSchema.parse({ reason_code: "INCOMPLETE" });
    expect(result.internal_notes).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// addCitySchema — seeds the cities table
// ---------------------------------------------------------------------------
describe("addCitySchema", () => {
  const valid = {
    name: "Mathura",
    slug: "mathura",
    district: "Mathura",
    state: "Uttar Pradesh",
  };

  it("accepts a valid city payload", () => {
    const result = addCitySchema.parse(valid);
    expect(result.name).toBe("Mathura");
    expect(result.slug).toBe("mathura");
  });

  it("rejects name shorter than 2 chars", () => {
    expect(() => addCitySchema.parse({ ...valid, name: "A" })).toThrow();
  });

  it("rejects slug shorter than 2 chars", () => {
    expect(() => addCitySchema.parse({ ...valid, slug: "a" })).toThrow();
  });

  it("rejects district shorter than 2 chars", () => {
    expect(() => addCitySchema.parse({ ...valid, district: "A" })).toThrow();
  });

  it("rejects state shorter than 2 chars", () => {
    expect(() => addCitySchema.parse({ ...valid, state: "U" })).toThrow();
  });

  it("accepts optional region_id", () => {
    const result = addCitySchema.parse({ ...valid, region_id: 1 });
    expect(result.region_id).toBe(1);
  });

  it("accepts optional position", () => {
    const result = addCitySchema.parse({ ...valid, position: 5 });
    expect(result.position).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// addAreaSchema
// ---------------------------------------------------------------------------
describe("addAreaSchema", () => {
  const valid = {
    city_id: 1,
    name: "Vrindavan",
    slug: "vrindavan",
  };

  it("accepts a valid area payload", () => {
    const result = addAreaSchema.parse(valid);
    expect(result.name).toBe("Vrindavan");
    expect(result.city_id).toBe(1);
  });

  it("rejects name shorter than 2 chars", () => {
    expect(() => addAreaSchema.parse({ ...valid, name: "V" })).toThrow();
  });

  it("accepts optional pincode", () => {
    const result = addAreaSchema.parse({ ...valid, pincode: "281121" });
    expect(result.pincode).toBe("281121");
  });

  it("accepts optional latitude/longitude", () => {
    const result = addAreaSchema.parse({ ...valid, latitude: 27.57, longitude: 77.66 });
    expect(result.latitude).toBeCloseTo(27.57);
  });
});

// ---------------------------------------------------------------------------
// prospectSchema — field CRM lead entry
// ---------------------------------------------------------------------------
describe("prospectSchema", () => {
  const valid = {
    prospect_name: "Ramesh Sharma",
    prospect_phone: "9876543210",
    seller_type: "owner" as const,
  };

  it("accepts a valid prospect", () => {
    const result = prospectSchema.parse(valid);
    expect(result.prospect_name).toBe("Ramesh Sharma");
    expect(result.prospect_phone).toBe("9876543210");
  });

  it("rejects name shorter than 2 chars", () => {
    expect(() => prospectSchema.parse({ ...valid, prospect_name: "A" })).toThrow();
  });

  it("rejects Indian mobile numbers not starting with 6-9", () => {
    expect(() => prospectSchema.parse({ ...valid, prospect_phone: "5123456789" })).toThrow();
    expect(() => prospectSchema.parse({ ...valid, prospect_phone: "1234567890" })).toThrow();
  });

  it("rejects phone numbers with fewer than 10 digits", () => {
    expect(() => prospectSchema.parse({ ...valid, prospect_phone: "987654321" })).toThrow();
  });

  it("rejects phone numbers with more than 10 digits", () => {
    expect(() => prospectSchema.parse({ ...valid, prospect_phone: "98765432101" })).toThrow();
  });

  it("rejects unknown seller_type", () => {
    expect(() => prospectSchema.parse({ ...valid, seller_type: "tenant" })).toThrow();
  });

  it("accepts all valid seller_types", () => {
    for (const seller_type of ["owner", "agent", "builder", "property_manager"] as const) {
      expect(prospectSchema.parse({ ...valid, seller_type }).seller_type).toBe(seller_type);
    }
  });
});

import { describe, it, expect } from "vitest";
import {
  propertyBasicSchema,
  propertyLocationSchema,
  propertyDetailsSchema,
} from "@/features/properties/schemas";

// ---------------------------------------------------------------------------
// propertyBasicSchema
// ---------------------------------------------------------------------------
describe("propertyBasicSchema", () => {
  const valid = {
    title: "2 BHK flat in Vrindavan near ISKCON temple",
    purpose: "rent" as const,
    property_type_id: 1,
    price: 8500,
    is_negotiable: false,
  };

  it("accepts a valid basic payload", () => {
    const result = propertyBasicSchema.parse(valid);
    expect(result.title).toBe(valid.title);
    expect(result.purpose).toBe("rent");
    expect(result.price).toBe(8500);
  });

  it("defaults is_negotiable to false when omitted", () => {
    const result = propertyBasicSchema.parse({ ...valid, is_negotiable: undefined });
    expect(result.is_negotiable).toBe(false);
  });

  it("rejects title shorter than 10 chars", () => {
    expect(() => propertyBasicSchema.parse({ ...valid, title: "Short" })).toThrow();
  });

  it("rejects title longer than 120 chars", () => {
    expect(() => propertyBasicSchema.parse({ ...valid, title: "a".repeat(121) })).toThrow();
  });

  it("rejects unknown purpose", () => {
    expect(() => propertyBasicSchema.parse({ ...valid, purpose: "buy" })).toThrow();
  });

  it("rejects non-positive price", () => {
    expect(() => propertyBasicSchema.parse({ ...valid, price: 0 })).toThrow();
    expect(() => propertyBasicSchema.parse({ ...valid, price: -1000 })).toThrow();
  });

  it("rejects non-positive property_type_id", () => {
    expect(() => propertyBasicSchema.parse({ ...valid, property_type_id: 0 })).toThrow();
    expect(() => propertyBasicSchema.parse({ ...valid, property_type_id: -1 })).toThrow();
  });

  it("rejects negative security_deposit", () => {
    expect(() => propertyBasicSchema.parse({ ...valid, security_deposit: -100 })).toThrow();
  });

  it("accepts all valid purpose values", () => {
    for (const purpose of ["sale", "rent", "lease"] as const) {
      expect(propertyBasicSchema.parse({ ...valid, purpose }).purpose).toBe(purpose);
    }
  });

  it("accepts optional rental_kind", () => {
    const result = propertyBasicSchema.parse({ ...valid, rental_kind: "student" });
    expect(result.rental_kind).toBe("student");
  });
});

// ---------------------------------------------------------------------------
// propertyLocationSchema
// ---------------------------------------------------------------------------
describe("propertyLocationSchema", () => {
  const valid = {
    address: "Near ISKCON temple, Vrindavan",
    city_id: 1,
  };

  it("accepts a valid location payload", () => {
    const result = propertyLocationSchema.parse(valid);
    expect(result.address).toBe(valid.address);
    expect(result.city_id).toBe(1);
  });

  it("rejects address shorter than 5 chars", () => {
    expect(() => propertyLocationSchema.parse({ ...valid, address: "Abc" })).toThrow();
  });

  it("rejects invalid pincode", () => {
    expect(() => propertyLocationSchema.parse({ ...valid, pincode: "1234" })).toThrow();
    expect(() => propertyLocationSchema.parse({ ...valid, pincode: "abcdef" })).toThrow();
  });

  it("accepts a valid 6-digit pincode", () => {
    const result = propertyLocationSchema.parse({ ...valid, pincode: "281121" });
    expect(result.pincode).toBe("281121");
  });

  it("rejects latitude out of range", () => {
    expect(() => propertyLocationSchema.parse({ ...valid, latitude: 91 })).toThrow();
    expect(() => propertyLocationSchema.parse({ ...valid, latitude: -91 })).toThrow();
  });

  it("rejects longitude out of range", () => {
    expect(() => propertyLocationSchema.parse({ ...valid, longitude: 181 })).toThrow();
    expect(() => propertyLocationSchema.parse({ ...valid, longitude: -181 })).toThrow();
  });

  it("accepts valid geo coordinates", () => {
    const result = propertyLocationSchema.parse({
      ...valid,
      latitude: 27.5706,
      longitude: 77.6622,
    });
    expect(result.latitude).toBeCloseTo(27.5706);
    expect(result.longitude).toBeCloseTo(77.6622);
  });
});

// ---------------------------------------------------------------------------
// propertyDetailsSchema
// ---------------------------------------------------------------------------
describe("propertyDetailsSchema", () => {
  it("defaults area_unit to sqft", () => {
    const result = propertyDetailsSchema.parse({});
    expect(result.area_unit).toBe("sqft");
  });

  it("defaults parking_spaces to 0", () => {
    const result = propertyDetailsSchema.parse({});
    expect(result.parking_spaces).toBe(0);
  });

  it("defaults description to empty string", () => {
    const result = propertyDetailsSchema.parse({});
    expect(result.description).toBe("");
  });

  it("rejects description over 3000 chars", () => {
    expect(() =>
      propertyDetailsSchema.parse({ description: "a".repeat(3001) })
    ).toThrow();
  });

  it("rejects bedrooms > 50", () => {
    expect(() => propertyDetailsSchema.parse({ bedrooms: 51 })).toThrow();
  });

  it("rejects negative parking_spaces", () => {
    expect(() => propertyDetailsSchema.parse({ parking_spaces: -1 })).toThrow();
  });

  it("accepts all valid area units", () => {
    for (const unit of ["sqft", "sqm", "gaj", "acre", "marla"] as const) {
      expect(propertyDetailsSchema.parse({ area_unit: unit }).area_unit).toBe(unit);
    }
  });

  it("rejects invalid youtube_url", () => {
    expect(() =>
      propertyDetailsSchema.parse({ youtube_url: "not-a-url" })
    ).toThrow();
  });

  it("accepts empty string for youtube_url", () => {
    const result = propertyDetailsSchema.parse({ youtube_url: "" });
    expect(result.youtube_url).toBe("");
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getStorageUrl, getPropertyImageUrl, resolveCoverImageUrl } from "@/lib/utils/storage";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
});

// ---------------------------------------------------------------------------
// getStorageUrl / getPropertyImageUrl
// ---------------------------------------------------------------------------
describe("getStorageUrl", () => {
  it("builds a public storage URL from a bucket and path", () => {
    expect(getStorageUrl("property-images", "abc/123.jpg")).toBe(
      "https://example.supabase.co/storage/v1/object/public/property-images/abc/123.jpg"
    );
  });

  it("returns null for a missing path", () => {
    expect(getStorageUrl("property-images", null)).toBeNull();
    expect(getStorageUrl("property-images", undefined)).toBeNull();
    expect(getStorageUrl("property-images", "")).toBeNull();
  });

  it("returns null when NEXT_PUBLIC_SUPABASE_URL is unset", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(getStorageUrl("property-images", "abc.jpg")).toBeNull();
  });
});

describe("getPropertyImageUrl", () => {
  it("resolves against the property-images bucket", () => {
    expect(getPropertyImageUrl("seller1/cover.jpg")).toBe(
      "https://example.supabase.co/storage/v1/object/public/property-images/seller1/cover.jpg"
    );
  });
});

// ---------------------------------------------------------------------------
// resolveCoverImageUrl — the field that C3 fixed (PropertyCard previously
// read a `cover_image_url` field that no query ever populated).
// ---------------------------------------------------------------------------
describe("resolveCoverImageUrl", () => {
  it("returns null for an empty or missing image list", () => {
    expect(resolveCoverImageUrl(null)).toBeNull();
    expect(resolveCoverImageUrl(undefined)).toBeNull();
    expect(resolveCoverImageUrl([])).toBeNull();
  });

  it("prefers the image marked is_cover over position order", () => {
    const url = resolveCoverImageUrl([
      { path: "first.jpg", is_cover: false, position: 0 },
      { path: "cover.jpg", is_cover: true, position: 2 },
    ]);
    expect(url).toContain("cover.jpg");
  });

  it("falls back to the lowest-position image when none is marked cover", () => {
    const url = resolveCoverImageUrl([
      { path: "second.jpg", is_cover: false, position: 1 },
      { path: "first.jpg", is_cover: false, position: 0 },
    ]);
    expect(url).toContain("first.jpg");
  });

  it("uses thumbnail_path when thumbnail option is set and available", () => {
    const url = resolveCoverImageUrl(
      [{ path: "full.jpg", thumbnail_path: "thumb.jpg", is_cover: true, position: 0 }],
      { thumbnail: true }
    );
    expect(url).toContain("thumb.jpg");
  });

  it("falls back to the full path when thumbnail_path is absent", () => {
    const url = resolveCoverImageUrl(
      [{ path: "full.jpg", is_cover: true, position: 0 }],
      { thumbnail: true }
    );
    expect(url).toContain("full.jpg");
  });
});

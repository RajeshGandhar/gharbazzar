import { test, expect } from "@playwright/test";

/**
 * Smoke tests — public pages only, no auth required.
 * These run against `next start` (production build) to catch build-time errors
 * as well as runtime regressions. Each test is deliberately narrow: we're
 * testing that the page renders at all, not pixel-perfect layout.
 */

// ---------------------------------------------------------------------------
// Health endpoint — DB reachability
// ---------------------------------------------------------------------------
test("GET /api/v1/health returns ok", async ({ request }) => {
  const res = await request.get("/api/v1/health");
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.data.status).toBe("ok");
  expect(json.data.db).toBe(true);
});

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------
test("homepage renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/GharBazaar|घरबाज़ार/i);
  // The hero search bar must be present on every page load
  await expect(page.getByRole("combobox").first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// Search page
// ---------------------------------------------------------------------------
test("search page renders with purpose=rent", async ({ page }) => {
  await page.goto("/search?purpose=rent");
  await expect(page).toHaveURL(/\/search/);
  // The page must not crash — presence of the main landmark is sufficient
  await expect(page.locator("main")).toBeVisible();
});

test("search page renders with purpose=sale", async ({ page }) => {
  await page.goto("/search?purpose=sale");
  await expect(page.locator("main")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Buy city hub pages (static paths from generateStaticParams)
// ---------------------------------------------------------------------------
test("buy city page renders for mathura", async ({ page }) => {
  await page.goto("/buy/mathura");
  // Must not 404
  await expect(page.locator("main")).toBeVisible();
  // Must not have the Next.js default error boundary text
  await expect(page.getByText("Application error")).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// Rent city hub pages
// ---------------------------------------------------------------------------
test("rent city page renders for mathura", async ({ page }) => {
  await page.goto("/rent/mathura");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByText("Application error")).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// 404 — unknown property slug should return not-found page, not crash
// ---------------------------------------------------------------------------
test("unknown property slug returns not-found page", async ({ page }) => {
  const res = await page.goto("/property/this-property-does-not-exist-xyz-999");
  // Next.js notFound() returns 404
  expect(res?.status()).toBe(404);
});

// ---------------------------------------------------------------------------
// Robots.txt — must be present for SEO
// ---------------------------------------------------------------------------
test("robots.txt is served", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("Disallow: /admin/");
  expect(text).toContain("Sitemap:");
});

// ---------------------------------------------------------------------------
// Sitemap — must return XML
// ---------------------------------------------------------------------------
test("sitemap.xml is served", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const contentType = res.headers()["content-type"] ?? "";
  expect(contentType).toMatch(/xml/);
});

/**
 * API Journey Tests — GharBazaar V1 critical paths
 *
 * Tests the full flow end-to-end via the API layer using programmatic
 * Supabase auth (no OTP email required). Each test group runs in series
 * because later tests depend on state produced by earlier ones.
 *
 * Required env vars (already in .env.local for local runs):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run:
 *   npm run test:e2e -- e2e/api-journeys.spec.ts
 */

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL    ?? "";
const SUPABASE_ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_ROLE    = process.env.SUPABASE_SERVICE_ROLE_KEY   ?? "";
const BASE            = process.env.PLAYWRIGHT_BASE_URL         ?? "http://localhost:3000";

const canRun = Boolean(SUPABASE_URL && SUPABASE_ANON && SERVICE_ROLE);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a Supabase test user and return their Bearer token. */
async function createTestUser(
  email: string,
  meta: Record<string, string> = {}
): Promise<{ userId: string; token: string }> {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create user with email pre-confirmed so no OTP email is needed
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: meta,
  });
  if (createErr) throw new Error(`createUser failed: ${createErr.message}`);
  const userId = created.user!.id;

  // Generate a magic-link token and exchange it for a live session
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${BASE}/auth/callback` },
  });
  if (linkErr) throw new Error(`generateLink failed: ${linkErr.message}`);

  const { data: verified, error: verifyErr } = await anon.auth.verifyOtp({
    token_hash: link!.properties.hashed_token,
    type: "email",
  });
  if (verifyErr || !verified.session) {
    throw new Error(`verifyOtp failed: ${verifyErr?.message ?? "no session"}`);
  }

  return { userId, token: verified.session.access_token };
}

/** Soft-delete test properties and delete test users after the suite. */
async function cleanup(userIds: string[], propertyIds: string[]) {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  if (propertyIds.length) {
    await admin
      .from("properties")
      .update({ deleted_at: new Date().toISOString(), status: "inactive" })
      .in("id", propertyIds);
  }
  for (const uid of userIds) {
    await admin.auth.admin.deleteUser(uid);
  }
}

// ---------------------------------------------------------------------------
// Journey 1: Seller → Admin → Seeker
// ---------------------------------------------------------------------------
test.describe.serial("Journey: list → approve → search → reveal → inquire", () => {
  test.skip(!canRun, "Supabase credentials not configured — set SUPABASE_SERVICE_ROLE_KEY");

  // Shared state across tests in this suite
  let sellerToken  = "";
  let adminToken   = "";
  let customerToken = "";
  let propertyId   = "";
  let propertySlug = "";
  const userIds: string[]     = [];
  const propertyIds: string[] = [];

  let cityId: number;
  let propertyTypeId: number;

  // ── Setup ─────────────────────────────────────────────────────────────────

  test.beforeAll(async () => {
    const ts = Date.now();

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create test users in parallel
    const [seller, adminUser, customer] = await Promise.all([
      // seller_type in metadata triggers the handle_new_user trigger to create sellers row
      createTestUser(`e2e-seller-${ts}@gharbazaar-test.com`, { seller_type: "owner" }),
      createTestUser(`e2e-admin-${ts}@gharbazaar-test.com`,  {}),
      createTestUser(`e2e-customer-${ts}@gharbazaar-test.com`, {}),
    ]);

    sellerToken   = seller.token;
    adminToken    = adminUser.token;
    customerToken = customer.token;
    userIds.push(seller.userId, adminUser.userId, customer.userId);

    // Elevate admin test user to super_admin (requireAdmin reads profiles table)
    await admin
      .from("profiles")
      .update({ role: "super_admin" })
      .eq("id", adminUser.userId);

    // Resolve seeded master-data IDs used in create-property payload
    const [{ data: city }, { data: propType }] = await Promise.all([
      admin.from("cities").select("id").eq("slug", "mathura").single(),
      admin.from("property_types").select("id").eq("slug", "apartment-flat").single(),
    ]);
    if (!city || !propType) throw new Error("Seed data missing — run migrations first");

    cityId         = city.id;
    propertyTypeId = propType.id;
  });

  test.afterAll(() => cleanup(userIds, propertyIds));

  // ── Tests ─────────────────────────────────────────────────────────────────

  test("seller can create a draft listing", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/properties`, {
      headers: {
        Authorization: `Bearer ${sellerToken}`,
        "Content-Type": "application/json",
      },
      data: {
        title: "E2E Test — 2 BHK Flat in Krishna Nagar",
        purpose: "rent",
        property_type_id: propertyTypeId,
        price: 12000,
        address: "123 Test Street, Krishna Nagar, Mathura",
        city_id: cityId,
        bedrooms: 2,
        bathrooms: 1,
        built_up_area: 900,
        description: "E2E test listing — safe to delete.",
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBeTruthy();
    expect(body.data.slug).toMatch(/e2e-test/i);

    propertyId   = body.data.id;
    propertySlug = body.data.slug;
    propertyIds.push(propertyId);
  });

  test("seller can submit listing for admin review", async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/v1/properties/${propertyId}/publish`,
      { headers: { Authorization: `Bearer ${sellerToken}` } }
    );

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.approval_status).toBe("pending");
  });

  test("unauthenticated user cannot access listing before approval", async ({ request }) => {
    // Property is in draft/pending state — should not be visible publicly
    const res = await request.get(`${BASE}/api/v1/properties/${propertyId}`);
    // Either 404 (not found by anon) or 403 — must not return active listing data
    expect([403, 404]).toContain(res.status());
  });

  test("admin can approve the listing", async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/v1/admin/properties/${propertyId}/approve`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(propertyId);
  });

  test("non-admin cannot call admin approve endpoint", async ({ request }) => {
    // Use seller token — must be rejected
    const res = await request.post(
      `${BASE}/api/v1/admin/properties/${propertyId}/approve`,
      { headers: { Authorization: `Bearer ${sellerToken}` } }
    );
    expect(res.status()).toBe(401);
  });

  test("approved listing appears in search results", async ({ request }) => {
    // Search is public — no auth header
    const res = await request.get(
      `${BASE}/api/v1/search?purpose=rent&city_id=${cityId}&q=E2E+Test`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = (body.data ?? []).some(
      (p: { slug: string }) => p.slug === propertySlug
    );
    expect(found, `Property ${propertySlug} not found in search results`).toBe(true);
  });

  test("seeker can reveal seller contact (authenticated)", async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/v1/properties/${propertyId}/reveal`,
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Phone may be null if test seller has no phone set — endpoint must still succeed
    expect(body.data).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(body.data, "phone")).toBe(true);
  });

  test("anonymous user cannot reveal contact", async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/v1/properties/${propertyId}/reveal`
      // No Authorization header
    );
    expect(res.status()).toBe(401);
  });

  test("seeker can submit an inquiry (anonymous allowed)", async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/v1/properties/${propertyId}/inquire`,
      {
        headers: { "Content-Type": "application/json" },
        data: {
          name: "E2E Test Seeker",
          phone: "9000000001",
          message: "Interested in this E2E test listing",
          source: "form",
        },
      }
    );
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBeTruthy();
  });

  test("seller can see the inquiry in their leads", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/leads`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = (body.data ?? []).some(
      (lead: { property_id: string }) => lead.property_id === propertyId
    );
    expect(found, "Inquiry not found in seller leads").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Journey 2: Admin reject → seller resubmit
// ---------------------------------------------------------------------------
test.describe.serial("Journey: reject listing → seller resubmits", () => {
  test.skip(!canRun, "Supabase credentials not configured");

  let sellerToken  = "";
  let adminToken   = "";
  let propertyId   = "";
  const userIds: string[]     = [];
  const propertyIds: string[] = [];
  let cityId: number;
  let propertyTypeId: number;

  test.beforeAll(async () => {
    const ts = Date.now();
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const [seller, adminUser] = await Promise.all([
      createTestUser(`e2e-reject-seller-${ts}@gharbazaar-test.com`, { seller_type: "owner" }),
      createTestUser(`e2e-reject-admin-${ts}@gharbazaar-test.com`, {}),
    ]);

    sellerToken = seller.token;
    adminToken  = adminUser.token;
    userIds.push(seller.userId, adminUser.userId);

    await admin.from("profiles").update({ role: "super_admin" }).eq("id", adminUser.userId);

    const [{ data: city }, { data: propType }] = await Promise.all([
      admin.from("cities").select("id").eq("slug", "mathura").single(),
      admin.from("property_types").select("id").eq("slug", "apartment-flat").single(),
    ]);
    cityId         = city!.id;
    propertyTypeId = propType!.id;
  });

  test.afterAll(() => cleanup(userIds, propertyIds));

  test("create and submit listing", async ({ request }) => {
    const create = await request.post(`${BASE}/api/v1/properties`, {
      headers: { Authorization: `Bearer ${sellerToken}`, "Content-Type": "application/json" },
      data: {
        title: "E2E Reject Flow — 1 BHK Test Flat",
        purpose: "rent",
        property_type_id: propertyTypeId,
        price: 8000,
        address: "456 Test Colony, Mathura",
        city_id: cityId,
        description: "E2E reject flow test — safe to delete.",
      },
    });
    expect(create.status()).toBe(201);
    propertyId = (await create.json()).data.id;
    propertyIds.push(propertyId);

    const publish = await request.post(`${BASE}/api/v1/properties/${propertyId}/publish`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    expect(publish.status()).toBe(200);
  });

  test("admin rejects listing with reason", async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/v1/admin/properties/${propertyId}/reject`,
      {
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        data: { reason_code: "incomplete_details", internal_notes: "E2E test rejection" },
      }
    );
    expect(res.status()).toBe(200);
  });

  test("seller can resubmit a rejected listing", async ({ request }) => {
    // Rejected listings have status 'inactive' — publish accepts inactive
    const res = await request.post(
      `${BASE}/api/v1/properties/${propertyId}/publish`,
      { headers: { Authorization: `Bearer ${sellerToken}` } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.approval_status).toBe("pending");
  });
});

// ---------------------------------------------------------------------------
// Journey 3: Health check (also in smoke — belt and suspenders)
// ---------------------------------------------------------------------------
test("health endpoint reports DB connected", async ({ request }) => {
  const res = await request.get(`${BASE}/api/v1/health`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.data.db).toBe(true);
});

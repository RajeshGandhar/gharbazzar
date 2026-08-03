/**
 * Standalone property seed script — runs via `npx tsx scripts/seed-properties.ts`
 * Uses the service-role key directly; no browser/auth required.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ofehkqlnrozmtqnapsso.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZWhrcWxucm96bXRxbmFwc3NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTIzNDY1OSwiZXhwIjoyMTAwODEwNjU5fQ.s1rNt5TDgNXJtQ1jozLkSfKRZ4l5ATMx9_s0RVKIJIE";

// Node 20 lacks native WebSocket — disable realtime to avoid the startup error
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: class MockWS { static OPEN = 1; readyState = 1; constructor() {} close() {} send() {} addEventListener() {} removeEventListener() {} } as unknown as typeof WebSocket },
});

// ── Property templates (same as seed-runner.tsx) ──────────────────────────────

const TEMPLATES = [
  // Mathura — For Sale
  { title: "3 BHK Premium Flat in Mathura Vrindavan Road", purpose: "sale", bedrooms: 3, builtUpArea: 1450, price: 8500000, citySlug: "mathura" },
  { title: "Spacious 2 BHK Apartment near ISKCON Temple", purpose: "sale", bedrooms: 2, builtUpArea: 980, price: 5200000, citySlug: "mathura" },
  { title: "Luxury Villa with Garden — Mathura-Agra Highway", purpose: "sale", bedrooms: 4, builtUpArea: 3200, price: 18500000, citySlug: "mathura" },
  { title: "Ready-to-Move 2 BHK Flat in Vrindavan Colony", purpose: "sale", bedrooms: 2, builtUpArea: 1050, price: 6200000, citySlug: "mathura" },
  { title: "200 sqyd Residential Plot — Govardhan Road", purpose: "sale", bedrooms: null, builtUpArea: 1800, price: 3800000, citySlug: "mathura" },
  { title: "Premium 4 BHK Duplex — New Mathura Township", purpose: "sale", bedrooms: 4, builtUpArea: 2400, price: 14200000, citySlug: "mathura" },
  { title: "1 BHK Starter Flat — Near Railway Station Mathura", purpose: "sale", bedrooms: 1, builtUpArea: 540, price: 2800000, citySlug: "mathura" },
  { title: "Corner Plot 150 sqyd — Sikandra Road Mathura", purpose: "sale", bedrooms: null, builtUpArea: 1350, price: 2950000, citySlug: "mathura" },
  // Vrindavan — For Sale
  { title: "3 BHK Ashram-Facing Flat — Vrindavan Dham", purpose: "sale", bedrooms: 3, builtUpArea: 1380, price: 9200000, citySlug: "vrindavan" },
  { title: "2 BHK Flat with Temple View — Vrindavan", purpose: "sale", bedrooms: 2, builtUpArea: 1100, price: 7400000, citySlug: "vrindavan" },
  { title: "Pilgrim Guesthouse Property — 8 Rooms", purpose: "sale", bedrooms: null, builtUpArea: 4200, price: 28000000, citySlug: "vrindavan" },
  // Mathura — For Rent
  { title: "Furnished 2 BHK Flat for Rent — Mathura City", purpose: "rent", bedrooms: 2, builtUpArea: 900, price: 18000, citySlug: "mathura" },
  { title: "1 BHK Flat — Near GLA University Gate", purpose: "rent", bedrooms: 1, builtUpArea: 500, price: 9500, citySlug: "mathura" },
  { title: "3 BHK Semi-Furnished Apartment — Mathura", purpose: "rent", bedrooms: 3, builtUpArea: 1350, price: 25000, citySlug: "mathura" },
  { title: "Studio Flat with Balcony — Mathura Cantt", purpose: "rent", bedrooms: 0, builtUpArea: 350, price: 7500, citySlug: "mathura" },
  // Delhi — For Rent
  { title: "2 BHK Flat for Rent — Lajpat Nagar Delhi", purpose: "rent", bedrooms: 2, builtUpArea: 950, price: 32000, citySlug: "delhi" },
  { title: "3 BHK Semi-Furnished Flat — South Delhi", purpose: "rent", bedrooms: 3, builtUpArea: 1400, price: 48000, citySlug: "delhi" },
  { title: "1 BHK Compact Flat — Mukherjee Nagar", purpose: "rent", bedrooms: 1, builtUpArea: 450, price: 14000, citySlug: "delhi" },
  { title: "Fully Furnished Studio — Greater Kailash", purpose: "rent", bedrooms: 0, builtUpArea: 320, price: 18000, citySlug: "delhi" },
  { title: "2 BHK with Parking — Dwarka Sector 12", purpose: "rent", bedrooms: 2, builtUpArea: 1050, price: 28000, citySlug: "delhi" },
  { title: "4 BHK Independent Floor — Rohini Delhi", purpose: "rent", bedrooms: 4, builtUpArea: 2100, price: 55000, citySlug: "delhi" },
  // Delhi — Student Housing
  { title: "Boys PG near DU North Campus — AC Double Sharing", purpose: "rent", bedrooms: 0, builtUpArea: 120, price: 8000, citySlug: "delhi", rentalKind: "student", genderPolicy: "boys_only" },
  { title: "Girls PG near Mukherjee Nagar UPSC Hub — 3 Meals", purpose: "rent", bedrooms: 0, builtUpArea: 100, price: 9500, citySlug: "delhi", rentalKind: "student", genderPolicy: "girls_only" },
  { title: "Co-ed Hostel near Karol Bagh Coaching Centre", purpose: "rent", bedrooms: 0, builtUpArea: 80, price: 7000, citySlug: "delhi", rentalKind: "student", genderPolicy: "any" },
  { title: "Premium Girls PG near Miranda House DU", purpose: "rent", bedrooms: 0, builtUpArea: 150, price: 12000, citySlug: "delhi", rentalKind: "student", genderPolicy: "girls_only" },
  { title: "Boys PG near GTB Nagar Metro — Breakfast Included", purpose: "rent", bedrooms: 0, builtUpArea: 90, price: 8500, citySlug: "delhi", rentalKind: "student", genderPolicy: "boys_only" },
  // Noida — For Sale
  { title: "3 BHK Ready Flat — Noida Sector 62 IT Hub", purpose: "sale", bedrooms: 3, builtUpArea: 1560, price: 12500000, citySlug: "noida" },
  { title: "2 BHK Premium Apartment — Noida Sector 137", purpose: "sale", bedrooms: 2, builtUpArea: 1050, price: 8200000, citySlug: "noida" },
  { title: "4 BHK Penthouse — Noida Expressway", purpose: "sale", bedrooms: 4, builtUpArea: 3800, price: 32000000, citySlug: "noida" },
  { title: "1 BHK Investment Flat — Noida Sector 150", purpose: "sale", bedrooms: 1, builtUpArea: 580, price: 4500000, citySlug: "noida" },
  // Noida — For Rent
  { title: "Furnished 2 BHK Flat — Noida Sector 44", purpose: "rent", bedrooms: 2, builtUpArea: 1100, price: 26000, citySlug: "noida" },
  { title: "3 BHK Semi-Furnished — Noida Sector 77", purpose: "rent", bedrooms: 3, builtUpArea: 1500, price: 38000, citySlug: "noida" },
  { title: "1 BHK Compact — Near Amity Noida Gate", purpose: "rent", bedrooms: 1, builtUpArea: 480, price: 12000, citySlug: "noida" },
  // Noida — Student Housing
  { title: "Boys Hostel near Amity University Noida", purpose: "rent", bedrooms: 0, builtUpArea: 110, price: 9000, citySlug: "noida", rentalKind: "student", genderPolicy: "boys_only" },
  { title: "Girls PG near IIMT College Noida — All Meals", purpose: "rent", bedrooms: 0, builtUpArea: 130, price: 11000, citySlug: "noida", rentalKind: "student", genderPolicy: "girls_only" },
  { title: "Shared Flat for Students — Sector 62 Noida", purpose: "rent", bedrooms: 0, builtUpArea: 200, price: 8000, citySlug: "noida", rentalKind: "student", genderPolicy: "any" },
  // Greater Noida — For Sale
  { title: "3 BHK Premium Flat — Greater Noida West", purpose: "sale", bedrooms: 3, builtUpArea: 1650, price: 9800000, citySlug: "greater-noida" },
  { title: "2 BHK Affordable Flat — Knowledge Park III", purpose: "sale", bedrooms: 2, builtUpArea: 980, price: 5900000, citySlug: "greater-noida" },
  { title: "Plot 250 sqyd — Yamuna Expressway Zone", purpose: "sale", bedrooms: null, builtUpArea: 2250, price: 7500000, citySlug: "greater-noida" },
  { title: "Independent Villa 4 BHK — Omega I Greater Noida", purpose: "sale", bedrooms: 4, builtUpArea: 4000, price: 22000000, citySlug: "greater-noida" },
  // Greater Noida — For Rent
  { title: "2 BHK Furnished Flat — Greater Noida West", purpose: "rent", bedrooms: 2, builtUpArea: 1050, price: 18000, citySlug: "greater-noida" },
  { title: "3 BHK Semi-Furnished — Gaur City Greater Noida", purpose: "rent", bedrooms: 3, builtUpArea: 1400, price: 26000, citySlug: "greater-noida" },
  // Greater Noida — Student Housing
  { title: "Boys PG near Sharda University Greater Noida", purpose: "rent", bedrooms: 0, builtUpArea: 100, price: 8500, citySlug: "greater-noida", rentalKind: "student", genderPolicy: "boys_only" },
  { title: "Girls Hostel near Bennett University", purpose: "rent", bedrooms: 0, builtUpArea: 120, price: 10000, citySlug: "greater-noida", rentalKind: "student", genderPolicy: "girls_only" },
  // Govardhan — For Sale
  { title: "Cottage / Farmhouse near Govardhan Parikrama Road", purpose: "sale", bedrooms: 3, builtUpArea: 2800, price: 12000000, citySlug: "govardhan" },
  { title: "Residential Plot 100 sqyd — Govardhan Town", purpose: "sale", bedrooms: null, builtUpArea: 900, price: 1800000, citySlug: "govardhan" },
  { title: "2 BHK Flat near Radha Kund Govardhan", purpose: "sale", bedrooms: 2, builtUpArea: 850, price: 4200000, citySlug: "govardhan" },
];

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function log(msg: string) {
  process.stdout.write(msg + "\n");
}

async function main() {
  log("Fetching reference data…");

  const [
    { data: cities },
    { data: areas },
    { data: amenities },
    { data: sellersInit },
  ] = await Promise.all([
    admin.from("cities").select("id, name, slug").eq("is_active", true),
    admin.from("areas").select("id, name, slug, city_id").eq("is_active", true),
    admin.from("amenities").select("id, name, slug").eq("is_active", true),
    admin.from("sellers").select("id, slug").eq("kyc_status", "verified").limit(10),
  ]);

  let sellers = sellersInit;

  if (!sellers || sellers.length === 0) {
    log("  No verified sellers — creating a demo seed seller…");

    // Create auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: "seed-seller@gharbazaar.dev",
      password: "SeedSeller@2026!",
      email_confirm: true,
      user_metadata: { full_name: "GharBazaar Demo Seller" },
    });

    if (authErr || !authData.user) {
      // User might already exist — look it up
      const { data: existing } = await admin.auth.admin.listUsers();
      const found = existing?.users?.find(u => u.email === "seed-seller@gharbazaar.dev");
      if (!found) {
        log(`✗ Could not create seed seller: ${authErr?.message}`);
        process.exit(1);
      }
      authData!.user = found;
    }

    const userId = authData!.user!.id;

    // Upsert profile
    await admin.from("profiles").upsert({
      id: userId,
      full_name: "GharBazaar Demo Seller",
      email: "seed-seller@gharbazaar.dev",
      role: "seller",
    }, { onConflict: "id" });

    // Upsert seller row
    const { error: sellerErr } = await admin.from("sellers").upsert({
      id: userId,
      business_name: "GharBazaar Demo Agency",
      slug: "gharbazaar-demo-agency",
      seller_type: "agent",
      kyc_status: "verified",
      is_verified: true,
      verified_at: new Date().toISOString(),
    }, { onConflict: "id" });

    if (sellerErr) {
      log(`✗ Could not create seller row: ${sellerErr.message}`);
      process.exit(1);
    }

    log("  ✓ Demo seller created (seed-seller@gharbazaar.dev)\n");

    // Re-fetch
    const { data: freshSellers } = await admin.from("sellers").select("id, slug").eq("kyc_status", "verified").limit(10);
    sellers = freshSellers ?? [];

    if (sellers.length === 0) {
      log("✗ Still no sellers after creation. Check DB logs.");
      process.exit(1);
    }
  }

  if (!cities || cities.length === 0) {
    log("✗ No active cities found. Run the cities seed first.");
    process.exit(1);
  }

  // Fetch first available property type (required NOT NULL column)
  const { data: propTypes } = await admin.from("property_types").select("id").limit(5);
  const defaultPropTypeId = propTypes?.[0]?.id ?? null;
  if (!defaultPropTypeId) {
    log("✗ No property types found. Run the property-types seed first.");
    process.exit(1);
  }

  log(`  Cities: ${cities.length}, Areas: ${areas?.length ?? 0}, Amenities: ${amenities?.length ?? 0}, Sellers: ${sellers.length}, PropType: ${defaultPropTypeId}\n`);

  const cityMap = Object.fromEntries(cities.map((c) => [c.slug, c]));
  const areaMap: Record<number, typeof areas> = {};
  for (const area of areas ?? []) {
    if (!areaMap[area.city_id]) areaMap[area.city_id] = [];
    areaMap[area.city_id]!.push(area);
  }

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < TEMPLATES.length; i++) {
    const tpl = TEMPLATES[i]!;
    const city = cityMap[tpl.citySlug];

    if (!city) {
      log(`⚠  Skip (no city "${tpl.citySlug}"): ${tpl.title.slice(0, 50)}`);
      skipped++;
      continue;
    }

    const cityAreas = areaMap[city.id] ?? [];
    const area = cityAreas.length > 0 ? cityAreas[i % cityAreas.length] : null;
    const seller = sellers[i % sellers.length]!;
    const uniqueSlug = `${slugify(tpl.title)}-${Date.now()}-${i}`;

    // 1. Insert property
    const { data: property, error: propError } = await admin
      .from("properties")
      .insert({
        seller_id: seller.id,
        property_type_id: defaultPropTypeId,
        city_id: city.id,
        area_id: area?.id ?? null,
        title: tpl.title,
        slug: uniqueSlug,
        address: `${area?.name ?? city.name}, ${city.name}, India`,
        purpose: tpl.purpose,
        price: tpl.price,
        bedrooms: tpl.bedrooms,
        built_up_area: tpl.builtUpArea,
        rental_kind: (tpl as { rentalKind?: string }).rentalKind ?? null,
        gender_policy: (tpl as { genderPolicy?: string }).genderPolicy ?? "any",
        furnishing: (["unfurnished", "semi_furnished", "fully_furnished"] as const)[i % 3],
        construction_status: "ready_to_move",
        is_featured: i % 7 === 0,
        status: "active",
        approval_status: "approved",
        approved_at: new Date().toISOString(),
        published_at: new Date(Date.now() - i * 3600000).toISOString(),
        description: `Premium ${tpl.title}. Located in ${city.name}${area ? `, ${area.name}` : ""}. Verified seller, transparent pricing, no hidden charges.`,
      })
      .select("id")
      .single();

    if (propError || !property) {
      log(`✗  Failed to insert "${tpl.title.slice(0, 45)}": ${propError?.message ?? "unknown"}`);
      skipped++;
      continue;
    }

    const propId = property.id as string;

    // 2. Attach amenities (3 per property, cycling)
    if (amenities && amenities.length > 0) {
      const slice = amenities.slice((i * 3) % amenities.length, ((i * 3) % amenities.length) + 3);
      for (const a of slice) {
        await admin.from("property_amenities").insert({ property_id: propId, amenity_id: a.id }).then(() => {}).catch(() => {});
      }
    }

    // 3. Fetch image from picsum and upload to storage
    const picsumSeed = (i % 100) + 1;
    const imgUrl = `https://picsum.photos/seed/${picsumSeed}/800/600`;
    try {
      const imgRes = await fetch(imgUrl, { redirect: "follow" });
      if (imgRes.ok) {
        const bytes = await imgRes.arrayBuffer();
        const storagePath = `seed/${propId}/cover.jpg`;

        const { error: uploadErr } = await admin.storage
          .from("property-images")
          .upload(storagePath, bytes, { contentType: "image/jpeg", upsert: true });

        if (!uploadErr) {
          await admin.from("property_images").insert({
            property_id: propId,
            path: storagePath,
            is_cover: true,
            position: 0,
          });
          log(`✓  [${String(i + 1).padStart(2, "0")}/${TEMPLATES.length}] ${tpl.title.slice(0, 55)} 📷`);
        } else {
          log(`✓  [${String(i + 1).padStart(2, "0")}/${TEMPLATES.length}] ${tpl.title.slice(0, 55)} (img upload failed: ${uploadErr.message})`);
        }
      } else {
        log(`✓  [${String(i + 1).padStart(2, "0")}/${TEMPLATES.length}] ${tpl.title.slice(0, 55)} (img fetch ${imgRes.status})`);
      }
    } catch (e) {
      log(`✓  [${String(i + 1).padStart(2, "0")}/${TEMPLATES.length}] ${tpl.title.slice(0, 55)} (img error: ${e})`);
    }

    created++;
  }

  log(`\n🎉  Done! Created ${created} properties, skipped ${skipped}.`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

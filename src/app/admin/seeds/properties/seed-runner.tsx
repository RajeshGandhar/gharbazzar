"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, AlertTriangle, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { seedPropertyImage } from "./actions";

type City     = { id: number; name: string; slug: string; region_id: number | null };
type Area     = { id: number; name: string; slug: string; city_id: number };
type Amenity  = { id: number; name: string; slug: string };
type Seller   = { id: string; slug: string; seller_type: string };

interface Props {
  cities:    City[];
  areas:     Area[];
  amenities: Amenity[];
  sellers:   Seller[];
}

type SeedStatus = "idle" | "running" | "done" | "error";

// ── Realistic Indian real estate seed data ──────────────────────────────────

const PROPERTY_TEMPLATES = [
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

  // Delhi — Student Housing (PG)
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
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function SeedRunner({ cities, areas, amenities, sellers }: Props) {
  const [status, setStatus] = useState<SeedStatus>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const canRun = sellers.length > 0 && cities.length > 0;

  function addLog(msg: string) {
    setLog((prev) => [...prev, msg]);
  }

  async function runSeed() {
    if (!canRun) return;
    setStatus("running");
    setLog([]);
    setProgress(0);

    try {
      const cityMap = Object.fromEntries(cities.map((c) => [c.slug, c]));
      const areaMap: Record<number, Area[]> = {};
      for (const area of areas) {
        if (!areaMap[area.city_id]) areaMap[area.city_id] = [];
        areaMap[area.city_id].push(area);
      }

      let created = 0;
      let skipped = 0;

      for (let i = 0; i < PROPERTY_TEMPLATES.length; i++) {
        const tpl = PROPERTY_TEMPLATES[i];
        const city = cityMap[tpl.citySlug];

        if (!city) {
          addLog(`⚠ Skip: city "${tpl.citySlug}" not found in DB`);
          skipped++;
          continue;
        }

        const cityAreas = areaMap[city.id] ?? [];
        const area = cityAreas.length > 0 ? cityAreas[i % cityAreas.length] : null;
        const seller = sellers[i % sellers.length];

        // Generate unique slug
        const baseSlug = slugify(tpl.title);
        const uniqueSlug = `${baseSlug}-${Date.now()}-${i}`;

        const propertyPayload = {
          seller_id: seller.id,
          city_id: city.id,
          area_id: area?.id ?? null,
          title: tpl.title,
          slug: uniqueSlug,
          purpose: tpl.purpose as "sale" | "rent",
          price: tpl.price,
          bedrooms: tpl.bedrooms,
          built_up_area: tpl.builtUpArea,
          rental_kind: (tpl as { rentalKind?: string }).rentalKind ?? null,
          gender_policy: (tpl as { genderPolicy?: string }).genderPolicy ?? null,
          property_category: "residential",
          furnishing_status: ["unfurnished", "semi_furnished", "fully_furnished"][i % 3],
          construction_status: "ready_to_move",
          is_featured: i % 7 === 0,   // every 7th is featured
          is_verified: i % 3 === 0,   // every 3rd is verified
          status: "active",
          approval_status: "approved",
          approved_at: new Date().toISOString(),
          published_at: new Date(Date.now() - i * 3600000).toISOString(), // staggered timestamps
          description: `Premium ${tpl.title}. Located in ${city.name}${area ? `, ${area.name}` : ""}. Verified seller, transparent pricing, no hidden charges.`,
        };

        const res = await fetch("/api/v1/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(propertyPayload),
        });

        if (res.ok) {
          const data = await res.json() as { data?: { id?: string } };
          const propId = data.data?.id;

          // Add 2–4 amenities per property
          if (propId && amenities.length > 0) {
            const propAmenities = amenities.slice((i * 3) % amenities.length, ((i * 3) % amenities.length) + 3);
            for (const a of propAmenities) {
              await fetch(`/api/v1/properties/${propId}/amenities`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amenity_id: a.id }),
              });
            }
          }

          // Upload cover image from picsum.photos via server action
          if (propId) {
            const imgResult = await seedPropertyImage(propId, i);
            if (imgResult.ok) {
              addLog(`  📷 Image uploaded: seed/${propId.slice(0, 8)}…/cover.jpg`);
            } else {
              addLog(`  ⚠ Image skipped: ${imgResult.error}`);
            }
          }

          addLog(`✓ Created: ${tpl.title.slice(0, 55)}…`);
          created++;
        } else {
          const err = await res.text();
          addLog(`✗ Failed: ${tpl.title.slice(0, 40)}… (${res.status}: ${err.slice(0, 60)})`);
          skipped++;
        }

        setProgress(Math.round(((i + 1) / PROPERTY_TEMPLATES.length) * 100));
      }

      addLog(`\n🎉 Done! Created ${created} properties, skipped ${skipped}.`);
      setStatus("done");
    } catch (err) {
      addLog(`💥 Unexpected error: ${err}`);
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Seed 50 properties
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Creates realistic residential &amp; student housing listings across Braj &amp; NCR.
            Each property gets amenities attached and a real cover photo fetched from picsum.photos.
            Safe to run multiple times (new slugs each run).
          </p>
        </div>
        <Building2 className="h-8 w-8 text-muted-foreground/30 shrink-0" />
      </div>

      {/* Progress bar */}
      {status === "running" && (
        <div className="space-y-2">
          <div className="flex h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progress}% complete — creating properties &amp; uploading images…</p>
        </div>
      )}

      {/* Run button */}
      <Button
        onClick={runSeed}
        disabled={!canRun || status === "running"}
        className="gap-2 w-full sm:w-auto"
      >
        {status === "running" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Seeding properties…
          </>
        ) : status === "done" ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Seed again
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Run seed ({PROPERTY_TEMPLATES.length} properties)
          </>
        )}
      </Button>

      {/* Log output */}
      {log.length > 0 && (
        <div className="rounded-xl bg-muted/50 border border-border p-4 max-h-80 overflow-y-auto">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Seed log
          </p>
          <div className="space-y-1">
            {log.map((line, i) => (
              <p
                key={i}
                className={cn(
                  "text-xs font-mono",
                  line.startsWith("✓") ? "text-emerald-600 dark:text-emerald-400" :
                  line.startsWith("✗") ? "text-red-500" :
                  line.startsWith("⚠") ? "text-amber-600 dark:text-amber-400" :
                  line.startsWith("🎉") ? "text-primary font-semibold" :
                  line.startsWith("💥") ? "text-red-600 font-semibold" :
                  "text-muted-foreground"
                )}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-700/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Seed complete! Visit the{" "}
          <a href="/search" className="underline font-medium hover:no-underline">
            search page
          </a>{" "}
          or{" "}
          <a href="/" className="underline font-medium hover:no-underline">
            homepage
          </a>{" "}
          to see the properties.
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-700/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Some errors occurred. Check the log above and ensure the API is running.
        </div>
      )}
    </div>
  );
}

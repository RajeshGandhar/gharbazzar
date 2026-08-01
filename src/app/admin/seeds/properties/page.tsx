"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SeedRunner } from "./seed-runner";

export default async function SeedPropertiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Check super_admin role
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") redirect("/");

  // Fetch existing data for the seed runner to use
  const admin = createAdminClient();
  const [{ data: cities }, { data: areas }, { data: amenities }, { data: sellers }] = await Promise.all([
    admin.from("cities").select("id, name, slug, region_id").eq("is_active", true).order("position"),
    admin.from("areas").select("id, name, slug, city_id").eq("is_active", true),
    admin.from("amenities").select("id, name, slug").eq("is_active", true),
    admin.from("sellers").select("id, slug, seller_type").eq("kyc_status", "verified").limit(10),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Property Seed Data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate 50 realistic premium properties for development and demo purposes.
          Requires at least one verified seller to exist.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Current database state</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Cities",    value: cities?.length ?? 0 },
            { label: "Areas",     value: areas?.length ?? 0 },
            { label: "Amenities", value: amenities?.length ?? 0 },
            { label: "Sellers",   value: sellers?.length ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {(!sellers || sellers.length === 0) && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-700 dark:text-amber-400">
            <strong>No verified sellers found.</strong> You need at least one seller with KYC status
            &quot;verified&quot; before seeding properties. Create a seller account and verify their KYC first.
          </div>
        )}
      </div>

      <SeedRunner
        cities={cities ?? []}
        areas={areas ?? []}
        amenities={amenities ?? []}
        sellers={sellers ?? []}
      />
    </div>
  );
}

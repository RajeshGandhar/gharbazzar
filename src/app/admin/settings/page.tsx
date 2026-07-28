export const revalidate = 0;

import { getAllSettings } from "@/features/admin/server/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatFreshness } from "@/lib/utils/format";
import { SettingRow } from "./setting-row";

// Default settings to seed if empty
const DEFAULT_SETTINGS = [
  { key: "maintenance_mode", value: false },
  { key: "approval_sla_hours", value: 4 },
  { key: "listing_expiry_days", value: 60 },
  { key: "support_hours", value: "9:00 AM – 9:00 PM IST" },
];

export default async function SettingsPage() {
  let settings = await getAllSettings();

  // Seed defaults if table is empty
  if (settings.length === 0) {
    const supabase = createAdminClient();
    await supabase.from("site_settings").upsert(
      DEFAULT_SETTINGS.map((s) => ({ key: s.key, value: s.value })),
      { onConflict: "key" }
    );
    settings = await getAllSettings();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Site Settings</h1>
      <p className="text-sm text-muted-foreground">
        Edit key-value pairs. Values must be valid JSON. Changes take effect immediately.
      </p>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {settings.map((s) => (
          <SettingRow key={s.key} setting={s} />
        ))}
      </div>
    </div>
  );
}

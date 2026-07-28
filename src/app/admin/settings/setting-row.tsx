"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

interface Setting {
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
}

export function SettingRow({ setting }: { setting: Setting }) {
  const router = useRouter();
  const [value, setValue] = useState(JSON.stringify(setting.value, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      setError("Invalid JSON value");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: setting.key, value: parsed }),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b?.error?.message ?? "Failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-sm font-mono">{setting.key}</p>
          <Textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              setSaved(false);
            }}
            className="mt-1.5 font-mono text-sm resize-none"
            rows={2}
          />
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
          {saved && (
            <p className="text-xs text-green-600 mt-1">Saved</p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={save}
          disabled={saving}
          className="shrink-0 gap-1.5 mt-6"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}

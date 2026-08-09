"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const FREQ_OPTIONS = [
  { value: "instant", label: "Instant" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
] as const;

interface EditPreferencesProps {
  searchId: string;
  initialFrequency: string;
  initialEmailAlerts: boolean;
}

export function EditPreferences({
  searchId,
  initialFrequency,
  initialEmailAlerts,
}: EditPreferencesProps) {
  const [frequency, setFrequency] = useState(initialFrequency);
  const [emailAlerts, setEmailAlerts] = useState(initialEmailAlerts);
  const [saving, setSaving] = useState(false);

  async function update(patch: { frequency?: string; email_alerts?: boolean }) {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/me/saved-searches/${searchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        if (patch.frequency) setFrequency(patch.frequency);
        if (patch.email_alerts !== undefined) setEmailAlerts(patch.email_alerts);
        toast.success("Preferences updated");
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {FREQ_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            if (opt.value !== frequency) update({ frequency: opt.value });
          }}
          disabled={saving}
          className="focus:outline-none"
        >
          <Badge
            variant={frequency === opt.value ? "default" : "outline"}
            className="text-[10px] cursor-pointer hover:border-primary/60 transition-colors"
          >
            {opt.label}
          </Badge>
        </button>
      ))}

      <button
        type="button"
        onClick={() => update({ email_alerts: !emailAlerts })}
        disabled={saving}
        className="focus:outline-none"
      >
        <Badge
          variant="outline"
          className={`text-[10px] cursor-pointer gap-1 transition-colors ${
            emailAlerts
              ? "border-primary/40 text-primary hover:border-destructive hover:text-destructive"
              : "text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          {emailAlerts ? <Bell className="h-2.5 w-2.5" /> : <BellOff className="h-2.5 w-2.5" />}
          {emailAlerts ? "Email on" : "Email off"}
        </Badge>
      </button>

      {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  );
}

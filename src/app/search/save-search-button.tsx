"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SaveSearchButtonProps {
  /** Full current search URL (to extract & store filters) */
  searchUrl: string;
  /** Serialised filter summary for the default name e.g. "2 BHK · Mathura · Rent" */
  filterSummary: string;
  /** Whether the user is authenticated */
  isLoggedIn: boolean;
  /** Purpose string if present in current search */
  purpose?: string;
  /** Serialised current filters for DB storage */
  filters: Record<string, unknown>;
}

export function SaveSearchButton({
  searchUrl,
  filterSummary,
  isLoggedIn,
  purpose,
  filters,
}: SaveSearchButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(filterSummary || "My search alert");
  const [frequency, setFrequency] = useState("instant");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

  function handleClick() {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=${encodeURIComponent(searchUrl)}`);
      return;
    }
    setName(filterSummary || "My search alert");
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/me/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || filterSummary || "My search alert",
          purpose: purpose ?? undefined,
          filters,
          frequency,
          email_alerts: emailAlerts,
        }),
      });

      if (res.ok) {
        toast.success("Search saved! You'll be alerted when new listings match.");
        setOpen(false);
      } else {
        const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
        toast.error(data?.error?.message ?? "Failed to save search");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleClick} className="gap-2 shrink-0">
        <Bell className="h-3.5 w-3.5" />
        Save search
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save this search</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="alert-name" className="text-sm">Alert name</Label>
              <Input
                id="alert-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 2 BHK in Vrindavan"
                className="mt-1"
                maxLength={60}
              />
            </div>

            <div>
              <Label className="text-sm">Alert frequency</Label>
              <Select value={frequency} onValueChange={(v) => { if (v != null) setFrequency(v); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant (as soon as listed)</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="off">Off (save only, no alerts)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={emailAlerts}
              onClick={() => setEmailAlerts((v) => !v)}
              className="flex items-center gap-3 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
            >
              <span
                aria-hidden="true"
                className={`relative w-10 h-5 rounded-full transition-colors ${emailAlerts ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${emailAlerts ? "translate-x-5" : "translate-x-0"}`} />
              </span>
              <span className="text-sm">
                {emailAlerts ? (
                  <span className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> Email alerts on</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground"><BellOff className="h-3.5 w-3.5" /> Email alerts off</span>
                )}
              </span>
            </button>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save alert"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

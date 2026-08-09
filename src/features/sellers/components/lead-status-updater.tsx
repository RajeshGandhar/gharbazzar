"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "visit_scheduled", label: "Visit Scheduled" },
  { value: "negotiating", label: "Negotiating" },
  { value: "closed_won", label: "Closed — Won" },
  { value: "closed_lost", label: "Closed — Lost" },
] as const;

const PIPELINE_STEPS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "visit_scheduled", label: "Visit" },
  { value: "negotiating", label: "Negotiating" },
  { value: "closed_won", label: "Won" },
];

interface LeadStatusUpdaterProps {
  inquiryId: string;
  currentStatus: string;
  currentNotes: string | null;
}

export function LeadStatusUpdater({ inquiryId, currentStatus, currentNotes }: LeadStatusUpdaterProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeIdx = PIPELINE_STEPS.findIndex((s) => s.value === status);

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/v1/leads/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notes.trim() || undefined }),
      });

      if (res.ok) {
        setSaved(true);
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
      setError(data?.error?.message ?? "Failed to update. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Pipeline step indicator */}
      <div>
        <Label className="text-xs text-muted-foreground">Pipeline stage</Label>
        <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1">
          {PIPELINE_STEPS.map((step, idx) => {
            const isActive = idx === activeIdx;
            const isDone = idx < activeIdx;
            const isClosed = status === "closed_lost";
            return (
              <div key={step.value} className="flex items-center gap-1 shrink-0">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isClosed
                      ? "bg-muted-foreground/30"
                      : isDone
                      ? "bg-primary"
                      : isActive
                      ? "bg-primary ring-2 ring-primary/30"
                      : "bg-muted-foreground/30"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px]",
                    isActive ? "font-semibold text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className={cn("h-px w-4", isDone ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
          {status === "closed_lost" && (
            <div className="flex items-center gap-1 shrink-0">
              <div className="h-px w-4 bg-border" />
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground">Lost</span>
            </div>
          )}
        </div>
      </div>

      {/* Status select */}
      <div>
        <Label htmlFor="status">Update status</Label>
        <Select value={status} onValueChange={(v) => { if (v != null) setStatus(v); }}>
          <SelectTrigger id="status" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Private notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this lead — only you can see these..."
          rows={4}
          className="mt-1 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {saved && (
        <p className="text-sm text-green-400 bg-green-900/30 rounded-lg px-3 py-2">
          Saved successfully.
        </p>
      )}

      <Button onClick={handleSave} disabled={loading} className="w-full gap-2">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save changes
          </>
        )}
      </Button>
    </div>
  );
}

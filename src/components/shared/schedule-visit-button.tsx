"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

interface ScheduleVisitButtonProps {
  propertyId: string;
  propertySlug: string;
}

// datetime-local needs "YYYY-MM-DDTHH:mm" in local time, no timezone suffix.
function minDatetimeLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000); // at least 1hr lead time
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleVisitButton({ propertyId, propertySlug }: ScheduleVisitButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setRequested(false);
      setDateTime("");
      setNotes("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateTime) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/auth/login?next=/property/${propertySlug}`);
        return;
      }

      const res = await fetch(`/api/v1/properties/${propertyId}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduled_at: new Date(dateTime).toISOString(),
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: { message?: string } }).error?.message ??
            "Could not schedule visit"
        );
      }

      setRequested(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not schedule visit. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
        <CalendarClock className="h-4 w-4" />
        Schedule a visit
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule a visit</DialogTitle>
        </DialogHeader>

        {requested ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <CalendarClock className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Visit requested</p>
            <p className="text-xs text-muted-foreground">
              The owner will confirm your slot. Track it under{" "}
              <a href="/account/visits" className="text-primary hover:underline">
                My Visits
              </a>
              .
            </p>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="visit-datetime">Preferred date &amp; time</Label>
              <Input
                id="visit-datetime"
                type="datetime-local"
                required
                min={minDatetimeLocal()}
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="visit-notes">Notes (optional)</Label>
              <Textarea
                id="visit-notes"
                placeholder="Anything the owner should know — e.g. who's coming along"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={loading || !dateTime} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting…
                </>
              ) : (
                "Request visit"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

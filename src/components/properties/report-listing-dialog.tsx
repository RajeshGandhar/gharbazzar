"use client";

import { useState } from "react";
import { Flag, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const REASONS = [
  "Inaccurate information",
  "Property no longer available",
  "Suspected scam or fraud",
  "Duplicate listing",
  "Discriminatory or prejudiced content",
  "Offensive content",
  "Other",
] as const;

interface ReportListingDialogProps {
  propertyId: string;
}

export function ReportListingDialog({ propertyId }: ReportListingDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleReport(reason: string) {
    setSubmitting(reason);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("property_reports").insert({
        property_id: propertyId,
        reporter_id: user?.id ?? null,
        reason,
      });

      if (error) {
        toast.error("Failed to submit report. Please try again.");
        return;
      }

      setSubmitted(true);
      toast.success("Report submitted. We'll review this listing.");
      setTimeout(() => setOpen(false), 1500);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSubmitted(false);
      }}
    >
      <DialogTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-smooth">
        <Flag className="h-3.5 w-3.5" />
        Report this listing
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Report listing</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <p className="text-sm text-muted-foreground">
              Thanks for helping keep GharBazaar safe. We&apos;ll review this listing.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground mb-1">
              Why are you reporting this listing?
            </p>
            {REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => handleReport(reason)}
                disabled={submitting !== null}
                className="flex items-center justify-between text-left rounded-lg border border-border px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-accent transition-smooth disabled:opacity-50"
              >
                {reason}
                {submitting === reason && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, X, Loader2 } from "lucide-react";

interface RejectionReason {
  code: string;
  label: string;
  hint: string;
}

interface Props {
  propertyId: string;
  rejectionReasons: readonly RejectionReason[];
}

export function ApprovalDecisionPanel({ propertyId, rejectionReasons }: Props) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reasonCode, setReasonCode] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setApproving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/admin/properties/${propertyId}/approve`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error?.message ?? "Approval failed");
      }
      router.push("/admin/approvals");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed");
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!reasonCode) return;
    setRejecting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/admin/properties/${propertyId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason_code: reasonCode,
            internal_notes: internalNotes || undefined,
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error?.message ?? "Rejection failed");
      }
      router.push("/admin/approvals");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rejection failed");
      setRejecting(false);
    }
  }

  const selectedReason = rejectionReasons.find((r) => r.code === reasonCode);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Decision
      </p>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        onClick={handleApprove}
        disabled={approving || rejecting}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {approving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Check className="h-4 w-4 mr-2" />
        )}
        Approve listing
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            disabled={approving || rejecting}
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            Reject listing
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Reason code</Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  {rejectionReasons.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedReason && (
                <p className="text-xs text-muted-foreground">
                  Seller will see: &ldquo;{selectedReason.hint}&rdquo;
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Internal notes (optional)</Label>
              <Textarea
                placeholder="Add context for the team…"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRejectOpen(false)}
                disabled={rejecting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!reasonCode || rejecting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {rejecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Confirm reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

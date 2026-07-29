"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  docId: string;
  sellerId: string;
}

export function KycDecisionPanel({ docId }: Props) {
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/kyc/${docId}/verify`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error?.message ?? "Verification failed");
      }
      router.push("/admin/kyc");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setVerifying(false);
    }
  }

  async function handleReject() {
    if (!remarks.trim()) return;
    setRejecting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/kyc/${docId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error?.message ?? "Rejection failed");
      }
      router.push("/admin/kyc");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rejection failed");
      setRejecting(false);
    }
  }

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
        onClick={handleVerify}
        disabled={verifying || rejecting}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {verifying ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Check className="h-4 w-4 mr-2" />
        )}
        Verify KYC
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger
          disabled={verifying || rejecting}
          className="w-full inline-flex items-center justify-center rounded-md border border-red-200 bg-background px-4 py-2 text-sm font-medium text-red-600 shadow-xs hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="h-4 w-4 mr-2" />
          Reject document
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Rejection remarks (required)</Label>
              <Textarea
                placeholder="Explain why this document was rejected…"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
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
                disabled={!remarks.trim() || rejecting}
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

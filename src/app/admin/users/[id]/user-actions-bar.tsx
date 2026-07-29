"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle, UserX, UserCheck } from "lucide-react";

interface Props {
  userId: string;
  isActive: boolean;
  strikeCount: number;
}

export function UserActionsBar({ userId, isActive, strikeCount }: Props) {
  const router = useRouter();
  const [strikeOpen, setStrikeOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState("");
  const [details, setDetails] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStrike() {
    if (!reasonCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/strike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason_code: reasonCode,
          details: details || undefined,
          expires_at: expiresAt || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error?.message ?? "Failed to issue strike");
      }
      setStrikeOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/toggle-active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error?.message ?? "Failed");
      }
      setDeactivateOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Issue strike */}
      <Dialog open={strikeOpen} onOpenChange={setStrikeOpen}>
        <DialogTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          Issue strike ({strikeCount})
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue strike</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Reason code</Label>
              <Select value={reasonCode} onValueChange={(v) => { if (v != null) setReasonCode(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPAM">Spam</SelectItem>
                  <SelectItem value="FAKE_LISTING">Fake listing</SelectItem>
                  <SelectItem value="ABUSIVE_BEHAVIOR">
                    Abusive behavior
                  </SelectItem>
                  <SelectItem value="FRAUD">Fraud</SelectItem>
                  <SelectItem value="CONTENT_POLICY">
                    Content policy violation
                  </SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Details (optional)</Label>
              <Textarea
                placeholder="Describe the violation…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Expires at (optional)</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
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
                onClick={() => setStrikeOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStrike}
                disabled={!reasonCode || loading}
                className="flex-1"
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Issue strike
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate / Activate */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogTrigger className={`inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-xs hover:bg-accent gap-1.5 ${!isActive ? "text-green-700" : "text-red-700 border-red-200"}`}>
          {isActive ? (
            <>
              <UserX className="h-3.5 w-3.5" />
              Deactivate
            </>
          ) : (
            <>
              <UserCheck className="h-3.5 w-3.5" />
              Activate
            </>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isActive ? "Deactivate account?" : "Activate account?"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {isActive
                ? "This will prevent the user from logging in and hide their listings."
                : "This will restore the user's access."}
            </p>
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeactivateOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleToggleActive}
                disabled={loading}
                className={`flex-1 ${isActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

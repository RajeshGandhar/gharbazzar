"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [resolving, setResolving] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  async function act(action: "resolve" | "dismiss") {
    if (action === "resolve") setResolving(true);
    else setDismissing(true);

    try {
      const res = await fetch(`/api/v1/admin/reports/${reportId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        toast.error(`Failed to ${action} report. Please try again.`);
        return;
      }
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setResolving(false);
      setDismissing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => act("resolve")}
        disabled={resolving || dismissing}
        className="gap-1 text-green-700 border-green-200 hover:bg-green-50"
      >
        {resolving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        Resolve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => act("dismiss")}
        disabled={resolving || dismissing}
        className="gap-1 text-muted-foreground"
      >
        {dismissing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
        Dismiss
      </Button>
    </div>
  );
}

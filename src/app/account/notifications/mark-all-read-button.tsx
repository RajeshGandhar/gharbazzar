"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleMarkAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/me/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        toast.success("All notifications marked as read");
        router.refresh();
      } else {
        toast.error("Failed to update notifications");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <CheckCheck className="size-4 mr-1.5" />}
      Mark all read
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

const STAGE_ORDER = ["identified", "visited", "onboarded", "active"] as const;

interface Prospect {
  id: string;
  prospect_name: string;
  prospect_phone: string;
  seller_type: string;
  city_id: number | null;
  locality_note: string | null;
  stage: string;
  notes: string | null;
  next_action_at: string | null;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  cities?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

function maskPhone(phone: string): string {
  return `****${phone.slice(-4)}`;
}

function formatNextAction(nextAt: string | null): string | null {
  if (!nextAt) return null;
  const d = new Date(nextAt);
  const diffMs = d.getTime() - Date.now();
  if (diffMs < 0) return "overdue";
  const h = Math.floor(diffMs / 3_600_000);
  if (h < 24) return `in ${h}h`;
  return `in ${Math.floor(h / 24)}d`;
}

export function ProspectCard({
  prospect,
  currentStage,
}: {
  prospect: Prospect;
  currentStage: string;
}) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);

  const stageIdx = STAGE_ORDER.indexOf(currentStage as typeof STAGE_ORDER[number]);
  const nextStage = stageIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[stageIdx + 1] : null;

  const city = prospect.cities as { name: string } | null;
  const assignee = prospect.profiles as { full_name: string } | null;
  const nextAction = formatNextAction(prospect.next_action_at);

  async function advance() {
    if (!nextStage) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/v1/admin/field-crm/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      if (!res.ok) {
        toast.error("Failed to advance stage. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm leading-tight">{prospect.prospect_name}</p>
        <Badge variant="secondary" className="text-xs capitalize shrink-0">
          {prospect.seller_type.replace("_", " ")}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground font-mono">
        {maskPhone(prospect.prospect_phone)}
      </p>

      {city && (
        <p className="text-xs text-muted-foreground">{city.name}</p>
      )}

      {prospect.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {prospect.notes}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-col gap-0.5">
          {nextAction && (
            <span
              className={`text-xs ${nextAction === "overdue" ? "text-red-600 font-medium" : "text-muted-foreground"}`}
            >
              Next: {nextAction}
            </span>
          )}
          {assignee && (
            <span className="text-xs text-muted-foreground">
              {assignee.full_name}
            </span>
          )}
        </div>

        {nextStage && (
          <Button
            size="sm"
            variant="outline"
            onClick={advance}
            disabled={advancing}
            className="h-7 px-2 text-xs gap-1"
          >
            {advancing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ArrowRight className="h-3 w-3" />
            )}
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

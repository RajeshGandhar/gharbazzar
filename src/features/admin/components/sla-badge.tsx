import { Badge } from "@/components/ui/badge";

interface SlaBadgeProps {
  createdAt: string;
  slaDurationMs: number;
}

function getSlaStatus(
  createdAt: string,
  slaDurationMs: number
): "ok" | "warning" | "breached" {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (ageMs > slaDurationMs) return "breached";
  if (ageMs > slaDurationMs * 0.75) return "warning";
  return "ok";
}

function formatAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function SlaBadge({ createdAt, slaDurationMs }: SlaBadgeProps) {
  const status = getSlaStatus(createdAt, slaDurationMs);
  const age = formatAge(createdAt);

  const variantMap: Record<
    "ok" | "warning" | "breached",
    { label: string; className: string }
  > = {
    ok: {
      label: age,
      className:
        "bg-green-50 text-green-700 border-green-200 hover:bg-green-50",
    },
    warning: {
      label: age,
      className:
        "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
    },
    breached: {
      label: `${age} — BREACHED`,
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
    },
  };

  const { label, className } = variantMap[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

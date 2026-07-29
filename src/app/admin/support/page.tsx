export const revalidate = 0;

import Link from "next/link";
import { listSupportTickets } from "@/features/admin/server/queries";
import { SlaBadge } from "@/features/admin/components/sla-badge";
import { formatFreshness } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const SLA_2H = 7_200_000;

const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
const priorityColor: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  normal: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-gray-100 text-gray-600",
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "all";

  const tickets = await listSupportTickets(status === "all" ? undefined : status);

  const sorted = [...tickets].sort((a, b) => {
    const pd =
      (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 99) -
      (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 99);
    if (pd !== 0) return pd;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const statusTabs = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "pending_user", label: "Pending user" },
    { key: "resolved", label: "Resolved" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">
        Support Tickets
        <span className="ml-2 text-base font-normal text-muted-foreground">
          · {sorted.length}
        </span>
      </h1>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((t) => (
          <Link key={t.key} href={`?status=${t.key}`}>
            <Button
              size="sm"
              variant={status === t.key ? "default" : "outline"}
              className="h-7 text-xs"
            >
              {t.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No tickets
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Priority</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Subject</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Channel</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Requester</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Status</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">SLA</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => {
                const requester = t.profiles as unknown as {
                  full_name: string;
                  email: string | null;
                } | null;
                const needsFirstResponse = !t.first_response_at;

                return (
                  <tr key={t.id} className="hover:bg-accent">
                    <td className="px-3 py-3 border-t border-border">
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${priorityColor[t.priority] ?? ""}`}
                      >
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 border-t border-border max-w-[200px]">
                      <p className="font-medium line-clamp-1">{t.subject}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        #{t.id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground capitalize">
                      {t.channel}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <p>{requester?.full_name ?? t.contact_name ?? "—"}</p>
                      {requester?.email && (
                        <p className="text-xs text-muted-foreground">
                          {requester.email}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <Badge variant="outline" className="text-xs capitalize">
                        {t.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      {needsFirstResponse && (
                        <SlaBadge
                          createdAt={t.created_at}
                          slaDurationMs={SLA_2H}
                        />
                      )}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <Link href={`/admin/support/${t.id}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

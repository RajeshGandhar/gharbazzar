export const revalidate = 0;

import { listOpenReports } from "@/features/admin/server/queries";
import { SlaBadge } from "@/features/admin/components/sla-badge";
import { formatFreshness } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ReportActions } from "./report-actions";

const SLA_2H = 7_200_000;
const SLA_24H = 86_400_000;

function isSevere(reason: string) {
  return /fraud|scam/i.test(reason);
}

export default async function ReportsPage() {
  const reports = await listOpenReports();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">
        Reports Queue
        <span className="ml-2 text-base font-normal text-muted-foreground">
          · {reports.length} open
        </span>
      </h1>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
          <p className="font-medium">No open reports</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Severity
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Property
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Reason
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Submitted
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  SLA
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const severe = isSevere(report.reason);
                const property = report.properties as unknown as {
                  id: string;
                  title: string;
                  slug: string;
                  status: string;
                } | null;

                return (
                  <tr key={report.id} className="hover:bg-accent">
                    <td className="px-3 py-3 border-t border-border">
                      {severe ? (
                        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                          Urgent
                        </Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      {property ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium line-clamp-1 max-w-[160px]">
                            {property.title}
                          </span>
                          <Link
                            href={`/property/${property.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {report.property_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground max-w-[200px] truncate">
                      {report.reason}
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground whitespace-nowrap">
                      {formatFreshness(report.created_at)}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <SlaBadge
                        createdAt={report.created_at}
                        slaDurationMs={severe ? SLA_2H : SLA_24H}
                      />
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <ReportActions reportId={report.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

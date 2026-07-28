export const revalidate = 0;

import Link from "next/link";
import { listPendingApprovals } from "@/features/admin/server/queries";
import { SlaBadge } from "@/features/admin/components/sla-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

const SLA_4H = 14_400_000;

export default async function ApprovalsPage() {
  const approvals = await listPendingApprovals(50);

  const breached = approvals.filter(
    (p) => Date.now() - new Date(p.created_at).getTime() > SLA_4H
  );

  const purposeLabel: Record<string, string> = {
    sale: "Sale",
    rent: "Rent",
    lease: "Lease",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Approval Queue
          <span className="ml-2 text-base font-normal text-muted-foreground">
            · {approvals.length} pending
          </span>
        </h1>
      </div>

      {breached.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{breached.length}</strong>{" "}
            {breached.length === 1 ? "listing has" : "listings have"} breached
            the 4-hour SLA
          </span>
        </div>
      )}

      {approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
          <p className="font-medium">Queue is clear — all caught up!</p>
          <p className="text-sm text-muted-foreground mt-1">
            No listings pending approval.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Listing
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Purpose
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Seller
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  City
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  SLA
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((p) => {
                const seller = p.sellers as {
                  business_name: string | null;
                  seller_type: string;
                  profiles: { full_name: string; email: string | null } | null;
                } | null;
                const city = p.cities as { name: string } | null;
                const sellerName =
                  seller?.business_name ??
                  seller?.profiles?.full_name ??
                  "Unknown";

                return (
                  <tr key={p.id} className="hover:bg-accent cursor-pointer">
                    <td className="px-3 py-3 border-t border-border">
                      <span className="font-medium line-clamp-1 max-w-[200px]">
                        {p.title}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <Badge variant="outline" className="text-xs">
                        {purposeLabel[p.purpose] ?? p.purpose}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <div>
                        <p className="font-medium">{sellerName}</p>
                        {seller?.seller_type && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {seller.seller_type.replace("_", " ")}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground">
                      {city?.name ?? "—"}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <SlaBadge
                        createdAt={p.created_at}
                        slaDurationMs={SLA_4H}
                      />
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <Link href={`/admin/approvals/${p.id}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          Review
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
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

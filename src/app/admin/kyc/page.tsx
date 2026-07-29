export const revalidate = 0;

import Link from "next/link";
import { listPendingKyc } from "@/features/admin/server/queries";
import { SlaBadge } from "@/features/admin/components/sla-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const SLA_24H = 86_400_000;

export default async function KycPage() {
  const docs = await listPendingKyc();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">
        KYC Queue
        <span className="ml-2 text-base font-normal text-muted-foreground">
          · {docs.length} pending
        </span>
      </h1>

      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
          <p className="font-medium">All KYC documents reviewed</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Seller
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Type
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Document
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
              {docs.map((doc) => {
                const seller = doc.sellers as unknown as {
                  id: string;
                  business_name: string | null;
                  seller_type: string;
                  profiles: { full_name: string; email: string | null } | null;
                } | null;

                const sellerName =
                  seller?.business_name ??
                  seller?.profiles?.full_name ??
                  "Unknown";

                return (
                  <tr key={doc.id} className="hover:bg-accent">
                    <td className="px-3 py-3 border-t border-border">
                      <p className="font-medium">{sellerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {seller?.profiles?.email ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {seller?.seller_type?.replace("_", " ") ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground">
                      {doc.doc_type}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <SlaBadge
                        createdAt={doc.created_at}
                        slaDurationMs={SLA_24H}
                      />
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <Link href={`/admin/kyc/${doc.id}`}>
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

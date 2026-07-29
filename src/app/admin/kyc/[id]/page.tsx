export const revalidate = 0;

import { notFound } from "next/navigation";
import Link from "next/link";
import { getKycDocument } from "@/features/admin/server/queries";
import { SlaBadge } from "@/features/admin/components/sla-badge";
import { formatFreshness } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { KycDecisionPanel } from "./kyc-decision-panel";

const SLA_24H = 86_400_000;

export default async function KycDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getKycDocument(id);
  if (!result) notFound();

  const { doc, all_docs } = result;

  const seller = doc.sellers as unknown as {
    id: string;
    business_name: string | null;
    seller_type: string;
    kyc_status: string;
    is_verified: boolean;
    verified_at: string | null;
    profiles: {
      full_name: string;
      email: string | null;
      avatar_url: string | null;
    } | null;
  } | null;

  const sellerName =
    seller?.business_name ?? seller?.profiles?.full_name ?? "Unknown";

  const statusColor: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-5">
      <Link
        href="/admin/kyc"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        KYC Queue
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: Seller info + docs */}
        <div className="space-y-5">
          {/* Seller summary */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{sellerName}</h2>
              <p className="text-sm text-muted-foreground">
                {seller?.profiles?.email ?? "—"} ·{" "}
                <span className="capitalize">
                  {seller?.seller_type?.replace("_", " ")}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <div>
                KYC Status:{" "}
                <Badge variant="outline" className="capitalize">
                  {seller?.kyc_status ?? "—"}
                </Badge>
              </div>
              <div>
                Verified:{" "}
                <Badge
                  variant="outline"
                  className={seller?.is_verified ? "text-green-700" : ""}
                >
                  {seller?.is_verified ? "Yes" : "No"}
                </Badge>
              </div>
              {seller?.verified_at && (
                <div className="text-muted-foreground text-xs">
                  Verified {formatFreshness(seller.verified_at)}
                </div>
              )}
            </div>
          </div>

          {/* Current document */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Current document</h3>
              <SlaBadge createdAt={doc.created_at} slaDurationMs={SLA_24H} />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{doc.doc_type}</dd>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd>{formatFreshness(doc.created_at)}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge
                  variant="outline"
                  className={statusColor[doc.status] ?? ""}
                >
                  {doc.status}
                </Badge>
              </dd>
              <dt className="text-muted-foreground">File</dt>
              <dd>
                <a
                  href={doc.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline text-xs break-all"
                >
                  View / Download
                </a>
              </dd>
            </dl>
            {doc.remarks && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Remarks
                </p>
                <p className="text-sm">{doc.remarks}</p>
              </div>
            )}
          </div>

          {/* All docs for this seller */}
          {all_docs.length > 1 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">
                  All documents from this seller
                </h3>
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Type
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Status
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {all_docs.map((d) => (
                    <tr key={d.id} className="hover:bg-accent">
                      <td className="px-3 py-3 border-t border-border">
                        {d.doc_type}
                      </td>
                      <td className="px-3 py-3 border-t border-border">
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusColor[d.status] ?? ""}`}
                        >
                          {d.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 border-t border-border text-muted-foreground">
                        {formatFreshness(d.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Decision */}
        <div>
          <div className="sticky top-6">
            <KycDecisionPanel docId={doc.id} sellerId={doc.seller_id} />
          </div>
        </div>
      </div>
    </div>
  );
}

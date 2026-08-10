import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSellerKycDocs } from "@/features/sellers/server/dealer-queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KycUploader } from "@/features/sellers/components/kyc-uploader";
import { CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";
import { formatFreshness } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const DOC_TYPE_LABELS: Record<string, string> = {
  pan_card: "PAN Card",
  voter_id: "Voter ID",
  passport: "Passport",
  driving_license: "Driving License",
  gst_certificate: "GST Certificate",
  shop_act: "Shop & Establishment Act",
  rera_certificate: "RERA Registration",
  address_proof: "Address Proof",
};

const kycStatusConfig = {
  not_submitted: {
    title: "KYC not submitted",
    description:
      "Submit your identity documents to get the Verified badge. Verified sellers get 3x more seeker trust.",
    icon: AlertCircle,
    iconClass: "text-muted-foreground",
    bannerClass: "bg-muted border-border",
  },
  submitted: {
    title: "Under review",
    description: "Your documents are being reviewed. This usually takes less than 24 hours.",
    icon: Clock,
    iconClass: "text-amber-400",
    bannerClass: "bg-amber-950/30 border-amber-800",
  },
  verified: {
    title: "Verified",
    description: "Your KYC is approved. The Verified badge is now live on your listings.",
    icon: CheckCircle2,
    iconClass: "text-green-400",
    bannerClass: "bg-green-950/30 border-green-800",
  },
  rejected: {
    title: "Documents rejected",
    description: "Please review the remarks below and resubmit the correct documents.",
    icon: AlertCircle,
    iconClass: "text-destructive",
    bannerClass: "bg-red-950/30 border-red-800",
  },
};

const docStatusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Under Review",
    className: "bg-amber-900/30 text-amber-400",
  },
  approved: {
    label: "Approved",
    className: "bg-green-900/30 text-green-400",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-900/30 text-red-400",
  },
};

export default async function KycPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dealer/kyc");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, kyc_status")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/dealer/onboard");

  const { data: kycDocs } = await getSellerKycDocs(seller.id);

  const kycStatus = (seller.kyc_status ?? "not_submitted") as keyof typeof kycStatusConfig;
  const statusCfg = kycStatusConfig[kycStatus] ?? kycStatusConfig.not_submitted;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">KYC Verification</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Verify your identity to build trust with seekers.
        </p>
      </div>

      {/* Status banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border p-4",
          statusCfg.bannerClass
        )}
      >
        <StatusIcon className={cn("h-5 w-5 shrink-0 mt-0.5", statusCfg.iconClass)} />
        <div>
          <p className="text-sm font-semibold">{statusCfg.title}</p>
          <p className="text-xs mt-0.5 text-muted-foreground">{statusCfg.description}</p>
        </div>
      </div>

      {/* Submitted documents */}
      {kycDocs && kycDocs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Submitted documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {kycDocs.map((doc, idx) => {
              const d = doc as {
                id: string;
                doc_type: string;
                file_path: string;
                status: string;
                remarks: string | null;
                created_at: string;
              };
              const statusCfgDoc = docStatusConfig[d.status] ?? docStatusConfig.pending;

              return (
                <div key={d.id}>
                  {idx > 0 && <Separator />}
                  <div className="flex items-start gap-3 py-3">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          {DOC_TYPE_LABELS[d.doc_type] ?? d.doc_type.replace(/_/g, " ")}
                        </p>
                        <Badge className={cn("text-[10px]", statusCfgDoc.className)}>
                          {statusCfgDoc.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Submitted {formatFreshness(d.created_at)}
                      </p>
                      {d.remarks && d.status === "rejected" && (
                        <p className="text-xs text-destructive mt-1">
                          Reason: {d.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Upload new document */}
      {kycStatus !== "verified" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {kycDocs && kycDocs.length > 0 ? "Upload another document" : "Upload document"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KycUploader sellerId={seller.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

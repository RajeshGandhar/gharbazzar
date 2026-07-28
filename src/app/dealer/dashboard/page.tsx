import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getDealerDashboardData } from "@/features/sellers/server/dealer-queries";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  MessageSquare,
  Eye,
  Phone,
  FileEdit,
  Plus,
  CheckCircle2,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatPrice, formatFreshness } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const revalidate = 60;

const statusConfig: Record<string, { label: string; className: string }> = {
  active_approved: {
    label: "Live",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  pending: {
    label: "In Review",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  expired: {
    label: "Expired",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

function getListingStatusKey(
  status: string,
  approvalStatus: string
): string {
  if (approvalStatus === "pending") return "pending";
  if (approvalStatus === "rejected") return "rejected";
  if (status === "draft") return "draft";
  if (status === "active" && approvalStatus === "approved") return "active_approved";
  if (status === "expired") return "expired";
  return "draft";
}

const sourceLabels: Record<string, string> = {
  form: "Form",
  whatsapp: "WhatsApp",
  call: "Call",
  chat: "Chat",
};

const leadStatusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/10 text-primary" },
  contacted: { label: "Contacted", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  visit_scheduled: { label: "Visit Scheduled", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  negotiating: { label: "Negotiating", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  closed_won: { label: "Won", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  closed_lost: { label: "Lost", className: "bg-muted text-muted-foreground" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dealer/dashboard");

  const [profileResult, sellerResult] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
    supabase
      .from("sellers")
      .select("id, slug, seller_type, kyc_status, is_verified, whatsapp_number")
      .eq("id", user.id)
      .single(),
  ]);

  const profile = profileResult.data;
  const seller = sellerResult.data;

  if (!seller) redirect("/dealer/onboard");

  const dashData = await getDealerDashboardData(seller.id);

  const isNewSeller =
    dashData.listing_counts.total < 2 && !seller.is_verified;

  const onboardingChecks = [
    {
      label: "WhatsApp number set",
      done: !!seller.whatsapp_number,
    },
    {
      label: "First listing published",
      done: dashData.listing_counts.active > 0,
    },
    {
      label: "KYC submitted",
      done: seller.kyc_status !== "not_submitted",
    },
  ];

  const allDone = onboardingChecks.every((c) => c.done);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"}!
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {seller.seller_type && (
              <Badge variant="outline" className="capitalize">
                {seller.seller_type.replace("_", " ")}
              </Badge>
            )}
            {seller.is_verified && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
        </div>
        <Link href="/dealer/listings/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Add listing
        </Link>
      </div>

      {/* Onboarding checklist — shown for new sellers */}
      {isNewSeller && !allDone && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Get started — complete your setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {onboardingChecks.map(({ label, done }) => (
              <div key={label} className="flex items-center gap-3">
                {done ? (
                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={cn("text-sm", done && "line-through text-muted-foreground")}>
                  {label}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Active listings",
            value: dashData.listing_counts.active,
            icon: Building2,
            href: "/dealer/listings?status=active",
          },
          {
            label: "Draft listings",
            value: dashData.listing_counts.draft,
            icon: FileEdit,
            href: "/dealer/listings?status=draft",
          },
          {
            label: "New leads",
            value: dashData.new_leads_count,
            icon: MessageSquare,
            href: "/dealer/leads?status=new",
          },
          {
            label: "Views (30d)",
            value: dashData.event_stats.views,
            icon: Eye,
            href: "/dealer/listings",
          },
          {
            label: "Reveals (30d)",
            value: dashData.event_stats.reveals,
            icon: Phone,
            href: "/dealer/listings",
          },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent leads</CardTitle>
            <Link href="/dealer/leads" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-0">
            {dashData.recent_leads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No leads yet. Your first inquiry will appear here.
              </p>
            ) : (
              dashData.recent_leads.map((lead, idx) => {
                const statusCfg = leadStatusConfig[lead.status] ?? leadStatusConfig.new;
                const maskedPhone = `****${lead.phone.slice(-4)}`;
                const prop = lead.properties;
                return (
                  <div key={lead.id}>
                    {idx > 0 && <Separator />}
                    <Link
                      href={`/dealer/leads/${lead.id}`}
                      className="flex items-center gap-3 py-3 hover:bg-muted/50 -mx-3 px-3 rounded-lg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {maskedPhone} · {prop?.title ?? "Unknown property"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatFreshness(lead.created_at)} · {sourceLabels[lead.source] ?? lead.source}
                        </p>
                      </div>
                      <Badge className={cn("text-[10px] shrink-0", statusCfg.className)}>
                        {statusCfg.label}
                      </Badge>
                    </Link>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent listings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">My listings</CardTitle>
            <Link href="/dealer/listings" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-0">
            {dashData.recent_listings.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  You have no listings yet.
                </p>
                <Link href="/dealer/listings/new" className={buttonVariants({ size: "sm" })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first listing
                </Link>
              </div>
            ) : (
              dashData.recent_listings.map((listing, idx) => {
                const l = listing as unknown as {
                  id: string;
                  slug: string;
                  title: string;
                  price: number;
                  purpose: string;
                  status: string;
                  approval_status: string;
                  created_at: string;
                  property_images: Array<{ path: string; is_cover: boolean }>;
                };
                const coverImage = l.property_images?.find((i) => i.is_cover) ?? l.property_images?.[0];
                const imageUrl = coverImage
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${coverImage.path}`
                  : null;
                const statusKey = getListingStatusKey(l.status, l.approval_status);
                const statusCfg = statusConfig[statusKey] ?? statusConfig.draft;

                return (
                  <div key={l.id}>
                    {idx > 0 && <Separator />}
                    <div className="flex items-center gap-3 py-3">
                      <div className="relative h-14 w-20 rounded-md overflow-hidden bg-muted shrink-0">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={l.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(l.price)}</p>
                        <Badge className={cn("text-[10px] mt-1", statusCfg.className)}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <Link href={`/dealer/listings/${l.id}/edit?step=1`} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "shrink-0")}>
                        Manage
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

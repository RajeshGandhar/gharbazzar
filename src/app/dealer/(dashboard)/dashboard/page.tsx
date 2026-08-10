import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getDealerDashboardData } from "@/features/sellers/server/dealer-queries";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
  Sparkles,
} from "lucide-react";
import { formatPrice, formatFreshness } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const revalidate = 60;

const statusConfig: Record<string, { label: string; dot: string; pill: string }> = {
  active_approved: {
    label: "Live",
    dot: "bg-emerald-500",
    pill: "bg-emerald-950/40 text-emerald-400",
  },
  pending: {
    label: "In Review",
    dot: "bg-amber-500",
    pill: "bg-amber-950/40 text-amber-400",
  },
  draft: {
    label: "Draft",
    dot: "bg-muted-foreground/40",
    pill: "bg-muted text-muted-foreground",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-red-500",
    pill: "bg-red-950/40 text-red-400",
  },
  expired: {
    label: "Expired",
    dot: "bg-orange-500",
    pill: "bg-orange-950/40 text-orange-400",
  },
};

function getListingStatusKey(status: string, approvalStatus: string): string {
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

const leadStatusConfig: Record<string, { label: string; pill: string }> = {
  new:              { label: "New",           pill: "bg-primary/10 text-primary" },
  contacted:        { label: "Contacted",     pill: "bg-blue-950/40 text-blue-400" },
  visit_scheduled:  { label: "Visit",         pill: "bg-purple-950/40 text-purple-400" },
  negotiating:      { label: "Negotiating",   pill: "bg-amber-950/40 text-amber-400" },
  closed_won:       { label: "Won",           pill: "bg-emerald-950/40 text-emerald-400" },
  closed_lost:      { label: "Lost",          pill: "bg-muted text-muted-foreground" },
};

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <div className={cn(
        "rounded-xl border bg-card p-5 shadow-card hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5",
        accent ? "border-primary/20 bg-primary/3" : "border-border"
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "rounded-xl p-2",
            accent ? "bg-primary/15" : "bg-muted"
          )}>
            <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} />
          </div>
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/50 transition-colors" />
        </div>
        <p className={cn("text-2xl font-bold tabular-nums", accent ? "text-primary" : "text-foreground")}>
          {value.toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  const isNewSeller = dashData.listing_counts.total < 2 && !seller.is_verified;
  const onboardingChecks = [
    { label: "WhatsApp number set",    done: !!seller.whatsapp_number },
    { label: "First listing published", done: dashData.listing_counts.active > 0 },
    { label: "KYC submitted",           done: seller.kyc_status !== "not_submitted" },
  ];
  const allDone = onboardingChecks.every((c) => c.done);
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, {firstName}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {seller.seller_type && (
              <Badge variant="outline" className="capitalize text-xs">
                {seller.seller_type.replace("_", " ")}
              </Badge>
            )}
            {seller.is_verified ? (
              <Badge className="gap-1 bg-emerald-950/40 text-emerald-400 border-0 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                Verified seller
              </Badge>
            ) : seller.kyc_status === "submitted" ? (
              <Badge className="gap-1 bg-amber-950/40 text-amber-400 border-0 text-xs">
                KYC under review
              </Badge>
            ) : (
              <Link href="/dealer/kyc" className="text-xs text-primary font-medium hover:underline">
                Submit KYC →
              </Link>
            )}
          </div>
        </div>
        <Link href="/dealer/listings/new" className={cn(buttonVariants(), "gap-2 shadow-sm")}>
          <Plus className="h-4 w-4" />
          Add listing
        </Link>
      </div>

      {/* ── Onboarding checklist — new sellers ── */}
      {isNewSeller && !allDone && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Complete your setup to start receiving leads</h2>
          </div>
          <div className="space-y-3">
            {onboardingChecks.map(({ label, done }) => (
              <div key={label} className="flex items-center gap-3">
                {done ? (
                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                )}
                <span className={cn("text-sm", done && "line-through text-muted-foreground")}>
                  {label}
                </span>
                {done && (
                  <span className="ml-auto text-xs text-emerald-400 font-medium">Done</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-primary/15">
            <div className="flex h-1.5 rounded-full bg-primary/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(onboardingChecks.filter((c) => c.done).length / onboardingChecks.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {onboardingChecks.filter((c) => c.done).length}/{onboardingChecks.length} steps completed
            </p>
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Active listings" value={dashData.listing_counts.active}    icon={Building2}    href="/dealer/listings?status=active" accent />
        <StatCard label="Draft listings"  value={dashData.listing_counts.draft}     icon={FileEdit}     href="/dealer/listings?status=draft" />
        <StatCard label="New leads"       value={dashData.new_leads_count}          icon={MessageSquare} href="/dealer/leads?status=new" accent={dashData.new_leads_count > 0} />
        <StatCard label="Views (30d)"     value={dashData.event_stats.views}        icon={Eye}          href="/dealer/listings" />
        <StatCard label="Reveals (30d)"   value={dashData.event_stats.reveals}      icon={Phone}        href="/dealer/listings" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Recent leads ── */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent leads</h2>
              {dashData.new_leads_count > 0 && (
                <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {dashData.new_leads_count}
                </span>
              )}
            </div>
            <Link href="/dealer/leads" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {dashData.recent_leads.length === 0 ? (
              <div className="py-10 text-center px-5">
                <div className="mx-auto w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No leads yet</p>
                <p className="text-xs text-muted-foreground">Your first inquiry will appear here.</p>
              </div>
            ) : (
              dashData.recent_leads.map((lead) => {
                const statusCfg = leadStatusConfig[lead.status] ?? leadStatusConfig.new;
                const maskedPhone = `****${lead.phone.slice(-4)}`;
                const prop = lead.properties;
                return (
                  <Link
                    key={lead.id}
                    href={`/dealer/leads/${lead.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {maskedPhone} · {prop?.title ?? "Unknown property"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatFreshness(lead.created_at)} · {sourceLabels[lead.source] ?? lead.source}
                      </p>
                    </div>
                    <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0", statusCfg.pill)}>
                      {statusCfg.label}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* ── Recent listings ── */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">My listings</h2>
            </div>
            <Link href="/dealer/listings" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {dashData.recent_listings.length === 0 ? (
              <div className="py-10 text-center px-5">
                <div className="mx-auto w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Building2 className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No listings yet</p>
                <p className="text-xs text-muted-foreground mb-4">Add your first property to start getting leads.</p>
                <Link href="/dealer/listings/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
                  <Plus className="h-3.5 w-3.5" />
                  Add listing
                </Link>
              </div>
            ) : (
              dashData.recent_listings.map((listing) => {
                const l = listing as unknown as {
                  id: string; slug: string; title: string; price: number;
                  purpose: string; status: string; approval_status: string;
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
                  <div key={l.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="relative h-14 w-20 rounded-xl overflow-hidden bg-muted shrink-0">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={l.title} fill sizes="80px" className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                      <p className="text-xs text-primary font-semibold mt-0.5">{formatPrice(l.price)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
                        <span className={cn("text-[10px] font-medium", statusCfg.pill.split(" ").slice(1).join(" "))}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/dealer/listings/${l.id}/edit?step=1`}
                      className={cn(buttonVariants({ size: "sm", variant: "outline" }), "shrink-0 text-xs")}
                    >
                      Manage
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listSellerLeads } from "@/features/leads/server/queries";
import { parsePagination } from "@/lib/api/pagination";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Download, MessageSquare } from "lucide-react";
import { formatFreshness } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "visit_scheduled", label: "Visit Scheduled" },
  { value: "negotiating", label: "Negotiating" },
  { value: "closed_won", label: "Won" },
  { value: "closed_lost", label: "Lost" },
] as const;

const leadStatusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/10 text-primary" },
  contacted: { label: "Contacted", className: "bg-blue-900/30 text-blue-400" },
  visit_scheduled: { label: "Visit Scheduled", className: "bg-purple-900/30 text-purple-400" },
  negotiating: { label: "Negotiating", className: "bg-amber-900/30 text-amber-400" },
  closed_won: { label: "Won", className: "bg-green-900/30 text-green-400" },
  closed_lost: { label: "Lost", className: "bg-muted text-muted-foreground" },
};

const sourceLabels: Record<string, string> = {
  form: "Form",
  whatsapp: "WhatsApp",
  call: "Call",
  chat: "Chat",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dealer/leads");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/dealer/onboard");

  const sp = await searchParams;
  const activeTab = sp.status ?? "all";
  const pagination = parsePagination(new URLSearchParams({ page: sp.page ?? "1", per_page: "20" }));

  const { data: leads, count } = await listSellerLeads(
    seller.id,
    pagination,
    activeTab === "all" ? undefined : activeTab
  );

  const totalPages = Math.ceil((count ?? 0) / pagination.perPage);

  // Count new leads for badge
  const { count: newCount } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", seller.id)
    .eq("status", "new");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {count ?? 0} total · {newCount ?? 0} new
          </p>
        </div>
        <a
          href="/api/v1/leads/export"
          download
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dealer/leads${tab.value === "all" ? "" : `?status=${tab.value}`}`}
            className={cn(
              "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.value === "new" && (newCount ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                {newCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Leads list */}
      {!leads || leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">No leads found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTab === "all"
              ? "Your leads will appear here when seekers inquire about your properties."
              : `No ${activeTab.replace("_", " ")} leads.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const l = lead as unknown as {
              id: string;
              name: string;
              phone: string;
              email: string | null;
              message: string | null;
              source: string;
              status: string;
              created_at: string;
              properties: { id: string; slug: string; title: string; cities?: { name: string } | null } | null;
              profiles: { full_name: string; avatar_url: string | null } | null;
            };

            const maskedPhone = `****${l.phone.slice(-4)}`;
            const statusCfg = leadStatusConfig[l.status] ?? leadStatusConfig.new;
            const prop = l.properties;

            return (
              <Link
                key={l.id}
                href={`/dealer/leads/${l.id}`}
                className="block rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="p-4 flex items-start gap-4">
                  {/* Lead info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{l.name}</p>
                      <Badge className={cn("text-[10px]", statusCfg.className)}>
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {maskedPhone}
                      {l.email && ` · ${l.email}`}
                    </p>
                    {prop && (
                      <p className="text-xs text-muted-foreground truncate">
                        Re: {prop.title}
                        {prop.cities?.name ? ` · ${prop.cities.name}` : ""}
                      </p>
                    )}
                    {l.message && (
                      <p className="text-xs text-muted-foreground italic line-clamp-1">
                        &ldquo;{l.message}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-0.5">
                      <Badge variant="outline" className="text-[10px]">
                        {sourceLabels[l.source] ?? l.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFreshness(l.created_at)}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-muted-foreground shrink-0 pt-1">View →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {pagination.page > 1 && (
            <Link
              href={`/dealer/leads?${activeTab !== "all" ? `status=${activeTab}&` : ""}page=${pagination.page - 1}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {totalPages}
          </span>
          {pagination.page < totalPages && (
            <Link
              href={`/dealer/leads?${activeTab !== "all" ? `status=${activeTab}&` : ""}page=${pagination.page + 1}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

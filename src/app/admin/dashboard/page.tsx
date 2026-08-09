export const revalidate = 60;

import Link from "next/link";
import { getAdminDashboardStats } from "@/features/admin/server/queries";
import { formatFreshness } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import {
  Clock,
  FileCheck,
  Flag,
  LayoutList,
  Store,
  Users,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Activity,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  warning,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  href?: string;
  warning?: boolean;
  accent?: boolean;
}) {
  const isWarning = warning && value > 0;
  const content = (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-card transition-all duration-200",
        href && "hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
        isWarning
          ? "border-orange-700/40 bg-orange-950/20"
          : accent
          ? "border-primary/20 bg-primary/3"
          : "border-border"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "rounded-xl p-2",
          isWarning
            ? "bg-orange-900/40 text-orange-400"
            : accent
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        {isWarning && value > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white animate-pulse">
            !
          </span>
        )}
        {!isWarning && <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/30" />}
      </div>
      <p className={cn(
        "text-3xl font-bold tabular-nums",
        isWarning ? "text-orange-400" : accent ? "text-primary" : "text-foreground"
      )}>
        {value.toLocaleString("en-IN")}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export default async function DashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          Live · refreshes every 60s
        </div>
      </div>

      {/* SLA breach alert */}
      {stats.sla_breached_count > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-700/40 bg-red-950/20 px-5 py-4 text-sm text-red-400">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-red-900/40 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex-1">
            <span className="font-semibold">{stats.sla_breached_count}</span>{" "}
            {stats.sla_breached_count === 1 ? "listing is" : "listings are"}{" "}
            past SLA —{" "}
            <Link href="/admin/approvals" className="underline font-semibold hover:no-underline">
              review now
            </Link>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Pending approvals" value={stats.pending_approvals} icon={Clock}      href="/admin/approvals"  warning />
        <StatCard label="Pending KYC"       value={stats.pending_kyc}       icon={FileCheck}  href="/admin/kyc"        warning />
        <StatCard label="Open reports"      value={stats.open_reports}      icon={Flag}       href="/admin/reports"    warning />
        <StatCard label="Active listings"   value={stats.active_listings}   icon={LayoutList} accent />
        <StatCard label="Total sellers"     value={stats.total_sellers}     icon={Store} />
        <StatCard label="Total users"       value={stats.total_profiles}    icon={Users} />
      </div>

      {/* Tables row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent approvals */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold text-foreground">Recent approvals</h2>
            <Link href="/admin/approvals" className="text-xs text-primary flex items-center gap-0.5 hover:text-primary/80 transition-colors">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {stats.recent_approvals.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No approvals yet</p>
          ) : (
            <div className="divide-y divide-border/60">
              {stats.recent_approvals.map((p) => {
                const sellerName = p.sellers?.business_name ?? p.sellers?.profiles?.full_name ?? "—";
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{sellerName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {p.approved_at ? formatFreshness(p.approved_at) : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent strikes */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold text-foreground">Recent strikes</h2>
            <Link href="/admin/users" className="text-xs text-primary flex items-center gap-0.5 hover:text-primary/80 transition-colors">
              Users <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {stats.recent_strikes.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No strikes issued</p>
          ) : (
            <div className="divide-y divide-border/60">
              {stats.recent_strikes.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-red-950/30 flex items-center justify-center shrink-0">
                    <Flag className="h-3.5 w-3.5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.reason_code}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{s.user_id.slice(0, 12)}…</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {formatFreshness(s.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit log */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Recent audit log
          </h2>
        </div>
        {stats.audit_log_recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No audit events</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  {["Action", "Entity", "ID", "Actor", "Time"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-5 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.audit_log_recent.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{log.action}</td>
                    <td className="px-5 py-3 text-muted-foreground">{log.entity_type}</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">{log.entity_id.slice(0, 8)}…</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">
                      {log.actor_id ? `${log.actor_id.slice(0, 8)}…` : "system"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {formatFreshness(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export const revalidate = 60;

import Link from "next/link";
import { getAdminDashboardStats } from "@/features/admin/server/queries";
import { formatFreshness } from "@/lib/utils/format";
import {
  Clock,
  FileCheck,
  Flag,
  LayoutList,
  Store,
  Users,
  AlertTriangle,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon,
  warning,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-5 ${warning && value > 0 ? "border-orange-300" : "border-border"}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* SLA breached callout */}
      {stats.sla_breached_count > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{stats.sla_breached_count}</strong>{" "}
            {stats.sla_breached_count === 1 ? "listing is" : "listings are"}{" "}
            past SLA &mdash;{" "}
            <Link href="/admin/approvals" className="underline font-medium">
              review now
            </Link>
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Pending approvals"
          value={stats.pending_approvals}
          icon={<Clock className="h-5 w-5" />}
          warning
        />
        <StatCard
          label="Pending KYC"
          value={stats.pending_kyc}
          icon={<FileCheck className="h-5 w-5" />}
          warning
        />
        <StatCard
          label="Open reports"
          value={stats.open_reports}
          icon={<Flag className="h-5 w-5" />}
          warning
        />
        <StatCard
          label="Active listings"
          value={stats.active_listings}
          icon={<LayoutList className="h-5 w-5" />}
        />
        <StatCard
          label="Total sellers"
          value={stats.total_sellers}
          icon={<Store className="h-5 w-5" />}
        />
        <StatCard
          label="Total users"
          value={stats.total_profiles}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent approvals */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Recent approvals</h2>
          </div>
          {stats.recent_approvals.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No approvals yet
            </p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Title
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Seller
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Approved
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_approvals.map((p) => {
                  const sellerName =
                    p.sellers?.business_name ??
                    p.sellers?.profiles?.full_name ??
                    "—";
                  return (
                    <tr key={p.id} className="hover:bg-accent">
                      <td className="px-3 py-3 border-t border-border max-w-[180px] truncate">
                        {p.title}
                      </td>
                      <td className="px-3 py-3 border-t border-border text-muted-foreground">
                        {sellerName}
                      </td>
                      <td className="px-3 py-3 border-t border-border text-muted-foreground whitespace-nowrap">
                        {p.approved_at
                          ? formatFreshness(p.approved_at)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent strikes */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Recent strikes</h2>
          </div>
          {stats.recent_strikes.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No strikes issued
            </p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    User
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Reason
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Issued
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_strikes.map((s) => (
                  <tr key={s.id} className="hover:bg-accent">
                    <td className="px-3 py-3 border-t border-border font-mono text-xs text-muted-foreground">
                      {s.user_id.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      {s.reason_code}
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground whitespace-nowrap">
                      {formatFreshness(s.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Audit log */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Recent audit log</h2>
        </div>
        {stats.audit_log_recent.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No audit events
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Action
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Entity
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  ID
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Actor
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.audit_log_recent.map((log) => (
                <tr key={log.id} className="hover:bg-accent">
                  <td className="px-3 py-3 border-t border-border font-medium">
                    {log.action}
                  </td>
                  <td className="px-3 py-3 border-t border-border text-muted-foreground">
                    {log.entity_type}
                  </td>
                  <td className="px-3 py-3 border-t border-border font-mono text-xs text-muted-foreground">
                    {log.entity_id.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-3 border-t border-border font-mono text-xs text-muted-foreground">
                    {log.actor_id ? `${log.actor_id.slice(0, 8)}…` : "system"}
                  </td>
                  <td className="px-3 py-3 border-t border-border text-muted-foreground whitespace-nowrap">
                    {formatFreshness(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

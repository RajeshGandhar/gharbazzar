export const revalidate = 0;

import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserFull } from "@/features/admin/server/queries";
import { formatFreshness, formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { UserActionsBar } from "./user-actions-bar";

const purposeLabel: Record<string, string> = {
  sale: "Sale",
  rent: "Rent",
  lease: "Lease",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getUserFull(id);
  if (!data) notFound();

  const { profile, seller, listings, strikes, tickets, audit_logs } = data;

  const roleColor: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700 border-purple-200",
    seller: "bg-blue-100 text-blue-700 border-blue-200",
    customer: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const statusColor: Record<string, string> = {
    active: "text-green-700 border-green-200",
    inactive: "text-red-700 border-red-200",
    draft: "text-muted-foreground",
    approved: "text-green-700 border-green-200",
    pending: "text-amber-700 border-amber-200",
    rejected: "text-red-700 border-red-200",
  };

  return (
    <div className="space-y-5">
      <Link
        href="/admin/users"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Users
      </Link>

      {/* Profile header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold">{profile.full_name}</h1>
              <Badge
                variant="outline"
                className={`text-xs ${roleColor[profile.role] ?? ""}`}
              >
                {profile.role.replace("_", " ")}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${profile.is_active ? "text-green-700 border-green-200" : "text-red-700 border-red-200"}`}
              >
                {profile.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground space-x-3">
              {profile.email && <span>{profile.email}</span>}
              {profile.phone && <span>{profile.phone}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Joined {formatFreshness(profile.created_at)}
              {profile.last_seen_at &&
                ` · Last seen ${formatFreshness(profile.last_seen_at)}`}
            </p>
          </div>
          <UserActionsBar
            userId={id}
            isActive={profile.is_active}
            strikeCount={strikes.length}
          />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">
            Listings ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="strikes">
            Strikes ({strikes.length})
          </TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {seller && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-semibold">Seller profile</h2>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Business name</dt>
                <dd>{seller.business_name ?? "—"}</dd>
                <dt className="text-muted-foreground">Seller type</dt>
                <dd className="capitalize">
                  {seller.seller_type.replace("_", " ")}
                </dd>
                <dt className="text-muted-foreground">KYC status</dt>
                <dd className="capitalize">{seller.kyc_status}</dd>
                <dt className="text-muted-foreground">Verified</dt>
                <dd>{seller.is_verified ? "Yes" : "No"}</dd>
                <dt className="text-muted-foreground">Avg rating</dt>
                <dd>{seller.avg_rating ?? "—"}</dd>
              </dl>
            </div>
          )}

          {tickets.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">Recent support tickets</h2>
              </div>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-accent">
                      <td className="px-3 py-3 border-t border-border font-medium">
                        {t.subject}
                      </td>
                      <td className="px-3 py-3 border-t border-border">
                        <Badge variant="outline" className="text-xs capitalize">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 border-t border-border text-muted-foreground">
                        {formatFreshness(t.created_at)}
                      </td>
                      <td className="px-3 py-3 border-t border-border">
                        <Link
                          href={`/admin/support/${t.id}`}
                          className="text-primary text-xs hover:underline flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Listings */}
        <TabsContent value="listings" className="mt-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {listings.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No listings
              </p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Title
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Purpose
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Status
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Approval
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Price
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Listed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-accent">
                      <td className="px-3 py-3 border-t border-border">
                        <Link
                          href={`/property/${l.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline flex items-center gap-1"
                        >
                          <span className="line-clamp-1 max-w-[180px]">
                            {l.title}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                      </td>
                      <td className="px-3 py-3 border-t border-border">
                        <Badge variant="outline" className="text-xs capitalize">
                          {purposeLabel[l.purpose] ?? l.purpose}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 border-t border-border">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${statusColor[l.status] ?? ""}`}
                        >
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 border-t border-border">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${statusColor[l.approval_status] ?? ""}`}
                        >
                          {l.approval_status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 border-t border-border">
                        {formatPrice(l.price)}
                      </td>
                      <td className="px-3 py-3 border-t border-border text-muted-foreground whitespace-nowrap">
                        {formatFreshness(l.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Strikes */}
        <TabsContent value="strikes" className="mt-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {strikes.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No strikes
              </p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Reason code
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Details
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Expires
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">
                      Issued
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {strikes.map((s) => (
                    <tr key={s.id} className="hover:bg-accent">
                      <td className="px-3 py-3 border-t border-border font-medium">
                        {s.reason_code}
                      </td>
                      <td className="px-3 py-3 border-t border-border text-muted-foreground max-w-[200px] truncate">
                        {s.details ?? "—"}
                      </td>
                      <td className="px-3 py-3 border-t border-border text-muted-foreground">
                        {s.expires_at ? formatFreshness(s.expires_at) : "Never"}
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
        </TabsContent>

        {/* Audit */}
        <TabsContent value="audit" className="mt-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {audit_logs.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No audit events
              </p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
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
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {audit_logs.map((log) => (
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
                      <td className="px-3 py-3 border-t border-border text-muted-foreground whitespace-nowrap">
                        {formatFreshness(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

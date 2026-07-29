export const revalidate = 0;

import Link from "next/link";
import { listUsers } from "@/features/admin/server/queries";
import { formatFreshness } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { UsersFilter } from "./users-filter";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    q?: string;
    active?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  const { users, total, perPage } = await listUsers({
    role: sp.role,
    q: sp.q,
    activeOnly: sp.active === "false" ? false : undefined,
    page,
  });

  const totalPages = Math.ceil(total / perPage);

  const roleColor: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700 border-purple-200",
    seller: "bg-blue-100 text-blue-700 border-blue-200",
    customer: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Users
          <span className="ml-2 text-base font-normal text-muted-foreground">
            · {total} total
          </span>
        </h1>
      </div>

      <UsersFilter />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {users.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No users found
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  User
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Role
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Seller type
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Status
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Joined
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const seller = u.sellers as unknown as {
                  seller_type: string;
                  kyc_status: string;
                  is_verified: boolean;
                } | null;

                return (
                  <tr key={u.id} className="hover:bg-accent">
                    <td className="px-3 py-3 border-t border-border">
                      <p className="font-medium">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.email ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <Badge
                        variant="outline"
                        className={`text-xs ${roleColor[u.role] ?? ""}`}
                      >
                        {u.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground">
                      {seller
                        ? seller.seller_type.replace("_", " ")
                        : "—"}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <Badge
                        variant="outline"
                        className={
                          u.is_active
                            ? "text-green-700 border-green-200"
                            : "text-red-700 border-red-200"
                        }
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground whitespace-nowrap">
                      {formatFreshness(u.created_at)}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <Link href={`/admin/users/${u.id}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}`}>
                <Button size="sm" variant="outline">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`?page=${page + 1}`}>
                <Button size="sm" variant="outline">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

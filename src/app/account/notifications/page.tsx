import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/features/account/server/queries";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Bell, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { MarkAllReadButton } from "./mark-all-read-button";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const PER_PAGE = 20;

function NotifIcon({ type }: { type: string }) {
  if (type.includes("success") || type.includes("approved") || type.includes("verified")) {
    return <CheckCircle className="size-4 text-green-600 shrink-0 mt-0.5" />;
  }
  if (type.includes("warn") || type.includes("strike") || type.includes("reject")) {
    return <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />;
  }
  return <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account/notifications");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));

  const { data, count } = await getNotifications(user.id, page);
  const notifications = data ?? [];
  const total = count ?? 0;
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">{total} total{unreadCount > 0 ? `, ${unreadCount} unread on this page` : ""}</p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="rounded-full bg-muted p-5">
            <Bell className="size-8 text-muted-foreground" />
          </div>
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            You'll be notified about listing updates, lead activity, and platform alerts here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-xl border p-4 flex gap-3",
                !n.read_at ? "bg-primary/5 border-primary/20" : "bg-background"
              )}
            >
              <NotifIcon type={n.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.read_at && (
                    <Badge variant="default" className="text-[10px] shrink-0">New</Badge>
                  )}
                </div>
                {n.body && (
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {total > PER_PAGE && (
            <div className="pt-4">
              <Pagination page={page} total={total} perPage={PER_PAGE} baseUrl="/account/notifications" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

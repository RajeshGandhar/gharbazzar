export const revalidate = 0;

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupportTicket } from "@/features/admin/server/queries";
import { formatFreshness } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { TicketReplyForm } from "./ticket-reply-form";
import { TicketStatusForm } from "./ticket-status-form";

const priorityColor: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  normal: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-gray-100 text-gray-600",
};

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSupportTicket(id);
  if (!result) notFound();

  const { ticket, messages, requester_listing_count, requester_strike_count } =
    result;

  const requester = ticket.profiles as unknown as {
    id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
    is_active: boolean;
    created_at: string;
  } | null;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/support"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Support tickets
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left: Conversation */}
        <div className="space-y-5">
          {/* Ticket header */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs capitalize ${priorityColor[ticket.priority] ?? ""}`}
              >
                {ticket.priority}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {ticket.status.replace("_", " ")}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {ticket.channel}
              </Badge>
            </div>
            <h1 className="text-lg font-semibold">{ticket.subject}</h1>
            <p className="text-xs text-muted-foreground">
              #{ticket.id.slice(0, 8)} · Created {formatFreshness(ticket.created_at)}
              {ticket.first_response_at &&
                ` · First response ${formatFreshness(ticket.first_response_at)}`}
            </p>
          </div>

          {/* Message thread */}
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl border p-4 ${
                  msg.is_internal
                    ? "border-amber-200 bg-amber-50"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {msg.author_id
                      ? msg.author_id === ticket.requester_id
                        ? requester?.full_name ?? "Requester"
                        : "Admin"
                      : "System"}
                    {msg.is_internal && (
                      <span className="ml-2 text-amber-600">(Internal note)</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFreshness(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">
                No messages yet
              </p>
            )}
          </div>

          <Separator />

          {/* Reply form */}
          <TicketReplyForm ticketId={ticket.id} />
        </div>

        {/* Right: Ticket meta + requester 360 */}
        <div className="space-y-4">
          <TicketStatusForm ticketId={ticket.id} currentStatus={ticket.status} />

          {requester && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-semibold">Requester</h2>
              <div>
                <p className="font-medium">{requester.full_name}</p>
                {requester.email && (
                  <p className="text-xs text-muted-foreground">{requester.email}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  Joined {formatFreshness(requester.created_at)}
                </p>
                <Badge
                  variant="outline"
                  className={`mt-1 text-xs ${requester.is_active ? "text-green-700" : "text-red-700"}`}
                >
                  {requester.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-semibold">{requester_listing_count}</p>
                  <p className="text-xs text-muted-foreground">Listings</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className={`text-lg font-semibold ${requester_strike_count >= 3 ? "text-red-600" : ""}`}>
                    {requester_strike_count}
                  </p>
                  <p className="text-xs text-muted-foreground">Strikes</p>
                </div>
              </div>
              <Link
                href={`/admin/users/${requester.id}`}
                className="block text-center text-xs text-primary hover:underline"
              >
                View full profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

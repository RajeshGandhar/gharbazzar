import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getInquiryById } from "@/features/leads/server/queries";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeadStatusUpdater } from "@/features/sellers/components/lead-status-updater";
import {
  Phone,
  MessageSquare,
  ArrowLeft,
  ExternalLink,
  Clock,
  Mail,
} from "lucide-react";
import { formatFreshness } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const sourceLabels: Record<string, string> = {
  form: "Form inquiry",
  whatsapp: "WhatsApp",
  call: "Call",
  chat: "Chat",
};

const leadStatusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/10 text-primary" },
  contacted: { label: "Contacted", className: "bg-blue-900/30 text-blue-400" },
  visit_scheduled: { label: "Visit Scheduled", className: "bg-purple-900/30 text-purple-400" },
  negotiating: { label: "Negotiating", className: "bg-amber-900/30 text-amber-400" },
  closed_won: { label: "Won", className: "bg-green-900/30 text-green-400" },
  closed_lost: { label: "Lost", className: "bg-muted text-muted-foreground" },
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;
  const { data: inquiry, error } = await getInquiryById(id, seller.id);

  if (error || !inquiry) notFound();

  const lead = inquiry as unknown as {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    message: string | null;
    source: string;
    status: string;
    notes: string | null;
    created_at: string;
    properties: {
      id: string;
      slug: string;
      title: string;
    } | null;
    profiles: {
      id: string;
      full_name: string;
      avatar_url: string | null;
      phone: string | null;
    } | null;
  };

  const statusCfg = leadStatusConfig[lead.status] ?? leadStatusConfig.new;
  const waMessage = encodeURIComponent(
    `Hi ${lead.name}, I'm following up on your inquiry about the property listed on GharBazaar. When would be a good time to connect?`
  );
  const waLink = `https://wa.me/91${lead.phone.replace(/\D/g, "")}?text=${waMessage}`;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/dealer/leads"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{lead.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge className={cn("text-xs", statusCfg.className)}>
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {sourceLabels[lead.source] ?? lead.source}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatFreshness(lead.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Seeker info + property */}
        <div className="space-y-4">
          {/* Seeker card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Seeker details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{lead.name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-semibold text-primary">{lead.phone}</p>
              </div>
              {lead.email && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{lead.email}</p>
                  </div>
                </>
              )}
              {lead.message && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Message</p>
                    <p className="text-sm italic text-muted-foreground">
                      &ldquo;{lead.message}&rdquo;
                    </p>
                  </div>
                </>
              )}

              {/* Action buttons */}
              <Separator />
              <div className="flex gap-2">
                <a href={`tel:${lead.phone}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 gap-2")}>
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "sm" }), "flex-1 gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white border-0")}>
                  <MessageSquare className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property */}
          {lead.properties && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{lead.properties.title}</p>
                  </div>
                  <Link href={`/property/${lead.properties.slug}`} target="_blank" className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "gap-1.5 text-xs")}>
                    View listing
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Status updater */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Update status</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadStatusUpdater
              inquiryId={lead.id}
              currentStatus={lead.status}
              currentNotes={lead.notes}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

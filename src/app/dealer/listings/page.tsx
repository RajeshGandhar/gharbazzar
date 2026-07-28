import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { listDealerListings } from "@/features/sellers/server/dealer-queries";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Building2,
  Plus,
  Edit,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { formatPrice, formatFreshness } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { DeleteListingButton } from "@/features/sellers/components/delete-listing-button";

export const revalidate = 0;

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Draft" },
  { value: "expired", label: "Expired" },
  { value: "rejected", label: "Rejected" },
] as const;

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

function getStatusKey(status: string, approvalStatus: string): string {
  if (approvalStatus === "pending") return "pending";
  if (approvalStatus === "rejected") return "rejected";
  if (status === "draft") return "draft";
  if (status === "active" && approvalStatus === "approved") return "active_approved";
  if (status === "expired") return "expired";
  return "draft";
}

const purposeLabels: Record<string, string> = {
  sale: "For Sale",
  rent: "For Rent",
  lease: "Lease",
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dealer/listings");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/dealer/onboard");

  const sp = await searchParams;
  const activeTab = sp.status ?? "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const perPage = 15;

  const { data: listings, count } = await listDealerListings(
    seller.id,
    { page, perPage },
    activeTab === "all" ? undefined : activeTab
  );

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Listings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{count ?? 0} total</p>
        </div>
        <Link href="/dealer/listings/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Add listing
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dealer/listings${tab.value === "all" ? "" : `?status=${tab.value}`}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Listing list */}
      {!listings || listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">No listings found</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {activeTab === "all"
              ? "Add your first property to get started."
              : `You have no ${activeTab} listings.`}
          </p>
          <Link href="/dealer/listings/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4 mr-2" />
            Add listing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const l = listing as unknown as {
              id: string;
              slug: string;
              title: string;
              price: number;
              purpose: string;
              status: string;
              approval_status: string;
              views_count: number;
              inquiries_count: number;
              created_at: string;
              expires_at: string | null;
              rejection_reason?: string | null;
              cities?: { name: string } | null;
              areas?: { name: string } | null;
              property_images?: Array<{ thumbnail_path: string | null; is_cover: boolean }>;
            };

            const cover = l.property_images?.find((i) => i.is_cover) ?? l.property_images?.[0];
            const imageUrl = cover?.thumbnail_path
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${cover.thumbnail_path}`
              : null;

            const statusKey = getStatusKey(l.status, l.approval_status);
            const statusCfg = statusConfig[statusKey] ?? statusConfig.draft;
            const isExpired = l.status === "expired";
            const isRejected = l.approval_status === "rejected";
            const locality = l.areas?.name ?? l.cities?.name ?? "";

            return (
              <div
                key={l.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Desktop layout */}
                <div className="hidden sm:flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-28 rounded-lg overflow-hidden bg-muted shrink-0">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={l.title}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{l.title}</p>
                      <Badge className={cn("text-[10px] shrink-0", statusCfg.className)}>
                        {statusCfg.label}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {purposeLabels[l.purpose] ?? l.purpose}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(l.price)}</p>
                    {locality && (
                      <p className="text-xs text-muted-foreground">{locality}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Added {formatFreshness(l.created_at)} · {l.views_count ?? 0} views · {l.inquiries_count ?? 0} leads
                    </p>

                    {isRejected && (l as { rejection_reason?: string | null }).rejection_reason && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive">
                          Rejected: {(l as { rejection_reason?: string | null }).rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isExpired && (
                      <RenewButton propertyId={l.id} />
                    )}
                    {isRejected && (
                      <Link href={`/dealer/listings/${l.id}/edit?step=1`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                        Fix &amp; resubmit
                      </Link>
                    )}
                    <Link href={`/dealer/listings/${l.id}/edit?step=1`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Link>
                    <DeleteListingButton propertyId={l.id} propertyTitle={l.title} />
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="sm:hidden p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-24 rounded-md overflow-hidden bg-muted shrink-0">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={l.title} fill sizes="96px" className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-2">{l.title}</p>
                      <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(l.price)}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <Badge className={cn("text-[10px]", statusCfg.className)}>
                          {statusCfg.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {purposeLabels[l.purpose] ?? l.purpose}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {isRejected && (l as { rejection_reason?: string | null }).rejection_reason && (
                    <p className="text-xs text-destructive flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {(l as { rejection_reason?: string | null }).rejection_reason}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {isExpired && <RenewButton propertyId={l.id} />}
                    <Link href={`/dealer/listings/${l.id}/edit?step=1`} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "flex-1")}>
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Link>
                    <DeleteListingButton propertyId={l.id} propertyTitle={l.title} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/dealer/listings?${activeTab !== "all" ? `status=${activeTab}&` : ""}page=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/dealer/listings?${activeTab !== "all" ? `status=${activeTab}&` : ""}page=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function RenewButton({ propertyId }: { propertyId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        // Server action for renew
        const { createClient: createServerClient } = await import("@/lib/supabase/server");
        const { renewListing } = await import("@/features/properties/server/mutations");
        const { redirect: serverRedirect } = await import("next/navigation");
        const sb = await createServerClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        await renewListing(propertyId, user.id);
        serverRedirect("/dealer/listings");
      }}
    >
      <Button type="submit" size="sm" variant="outline" className="gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" />
        Renew
      </Button>
    </form>
  );
}

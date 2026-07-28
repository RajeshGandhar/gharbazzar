import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DealerNav } from "@/features/sellers/components/dealer-nav";
import { Menu, AlertCircle } from "lucide-react";

const sellerTypeLabels: Record<string, string> = {
  owner: "Owner",
  agent: "Agent",
  builder: "Builder",
  property_manager: "Property Manager",
};

export default async function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dealer");
  }

  // Fetch profile + sellers row
  const [profileResult, sellerResult] = await Promise.all([
    supabase.from("profiles").select("role, full_name, avatar_url, email").eq("id", user.id).single(),
    supabase
      .from("sellers")
      .select("id, slug, seller_type, kyc_status, is_verified, business_name")
      .eq("id", user.id)
      .single(),
  ]);

  const profile = profileResult.data;
  const seller = sellerResult.data;

  // Role check: if not seller and no seller row → onboard
  if (profile?.role !== "super_admin" && !seller) {
    redirect("/dealer/onboard");
  }

  const displayName =
    seller?.business_name ?? profile?.full_name ?? "Seller";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sellerSlug = seller?.slug ?? "";
  const kycStatus = seller?.kyc_status ?? "not_submitted";
  const showKycBanner = kycStatus === "not_submitted" && profile?.role !== "super_admin";

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Seller identity */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
          <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{displayName}</p>
          {seller?.seller_type && (
            <Badge variant="outline" className="text-[10px] mt-0.5">
              {sellerTypeLabels[seller.seller_type] ?? seller.seller_type}
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <DealerNav sellerSlug={sellerSlug} />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-card border-r border-border">
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-background/95 backdrop-blur-sm border-b border-border px-4 h-14">
          <Sheet>
            <SheetTrigger className="shrink-0 inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Dealer menu</SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-semibold">GharBazaar Dealer</span>
        </header>

        {/* KYC Banner */}
        {showKycBanner && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
              Complete KYC to get the{" "}
              <span className="font-semibold">Verified</span> badge and build seeker trust.
            </p>
            <Link
              href="/dealer/kyc"
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap hover:underline"
            >
              Submit KYC →
            </Link>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

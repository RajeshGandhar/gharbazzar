export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu, ExternalLink, LogOut } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

async function getPendingCounts() {
  const supabase = createAdminClient();
  const [approvals, kyc, reports] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending"),
    supabase
      .from("kyc_documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("property_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);
  return {
    approvals: approvals.count ?? 0,
    kyc: kyc.count ?? 0,
    reports: reports.count ?? 0,
  };
}

function SidebarContent({
  pendingCounts,
}: {
  pendingCounts: { approvals: number; kyc: number; reports: number };
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <span className="text-base">GharBazaar</span>
          <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
            Admin
          </span>
        </Link>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <AdminNav pendingCounts={pendingCounts} />
      </div>
      <Separator />
      <div className="flex flex-col gap-1 p-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View site
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") redirect("/");

  const pendingCounts = await getPendingCounts();

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-background md:flex md:flex-col">
        <SidebarContent pendingCounts={pendingCounts} />
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 text-foreground hover:bg-accent hover:text-accent-foreground">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent pendingCounts={pendingCounts} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sm">GharBazaar Admin</span>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

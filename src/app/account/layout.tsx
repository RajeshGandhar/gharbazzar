import { redirect } from "next/navigation";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AccountNav } from "@/features/account/components/account-nav";
import { SignOutButton } from "@/features/account/components/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/dashboard");
  }

  const [profileRes, favCountRes, unreadCountRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  const profile = profileRes.data;
  const favoritesCount = favCountRes.count ?? 0;
  const unreadCount = unreadCountRes.count ?? 0;
  const displayName = profile?.full_name ?? user.email ?? "Account";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* User header */}
      <div className="flex items-center gap-3 px-4 py-5">
        <Avatar size="lg">
          {profile?.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={displayName} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile?.email ?? user.email}
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <AccountNav
          favoritesCount={favoritesCount}
          unreadCount={unreadCount}
        />
      </div>

      <Separator />
      <div className="px-3 py-3">
        <SignOutButton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex h-14 items-center border-b bg-background px-4 lg:hidden">
        <Sheet>
          <SheetTrigger className="shrink-0 inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Account Navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <span className="ml-3 font-semibold">My Account</span>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-card lg:flex lg:flex-col">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Home, Key, GraduationCap, Building2, Bell, Plus, ChevronRight, ChevronDown, Heart, User, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const journeys = [
  { href: "/buy",             label: "Buy",             icon: Home,          desc: "Find your home" },
  { href: "/rent",            label: "Rent",            icon: Key,           desc: "Monthly rentals" },
  { href: "/student-housing", label: "Student Housing", icon: GraduationCap, desc: "Near campus" },
] as const;

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  // Check auth state on mount and listen for changes
  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      if (authUser) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, email, role")
          .eq("id", authUser.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
        setUnreadAlerts(0);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        supabase
          .from("profiles")
          .select("full_name, avatar_url, email, role")
          .eq("id", authUser.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
        setUnreadAlerts(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Unread alert count. RLS ("notifications: own read") scopes this to the
  // signed-in user, so a HEAD count is safe from the browser — no row data
  // crosses the wire, only the integer. Re-runs on navigation so the badge
  // clears once the user has actually read them.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null)
      .then(({ count }) => {
        if (!cancelled) setUnreadAlerts(count ?? 0);
      });
    return () => { cancelled = true; };
  }, [user?.id, pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setUnreadAlerts(0);
    router.push("/");
  }

  const activeJourney = journeys.find((j) => pathname.startsWith(j.href));
  const isAuthenticated = !!user;
  const displayName = profile?.full_name || user?.email || "";
  const initials = getInitials(profile?.full_name, user?.email);
  const dashboardHref = profile?.role === "dealer" || profile?.role === "seller"
    ? "/dealer/dashboard"
    : profile?.role === "super_admin"
      ? "/admin"
      : "/account/dashboard";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full glass transition-all duration-300",
          scrolled
            ? "border-b border-white/[0.06]"
            : "border-b border-transparent"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 flex items-center gap-1.5 group"
            aria-label="GharBazaar home"
          >
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center transition-colors">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              <span className="text-primary">Ghar</span>
              <span className="text-foreground">Bazaar</span>
            </span>
          </Link>

          {/* Divider */}
          <div className="hidden md:block h-4 w-px bg-white/[0.08] mx-1" aria-hidden />

          {/* Journey tabs — desktop */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Primary navigation">
            {journeys.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-md bg-primary/8 border border-primary/12 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile: active journey badge */}
          {activeJourney && (
            <span className="md:hidden ml-1 inline-flex items-center gap-1 rounded-md bg-primary/8 border border-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
              <activeJourney.icon className="h-3 w-3" aria-hidden />
              {activeJourney.label}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Saved listings — quick access */}
                <Link
                  href="/account/favorites"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "hidden md:flex gap-1.5 font-medium text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Heart className="h-3.5 w-3.5" aria-hidden />
                  Saved
                </Link>

                {/* Alerts — saved-search matches and account activity */}
                <Link
                  href="/account/notifications"
                  aria-label={
                    unreadAlerts > 0 ? `Alerts, ${unreadAlerts} unread` : "Alerts"
                  }
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "relative hidden md:flex gap-1.5 font-medium text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                  Alerts
                  {unreadAlerts > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
                      aria-hidden
                    >
                      {unreadAlerts > 9 ? "9+" : unreadAlerts}
                    </span>
                  )}
                </Link>

                {/* List property — primary CTA */}
                <Link
                  href="/list-property"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "hidden sm:flex gap-1.5 font-medium"
                  )}
                >
                  Post property
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </Link>

                {/* User avatar dropdown — desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="hidden sm:flex items-center gap-1.5 rounded-full pl-0.5 pr-1.5 py-0.5 outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Avatar size="sm">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt={displayName} />
                      )}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    {profile?.full_name && (
                      <span className="hidden lg:block max-w-[9rem] truncate text-[13px] font-medium text-foreground">
                        {profile.full_name.split(" ")[0]}
                      </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                        {profile?.full_name && user?.email && (
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        )}
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push(dashboardHref)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/account/favorites")}
                    >
                      <Heart className="h-4 w-4" />
                      Saved properties
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/account/profile")}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/list-property")}
                    >
                      <Building2 className="h-4 w-4" />
                      Post property
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Sign in */}
                <Link
                  href="/auth/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "hidden sm:flex text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  Sign in
                </Link>

                {/* List property — primary CTA */}
                <Link
                  href="/list-property"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "hidden sm:flex gap-1.5 font-medium"
                  )}
                >
                  Post property
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md md:hidden"
              onClick={() => setOpen((p) => !p)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[49px] inset-x-0 z-50 md:hidden glass-heavy border-b border-white/[0.06] px-4 py-4"
            >
              <div className="space-y-1 mb-4">
                {journeys.map(({ href, label, icon: Icon, desc }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
                        active
                          ? "bg-primary/8 text-primary border border-primary/12"
                          : "text-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      <div className={cn(
                        "rounded-md p-1.5",
                        active ? "bg-primary/12" : "bg-white/[0.04]"
                      )}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <ChevronRight className={cn(
                        "ml-auto h-4 w-4",
                        active ? "text-primary" : "text-muted-foreground"
                      )} />
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 px-2 pb-2">
                      <Avatar size="sm">
                        {profile?.avatar_url && (
                          <AvatarImage src={profile.avatar_url} alt={displayName} />
                        )}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                        {profile?.full_name && user?.email && (
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={dashboardHref}
                        onClick={() => setOpen(false)}
                        className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center gap-1.5 font-medium")}
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                        Dashboard
                      </Link>
                      <Link
                        href="/list-property"
                        onClick={() => setOpen(false)}
                        className={cn(buttonVariants(), "w-full justify-center gap-1.5 font-medium")}
                      >
                        <Building2 className="h-3.5 w-3.5" aria-hidden />
                        Post property
                      </Link>
                    </div>
                    <Link
                      href="/account/favorites"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
                    >
                      <Heart className="h-4 w-4" aria-hidden />
                      Saved properties
                    </Link>
                    <Link
                      href="/account/notifications"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
                    >
                      <Bell className="h-4 w-4" aria-hidden />
                      Alerts
                      {unreadAlerts > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-none text-primary-foreground">
                          {unreadAlerts > 9 ? "9+" : unreadAlerts}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={() => { setOpen(false); handleSignOut(); }}
                      className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-white/[0.04] transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setOpen(false)}
                      className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center font-medium")}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/list-property"
                      onClick={() => setOpen(false)}
                      className={cn(buttonVariants(), "w-full justify-center gap-1.5 font-medium")}
                    >
                      <Building2 className="h-3.5 w-3.5" aria-hidden />
                      Post property
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

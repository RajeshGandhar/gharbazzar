"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  Search,
  GitCompare,
  History,
  Calendar,
  Bell,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeVariant?: "default" | "destructive" | "outline";
}

interface AccountNavProps {
  favoritesCount: number;
  unreadCount: number;
}

export function AccountNav({ favoritesCount, unreadCount }: AccountNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/account/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Favorites",
      href: "/account/favorites",
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
      badgeVariant: "outline",
    },
    {
      label: "Saved Searches",
      href: "/account/saved-searches",
      icon: Search,
    },
    {
      label: "Compare",
      href: "/account/compare",
      icon: GitCompare,
    },
    {
      label: "Recently Viewed",
      href: "/account/recently-viewed",
      icon: History,
    },
    {
      label: "Visits",
      href: "/account/visits",
      icon: Calendar,
    },
    {
      label: "Notifications",
      href: "/account/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeVariant: "destructive",
    },
    {
      label: "Profile",
      href: "/account/profile",
      icon: User,
    },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <Badge
                variant={item.badgeVariant ?? "default"}
                className="ml-auto text-[10px] h-4 min-w-4 px-1"
              >
                {item.badge > 99 ? "99+" : item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

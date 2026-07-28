"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  User,
  ShieldCheck,
  ExternalLink,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dealer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dealer/listings", label: "Listings", icon: Building2 },
  { href: "/dealer/leads", label: "Leads", icon: MessageSquare },
  { href: "/dealer/profile", label: "Profile", icon: User },
  { href: "/dealer/kyc", label: "KYC", icon: ShieldCheck },
];

interface DealerNavProps {
  sellerSlug: string;
}

export function DealerNav({ sellerSlug }: DealerNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}

      <div className="mt-4 border-t border-border pt-4 flex flex-col gap-1">
        {sellerSlug && (
          <a
            href={`/seller/${sellerSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            View public profile
          </a>
        )}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4 shrink-0" />
          Back to site
        </Link>
      </div>
    </nav>
  );
}

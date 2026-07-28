"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  FileCheck,
  Flag,
  Users,
  HeadphonesIcon,
  MapPin,
  Settings,
  Building2,
  LayoutDashboard,
} from "lucide-react";

interface PendingCounts {
  approvals: number;
  kyc: number;
  reports: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminNav({ pendingCounts }: { pendingCounts: PendingCounts }) {
  const pathname = usePathname();

  const sections: NavSection[] = [
    {
      title: "Overview",
      items: [
        {
          href: "/admin/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Queues",
      items: [
        {
          href: "/admin/approvals",
          label: "Approvals",
          icon: <CheckSquare className="h-4 w-4" />,
          badge: pendingCounts.approvals,
        },
        {
          href: "/admin/kyc",
          label: "KYC",
          icon: <FileCheck className="h-4 w-4" />,
          badge: pendingCounts.kyc,
        },
        {
          href: "/admin/reports",
          label: "Reports",
          icon: <Flag className="h-4 w-4" />,
          badge: pendingCounts.reports,
        },
      ],
    },
    {
      title: "People",
      items: [
        {
          href: "/admin/users",
          label: "Users",
          icon: <Users className="h-4 w-4" />,
        },
        {
          href: "/admin/support",
          label: "Support",
          icon: <HeadphonesIcon className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Supply",
      items: [
        {
          href: "/admin/field-crm",
          label: "Field CRM",
          icon: <MapPin className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Config",
      items: [
        {
          href: "/admin/seeds/cities",
          label: "Seeds",
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          href: "/admin/settings",
          label: "Settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
  ];

  return (
    <nav className="flex flex-col gap-6 py-2">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {section.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {item.label}
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 rounded-full px-1.5 text-xs bg-orange-100 text-orange-700"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

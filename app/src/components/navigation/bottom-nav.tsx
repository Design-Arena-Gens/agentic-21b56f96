'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet2,
  PieChart,
  UserRound,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/hooks/use-auth";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

const NAVIGATION_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: Wallet2,
  },
  {
    label: "Budgeting",
    href: "/budgeting",
    icon: PieChart,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const haptic = useHapticFeedback(Boolean(user?.settings.haptics));

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t border-[rgba(148,163,184,0.16)] px-6 py-4 backdrop-blur-md sm:rounded-[var(--radius-lg)] sm:border sm:px-8 sm:py-4 sm:shadow-lg sm:left-1/2 sm:bottom-5 sm:w-[min(520px,calc(100%-2rem))] sm:-translate-x-1/2"
      style={{
        paddingBottom: `calc(1rem + var(--safe-bottom))`,
      }}
    >
      {NAVIGATION_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={twMerge(
              "group flex h-14 min-w-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 text-xs font-medium uppercase tracking-wide text-[color:var(--color-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand)] focus-visible:ring-offset-2",
              isActive
                ? "bg-[color:var(--color-brand-muted)] text-[color:var(--color-brand-strong)]"
                : "hover:bg-[rgba(37,99,235,0.08)]",
            )}
            onClick={haptic}
          >
            <Icon
              className={twMerge(
                "size-5 transition-colors",
                isActive
                  ? "text-[color:var(--color-brand-strong)]"
                  : "text-[color:var(--color-muted)] group-hover:text-[color:var(--color-brand)]",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

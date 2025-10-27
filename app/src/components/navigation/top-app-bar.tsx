'use client';

import Image from "next/image";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAppStore } from "@/store/use-app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

export function TopAppBar() {
  const { user, signOut } = useAuth();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const haptic = useHapticFeedback(Boolean(user?.settings.haptics));

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((segment) => segment[0]?.toUpperCase())
        .join("")
    : "A";

  if (!user) return null;

  return (
    <header
      className="glass sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[rgba(148,163,184,0.16)] px-6 py-4 backdrop-blur-xl sm:rounded-[var(--radius-lg)] sm:px-8 sm:py-6"
      style={{
        paddingTop: `calc(0.5rem + var(--safe-top))`,
      }}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-[20px] bg-[color:var(--color-brand-muted)] text-lg font-semibold text-[color:var(--color-brand-strong)]">
          <Image
            src={`https://avatar.vercel.sh/${encodeURIComponent(user.email)}.svg`}
            alt={user.name}
            width={48}
            height={48}
            className="absolute inset-0 size-full opacity-70"
          />
          <span className="relative">{initials}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[color:var(--color-muted)]">
            Welcome back,
          </span>
          <span className="text-lg font-semibold text-[color:var(--color-foreground)]">
            {user.name}
          </span>
          <Badge tone={user.subscription.tier === "premium" ? "success" : "neutral"}>
            {user.subscription.tier === "premium" ? "Premium Member" : "Free Plan"}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle push notifications"
          className="flex size-[44px] items-center justify-center rounded-2xl border border-[rgba(148,163,184,0.18)] bg-[rgba(255,255,255,0.65)] text-[color:var(--color-brand)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand)]"
          onClick={() => {
            updateSettings(user.id, { notifications: !user.settings.notifications });
            haptic();
          }}
        >
          <Bell className="size-5" />
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-12 min-w-[120px] rounded-2xl border border-[rgba(148,163,184,0.24)] bg-[rgba(37,99,235,0.08)] text-[color:var(--color-brand)] hover:bg-[rgba(37,99,235,0.16)]"
          onClick={() => {
            haptic();
            signOut();
          }}
        >
          <LogOut className="mr-2 size-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}

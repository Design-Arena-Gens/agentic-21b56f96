'use client';

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { TopAppBar } from "@/components/navigation/top-app-bar";
import { useAuth } from "@/hooks/use-auth";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  useEffect(() => {
    if (!user) {
      router.replace("/sign-in?next=" + encodeURIComponent(pathname));
    }
  }, [router, user, pathname]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-background)] text-[color:var(--color-muted)]">
        Verifying your account…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[color:var(--color-background)] pb-[96px] sm:pb-[120px]">
      <TopAppBar />
      <main className="flex-1 px-5 pb-24 pt-6 sm:px-8">{children}</main>
      <BottomNav />
    </div>
  );
}

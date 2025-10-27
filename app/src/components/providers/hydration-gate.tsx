'use client';

import { ReactNode, useEffect, useState } from 'react';

type HydrationGateProps = {
  children: ReactNode;
};

export function HydrationGate({ children }: HydrationGateProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-background)] text-[color:var(--color-muted)]">
        <div className="animate-pulse text-sm font-medium tracking-wide">Preparing your finances…</div>
      </div>
    );
  }

  return <>{children}</>;
}

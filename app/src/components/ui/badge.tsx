'use client';

import { twMerge } from "tailwind-merge";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
};

const toneStyles: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-[rgba(15,23,42,0.08)] text-[color:var(--color-foreground)]",
  success: "bg-[rgba(34,197,94,0.16)] text-[color:var(--color-accent)]",
  warning: "bg-[rgba(245,158,11,0.16)] text-[color:var(--color-warning)]",
  danger: "bg-[rgba(239,68,68,0.16)] text-[color:var(--color-danger)]",
  info: "bg-[rgba(6,182,212,0.16)] text-[color:var(--color-info)]",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

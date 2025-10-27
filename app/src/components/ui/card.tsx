'use client';

import { twMerge } from "tailwind-merge";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={twMerge(
        "glass card-shadow rounded-[var(--radius-md)] border border-[color:var(--border-color-base)] bg-[color:var(--color-surface)] p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

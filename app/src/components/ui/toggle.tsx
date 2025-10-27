'use client';

import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type ToggleProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed: boolean;
  label?: string;
};

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ pressed, label, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="switch"
        aria-checked={pressed}
        className={twMerge(
          "flex h-12 w-full items-center justify-between rounded-2xl border border-[color:var(--border-color-base)] bg-[color:var(--color-surface)] px-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand)] focus-visible:ring-offset-2",
          pressed ? "border-[rgba(37,99,235,0.34)] bg-[rgba(37,99,235,0.08)]" : "",
          className,
        )}
        {...props}
      >
        {label ? (
          <span className="text-sm font-medium text-[color:var(--color-foreground)]">{label}</span>
        ) : null}
        <span
          className={twMerge(
            "relative inline-flex h-7 w-12 items-center rounded-full bg-[color:var(--color-muted)] transition-colors",
            pressed ? "bg-[color:var(--color-brand)]" : "",
          )}
        >
          <span
            className={twMerge(
              "inline-block size-6 translate-x-0 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
              pressed ? "translate-x-5" : "translate-x-1",
            )}
          />
        </span>
      </button>
    );
  },
);

Toggle.displayName = "Toggle";

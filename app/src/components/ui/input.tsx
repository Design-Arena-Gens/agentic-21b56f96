'use client';

import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="flex w-full flex-col gap-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[color:var(--color-muted)]"
          >
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            "h-12 w-full rounded-2xl border border-[color:var(--border-color-base)] bg-[color:var(--color-surface)] px-4 text-[15px] text-[color:var(--color-foreground)] shadow-sm shadow-black/5 transition-all placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[rgba(37,99,235,0.18)]",
            className,
          )}
          {...props}
        />
        {error ? <span className="text-xs text-[color:var(--color-danger)]">{error}</span> : null}
      </div>
    );
  },
);

Input.displayName = "Input";

'use client';

import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

const baseStyles =
  "inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--color-brand)] text-white hover:bg-[color:var(--color-brand-strong)] focus-visible:ring-[color:var(--color-brand)]",
  secondary:
    "bg-[color:var(--color-surface-muted)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-subtle)] focus-visible:ring-[color:var(--color-brand)]",
  ghost:
    "bg-transparent text-[color:var(--color-foreground)] hover:bg-[rgba(37,99,235,0.08)] focus-visible:ring-[color:var(--color-brand)]",
  danger:
    "bg-[color:var(--color-danger)] text-white hover:brightness-110 focus-visible:ring-[color:var(--color-danger)]",
  outline:
    "border border-[color:var(--border-color-base)] bg-transparent text-[color:var(--color-foreground)] hover:bg-[rgba(148,163,184,0.14)] focus-visible:ring-[color:var(--color-brand)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-7 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        aria-busy={isLoading}
        className={twMerge(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled ?? isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span className="text-sm font-medium">Please wait…</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

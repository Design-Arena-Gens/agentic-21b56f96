'use client';

import { twMerge } from "tailwind-merge";

type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={twMerge(
        "inline-flex rounded-full border border-[rgba(148,163,184,0.24)] bg-[rgba(255,255,255,0.08)] p-1 backdrop-blur",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={twMerge(
              "relative min-w-[92px] rounded-full px-4 py-2 text-sm font-medium text-[color:var(--color-muted)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand)]",
              isActive &&
                "bg-[color:var(--color-brand)] text-white shadow-[0_10px_18px_-12px_rgba(37,99,235,0.9)]",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

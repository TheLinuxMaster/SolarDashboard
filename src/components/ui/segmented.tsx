"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  items,
  onChange,
  label,
  className,
  stretch = false,
}: {
  value: T;
  items: ReadonlyArray<{ value: T; label: string; count?: number }>;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  stretch?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-flat scroll-x inline-flex max-w-full rounded-full p-1",
        stretch && "flex w-full sm:inline-flex sm:w-auto",
        className,
      )}
      role="group"
      aria-label={label}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
              stretch &&
                "flex-1 justify-center gap-1 px-1.5 text-[11px] sm:flex-none sm:gap-1.5 sm:px-3 sm:text-xs",
              active
                ? "bg-white/[0.11] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                : "text-muted hover:text-ink",
            )}
          >
            {item.label}
            {typeof item.count === "number" && (
              <span
                className={cn(
                  "tabular rounded-full px-1.5 text-[10px]",
                  stretch && "px-1 sm:px-1.5",
                  active ? "bg-white/10 text-ink-2" : "bg-white/[0.05]",
                )}
                title={String(item.count)}
              >
                {item.count >= 1000
                  ? `${(item.count / 1000).toFixed(1)}k`
                  : item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

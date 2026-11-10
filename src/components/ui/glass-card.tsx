import * as React from "react";

import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  tone = "glass",
  ...props
}: React.ComponentProps<"div"> & { tone?: "glass" | "flat" }) {
  return (
    <div
      data-slot="glass-card"
      className={cn(
        tone === "flat" ? "glass-flat" : "glass",
        "rounded-glass",
        className,
      )}
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  detail,
  action,
  icon,
  className,
}: {
  title: React.ReactNode;
  detail?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-line bg-white/[0.045] text-ink-2">
              {icon}
            </span>
          )}
          <h2 className="truncate text-[0.95rem] font-medium tracking-tight">
            {title}
          </h2>
        </div>
        {detail && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{detail}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

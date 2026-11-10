"use client";

import { useState, type ReactNode } from "react";

import { GlassCard, PanelHeader } from "@/components/ui/glass-card";
import { Segmented } from "@/components/ui/segmented";

type View = "chart" | "table";

export function InsightsPanel({
  title,
  detail,
  icon,
  legend,
  chart,
  table,
  footer,
}: {
  title: string;
  detail: ReactNode;
  icon: ReactNode;
  legend: ReactNode;
  chart: ReactNode;
  table: ReactNode;
  footer: ReactNode;
}) {
  const [view, setView] = useState<View>("chart");

  return (
    <GlassCard className="flex h-full flex-col p-0">
      <PanelHeader
        title={title}
        detail={detail}
        icon={icon}
        action={
          <Segmented
            value={view}
            onChange={setView}
            label="Insight view"
            items={[
              { value: "chart", label: "Chart" },
              { value: "table", label: "Table" },
            ]}
          />
        }
      />

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {legend}
        </div>
        <div className="mt-4 flex-1">
          {view === "chart" ? chart : table}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
          {footer}
        </div>
      </div>
    </GlassCard>
  );
}

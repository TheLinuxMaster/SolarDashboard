import { IconSolarPanel } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard, PanelHeader } from "@/components/ui/glass-card";
import { formatPower } from "@/lib/format";
import type { Snapshot } from "@/lib/types";

export function PvStrings({ snapshot }: { snapshot: Snapshot }) {
  const total = snapshot.pv.reduce((sum, string) => sum + string.powerW, 0);
  const max = Math.max(1, ...snapshot.pv.map((string) => string.powerW));
  const quiet = total < 20;
  const producing = snapshot.pv.filter((string) => string.powerW > 0).length;

  return (
    <GlassCard className="flex h-full flex-col p-0">
      <PanelHeader
        title="PV strings"
        detail="MPPT input"
        icon={<IconSolarPanel size={16} aria-hidden="true" />}
        action={
          <Badge tone="solar" className="tabular">
            {formatPower(total)}
          </Badge>
        }
      />

      <div className="flex flex-1 flex-col justify-between px-5 pb-5 pt-4 sm:px-6">
        <div className="space-y-5">
          {snapshot.pv.map((string) => (
            <div key={string.index}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">PV{string.index}</span>
                <span className="text-xs font-medium tabular">
                  {formatPower(string.powerW)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-solar transition-[width] duration-700"
                  style={{
                    width: `${(string.powerW / max) * 100}%`,
                    opacity: string.powerW > 0 ? 0.9 : 0.25,
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted">
                <span>{string.voltageV.toFixed(1)} V</span>
                <span>{string.currentA.toFixed(2)} A</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
          <span>
            {quiet
              ? "No array output right now."
              : `${producing} of ${snapshot.pv.length} arrays producing`}
          </span>
          <span>
            Peak today{" "}
            <strong className="font-medium text-ink">
              {formatPower(snapshot.solar.peakPowerW)}
            </strong>
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

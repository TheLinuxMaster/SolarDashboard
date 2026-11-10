"use client";

import { IconRefresh } from "@tabler/icons-react";

import { useDashboard } from "@/components/dashboard-provider";
import { Button } from "@/components/ui/button";

export function RefreshButton({ compact = false }: { compact?: boolean }) {
  const { refresh, refreshing } = useDashboard();

  return (
    <Button
      type="button"
      variant="glass"
      size={compact ? "icon-sm" : "sm"}
      onClick={refresh}
      disabled={refreshing}
      aria-label="Refresh live data"
      title="Refresh live data"
    >
      <IconRefresh
        size={compact ? 15 : 14}
        className={refreshing ? "spin" : undefined}
        aria-hidden="true"
      />
      {!compact && (
        <span className="hidden sm:inline">
          {refreshing ? "Refreshing" : "Refresh"}
        </span>
      )}
    </Button>
  );
}

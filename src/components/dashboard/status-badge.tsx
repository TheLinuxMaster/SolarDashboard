import { IconAlertTriangle } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";

export function InverterStatusBadge({ status }: { status: string }) {
  if (status === "Normal") {
    return (
      <Badge tone="good" dot>
        Normal
      </Badge>
    );
  }
  if (status === "Warning") {
    return (
      <Badge tone="warn">
        <IconAlertTriangle size={12} aria-hidden="true" />
        Warning
      </Badge>
    );
  }
  if (status === "Alarm") {
    return (
      <Badge tone="bad">
        <IconAlertTriangle size={12} aria-hidden="true" />
        Alarm
      </Badge>
    );
  }
  return (
    <Badge tone="neutral" dot>
      {status || "Not reported"}
    </Badge>
  );
}

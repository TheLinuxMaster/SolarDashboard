import * as React from "react";

import { cn } from "@/lib/utils";

export function TextField({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-white/[0.04] px-3.5 text-sm text-ink",
        "placeholder:text-muted/70",
        "transition-colors hover:border-line-strong focus:border-solar-bright/50",
        "focus:outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

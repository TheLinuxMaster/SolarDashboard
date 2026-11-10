"use client";

import { useEffect, useRef, useState } from "react";
import { IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

export function ClearHistoryButton({
  onClear,
  disabled,
}: {
  onClear: () => Promise<void>;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => {
          setConfirming(true);
          timer.current = window.setTimeout(() => setConfirming(false), 5_000);
        }}
      >
        <IconTrash size={14} aria-hidden="true" />
        Clear stored history
      </Button>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={clearing}
        onClick={async () => {
          setClearing(true);
          await onClear();
          setClearing(false);
          setConfirming(false);
        }}
      >
        {clearing ? "Clearing" : "Clear all samples"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(false)}
      >
        Cancel
      </Button>
    </span>
  );
}

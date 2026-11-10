"use client";

import { useEffect, useState } from "react";

/** Returns 0 until mounted, which keeps server and client markup identical. */
export function useClock(intervalMs = 1_000): number {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}

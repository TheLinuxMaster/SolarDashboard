"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  getSummary,
  postRefresh,
  UnauthorizedError,
} from "@/lib/api-client";
import type { DashboardState } from "@/lib/types";

type DashboardContextValue = {
  state: DashboardState;
  username: string;
  refreshing: boolean;
  pollError: string | null;
  lastPollAt: number;
  refresh: () => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

function messageFor(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "The dashboard could not reach the server.";
}

export function DashboardProvider({
  initial,
  username,
  children,
}: {
  initial: DashboardState;
  username: string;
  children: ReactNode;
}) {
  const [state, setState] = useState(initial);
  const [pollError, setPollError] = useState<string | null>(null);
  const [lastPollAt, setLastPollAt] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inFlight = useRef(false);

  const poll = useCallback(async () => {
    if (inFlight.current) return;
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }

    inFlight.current = true;
    try {
      const next = await getSummary();
      startTransition(() => setState(next));
      setPollError(null);
      setLastPollAt(Date.now());
    } catch (error) {
      if (error instanceof UnauthorizedError) return;
      setPollError(messageFor(error));
    } finally {
      inFlight.current = false;
    }
  }, []);

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        const next = await postRefresh();
        setState(next);
        setPollError(null);
        setLastPollAt(Date.now());
      } catch (error) {
        if (error instanceof UnauthorizedError) return;
        setPollError(messageFor(error));
      }
    });
  }, []);

  useEffect(() => {
    void poll();
  }, [poll]);

  useEffect(() => {
    const interval = Math.max(15_000, state.pollIntervalMs || 30_000);
    const timer = window.setInterval(() => void poll(), interval);

    const onVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastPollAt > 10_000
      ) {
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll, state.pollIntervalMs, lastPollAt]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      state,
      username,
      refreshing: isPending,
      pollError,
      lastPollAt,
      refresh,
    }),
    [state, username, isPending, pollError, lastPollAt, refresh],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const value = useContext(DashboardContext);
  if (!value) {
    throw new Error("useDashboard must be used inside DashboardProvider.");
  }
  return value;
}

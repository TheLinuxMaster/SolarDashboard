import { redirect } from "next/navigation";

import { DashboardProvider } from "@/components/dashboard-provider";
import { Shell } from "@/components/shell/shell";
import { getSession } from "@/lib/session";
import {
  DEFAULT_POLL_INTERVAL_MS,
  type DashboardState,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const CONNECTING_STATE: DashboardState = {
  connection: "connecting",
  plant: {
    groupId: "",
    goodsId: "",
    name: "Solar plant",
    model: "SolarMax Onyx",
    isHybrid: true,
  },
  snapshot: null,
  lastUpdated: null,
  lastAttempt: null,
  error: null,
  pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
  serverTime: new Date(0).toISOString(),
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardProvider initial={CONNECTING_STATE} username={session.username}>
      <Shell username={session.username}>{children}</Shell>
    </DashboardProvider>
  );
}

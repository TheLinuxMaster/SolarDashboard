import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AlertsSkeleton } from "@/components/dashboard/alerts-skeleton";
import { AlertsView } from "@/components/dashboard/alerts-view";
import { CloudAuthError, getNotificationFeed } from "@/lib/cloud/service";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Alerts",
};

export default function AlertsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-light tracking-tight sm:text-3xl">
          Notification logs
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Inverter error logs from CloudInverter&apos;s web log search, newest
          first.
        </p>
      </header>

      <Suspense fallback={<AlertsSkeleton />}>
        <AlertsData />
      </Suspense>
    </div>
  );
}

async function AlertsData() {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    const data = await getNotificationFeed(session);
    return <AlertsView initial={data} initialError={null} />;
  } catch (error) {
    if (error instanceof CloudAuthError) {
      redirect("/login?reason=expired");
    }

    const message =
      error instanceof Error
        ? error.message
        : "Could not load the monitoring feed.";

    console.error("[onyx] notifications failed:", message);
    return <AlertsView initial={null} initialError={message} />;
  }
}

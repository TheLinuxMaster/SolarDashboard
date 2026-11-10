"use client";

import { BrandMark } from "@/components/brand-mark";
import { useDashboard } from "@/components/dashboard-provider";
import { MobileDock } from "@/components/shell/mobile-dock";
import { TopNav } from "@/components/shell/top-nav";

export function Shell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const { state } = useDashboard();

  return (
    <div className="relative flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-solar-bright focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#1b1207]"
      >
        Skip to content
      </a>

      <TopNav username={username} />

      <main
        id="main"
        className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-10 pt-24 sm:px-6 lg:pt-28"
      >
        <div className="page-enter">{children}</div>
      </main>

      <footer className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 border-t border-line px-4 pb-28 pt-6 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-8">
        <div className="flex items-center gap-2">
          <BrandMark size={16} />
          <span>Onyx solar console</span>
        </div>
        <p>
          Live from CloudInverter every {Math.round(state.pollIntervalMs / 1000)}
          s. History is cloud-backed.
        </p>
        <p>Not affiliated with SolarMax, SolarTouch or CloudInverter.</p>
      </footer>

      <MobileDock />
    </div>
  );
}

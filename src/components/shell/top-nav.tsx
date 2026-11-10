"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBell,
  IconChartAreaLine,
  IconLayoutDashboard,
  IconLogout2,
} from "@tabler/icons-react";

import { logoutAction } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { LivePill } from "@/components/shell/live-pill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: IconLayoutDashboard },
  { href: "/insights", label: "Insights", icon: IconChartAreaLine },
  { href: "/alerts", label: "Alerts", icon: IconBell },
] as const;

export function TopNav({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="glass mx-auto flex h-16 w-full max-w-[1440px] items-center gap-2 rounded-full bg-[#080d16]/85 px-3 sm:px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-full py-1 pr-1"
        >
          <BrandMark size={32} />
          <span className="block">
            <span className="block text-[12px] font-semibold leading-4 tracking-[0.22em]">
              ONYX
            </span>
            <span className="hidden text-[10px] leading-4 text-muted sm:block">
              Solar console
            </span>
          </span>
        </Link>

        <nav className="ml-1 hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full px-3 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-white/[0.1] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-muted hover:bg-white/[0.05] hover:text-ink",
                )}
              >
                <Icon size={15} stroke={1.8} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <LivePill />
          <span
            className="hidden max-w-[190px] truncate rounded-full border border-line bg-white/[0.04] px-3 py-1.5 text-[11px] text-ink-2 lg:inline"
            title={username}
          >
            {username}
          </span>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              aria-label="Sign out"
              title="Sign out"
            >
              <IconLogout2 size={16} aria-hidden="true" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

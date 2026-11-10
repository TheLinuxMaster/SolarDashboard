"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBell,
  IconChartAreaLine,
  IconLayoutDashboard,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: IconLayoutDashboard },
  { href: "/insights", label: "Insights", icon: IconChartAreaLine },
  { href: "/alerts", label: "Alerts", icon: IconBell },
] as const;

export function MobileDock() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 md:hidden"
      aria-label="Primary"
    >
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#080d16]/95 p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[76px] flex-col items-center gap-1 rounded-full px-3 py-2 text-[10px] font-medium transition-colors",
                active ? "bg-white/[0.1] text-ink" : "text-muted",
              )}
            >
              <Icon size={18} stroke={1.8} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

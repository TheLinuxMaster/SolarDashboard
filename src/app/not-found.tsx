import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { GlassCard } from "@/components/ui/glass-card";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-md p-6 text-center sm:p-8">
        <BrandMark size={44} className="mx-auto" />
        <p className="mt-5 text-[11px] text-muted">Page not found</p>
        <h1 className="mt-2 text-2xl font-light tracking-tight">
          That page is off the grid.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The page you asked for does not exist. The dashboard is still online.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-solar-bright px-5 text-sm font-medium text-[#1b1207]"
        >
          Back to overview
        </Link>
      </GlassCard>
    </main>
  );
}

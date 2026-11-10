"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IconAlertTriangle } from "@tabler/icons-react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-lg p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <BrandMark size={40} />
          <div>
            <p className="text-sm font-semibold tracking-[0.18em]">ONYX</p>
            <p className="text-[11px] text-muted">Solar console</p>
          </div>
        </div>
        <div className="mt-7 flex items-start gap-3">
          <IconAlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-warn"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-lg font-medium tracking-tight">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              {error.message || "The dashboard could not finish that request."}
            </p>
            {error.digest && (
              <p className="mt-2 text-[10px] text-muted">
                Reference {error.digest}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/login"
            className="text-xs font-medium text-ink-2 underline-offset-4 hover:text-ink hover:underline"
          >
            Sign in again
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}

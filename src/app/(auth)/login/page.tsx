import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/auth/login-form";
import { LoginVisual } from "@/components/auth/login-visual";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const { reason } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <section className="hidden lg:block">
          <div className="flex items-center gap-3">
            <BrandMark size={46} />
            <div>
              <p className="text-sm font-semibold tracking-[0.2em]">ONYX</p>
              <p className="text-[11px] text-muted">Solar console</p>
            </div>
          </div>

          <h2 className="mt-10 max-w-md text-5xl font-light leading-[1.03] tracking-[-0.03em] text-balance">
            Your roof,
            <br />
            in real time.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-2">
            Solar, battery and grid telemetry from your SolarMax Onyx inverter,
            signed and fetched by this server.
          </p>

          <div className="mt-8">
            <LoginVisual />
          </div>

          <div className="mt-2 flex max-w-md flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted">
            <span className="inline-flex items-center gap-2">
              <i className="size-1.5 rounded-full bg-solar-bright" />
              Live output
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="size-1.5 rounded-full bg-grid-bright" />
              Grid flow
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="size-1.5 rounded-full bg-battery-bright" />
              Battery state
            </span>
          </div>
        </section>

        <section className="w-full max-w-md justify-self-center lg:justify-self-end">
          <LoginForm reason={reason} />
          <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">
            Not affiliated with SolarMax, SolarTouch or CloudInverter.
          </p>
        </section>
      </div>
    </main>
  );
}

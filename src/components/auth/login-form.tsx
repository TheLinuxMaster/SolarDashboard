"use client";

import { useActionState, useState } from "react";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconLock,
  IconShieldCheck,
  IconUser,
} from "@tabler/icons-react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { TextField } from "@/components/ui/text-field";

import { loginAction, type LoginState } from "@/app/(auth)/login/actions";

export function LoginForm({ reason }: { reason?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <GlassCard className="p-6 sm:p-8">
      <div className="flex items-center gap-3 lg:hidden">
        <BrandMark size={38} />
        <div>
          <p className="text-sm font-semibold tracking-[0.18em]">ONYX</p>
          <p className="text-[11px] text-muted">Solar console</p>
        </div>
      </div>

      <div className="mt-7 lg:mt-0">
        <h1 className="text-2xl font-medium tracking-tight text-balance">
          Sign in to your inverter
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Use the same account you use in the SolarTouch app or on
          cloudinverter.net.
        </p>
      </div>

      {reason === "expired" && (
        <div className="mt-5 rounded-xl border border-warn/25 bg-warn/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-ink-2">
          Your session ended. Sign in again to reconnect to the inverter.
        </div>
      )}

      {state?.error && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-bad/30 bg-bad/[0.08] px-3.5 py-3 text-xs leading-relaxed text-ink-2"
        >
          <IconAlertTriangle
            size={15}
            className="mt-0.5 shrink-0 text-bad"
            aria-hidden="true"
          />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="username"
            className="mb-1.5 block text-xs font-medium text-ink-2"
          >
            CloudInverter username
          </label>
          <div className="relative">
            <IconUser
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <TextField
              id="username"
              name="username"
              type="text"
              required
              autoFocus
              autoComplete="username"
              placeholder="Your SolarTouch username"
              className="pl-10"
              aria-invalid={state?.error ? true : undefined}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium text-ink-2"
          >
            Password
          </label>
          <div className="relative">
            <IconLock
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <TextField
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Your SolarTouch password"
              className="pl-10 pr-11"
              aria-invalid={state?.error ? true : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
            >
              {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={pending}
          className="w-full"
        >
          {pending ? (
            <>
              <IconLoader2 size={17} className="spin" />
              Connecting
            </>
          ) : (
            <>
              Connect inverter
              <IconArrowRight size={17} />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-2.5 border-t border-line pt-5 text-[11px] leading-relaxed text-muted">
        <IconShieldCheck size={15} className="mt-0.5 shrink-0 text-good" />
        <p>
          Your password is sealed in an encrypted, HttpOnly session cookie and is
          used only to sign requests with CloudInverter. It is never stored in
          plain text or in environment variables.
        </p>
      </div>
    </GlassCard>
  );
}

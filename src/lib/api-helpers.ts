import "server-only";
import { NextResponse } from "next/server";

import {
  CloudAuthError,
  RefreshTooSoonError,
} from "@/lib/cloud/service";

export function jsonOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host = request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof CloudAuthError) {
    return jsonError("Your session ended. Sign in again.", 401);
  }
  if (error instanceof RefreshTooSoonError) {
    return jsonError(error.message, 429);
  }

  console.error(
    "[onyx] api error:",
    error instanceof Error ? error.message : error,
  );
  return jsonError(
    error instanceof Error
      ? error.message
      : "The upstream service could not be reached.",
    502,
  );
}

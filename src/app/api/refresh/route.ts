import {
  errorResponse,
  isSameOrigin,
  jsonError,
  jsonOk,
} from "@/lib/api-helpers";
import { refreshDashboard } from "@/lib/cloud/service";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Cross-origin refresh is not allowed.", 403);
  }

  const session = await getSession();
  if (!session) return jsonError("Sign in required.", 401);

  try {
    const state = await refreshDashboard(session);
    return jsonOk({ ok: true, state });
  } catch (error) {
    return errorResponse(error);
  }
}

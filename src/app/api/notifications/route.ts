import { errorResponse, jsonError, jsonOk } from "@/lib/api-helpers";
import { getNotificationFeed } from "@/lib/cloud/service";
import { getSession } from "@/lib/session";
import { NOTIFICATION_RANGES } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("Sign in required.", 401);

  const url = new URL(request.url);
  const force = url.searchParams.get("refresh") === "1";
  const requested = Number(url.searchParams.get("days"));
  const days = (NOTIFICATION_RANGES as readonly number[]).includes(requested)
    ? requested
    : 7;

  try {
    return jsonOk(await getNotificationFeed(session, force, days));
  } catch (error) {
    return errorResponse(error);
  }
}

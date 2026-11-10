import { errorResponse, jsonError, jsonOk } from "@/lib/api-helpers";
import { getInsights } from "@/lib/cloud/service";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("Sign in required.", 401);

  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? "day";
  const date = url.searchParams.get("date") ?? "";

  try {
    return jsonOk(await getInsights(session, period, date));
  } catch (error) {
    return errorResponse(error);
  }
}

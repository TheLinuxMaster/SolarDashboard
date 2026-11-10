import { errorResponse, jsonError, jsonOk } from "@/lib/api-helpers";
import { getDashboard } from "@/lib/cloud/service";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Sign in required.", 401);

  try {
    return jsonOk(await getDashboard(session));
  } catch (error) {
    return errorResponse(error);
  }
}

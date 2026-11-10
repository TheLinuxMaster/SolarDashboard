import { jsonOk } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return jsonOk({
    ok: true,
    service: "onyx-solar-console",
    runtime: "nextjs",
    time: new Date().toISOString(),
  });
}

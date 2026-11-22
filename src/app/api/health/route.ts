import { NextResponse } from "next/server";
import { getProviderStatuses } from "@/lib/data/registry";
import { cacheStats } from "@/lib/data/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const providers = getProviderStatuses();
  const operational = providers.filter((p) => p.status === "operational").length;
  const degraded = providers.filter((p) => p.status === "degraded").length;
  const planned = providers.filter((p) => p.status === "planned").length;
  const unverified = providers.filter((p) => p.status === "unverified").length;

  return NextResponse.json(
    {
      status: degraded > 0 ? "degraded" : operational > 0 ? "ok" : "starting",
      service: "earthcore",
      time: new Date().toISOString(),
      providers: {
        total: providers.length,
        operational,
        degraded,
        unverified,
        planned,
      },
      cache: cacheStats(),
      note: "Provider status reflects calls observed by this process, not a synthetic heartbeat.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

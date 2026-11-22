import { NextRequest } from "next/server";
import { getLocationIntelligence } from "@/lib/data";
import { coverageIndex } from "@/lib/data/coverage";
import { handlerError, json, requireCoordinate } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { latitude, longitude } = requireCoordinate(url);
    const intelligence = await getLocationIntelligence(latitude, longitude, {
      includeClimate: url.searchParams.get("climate") === "1",
    });
    return json({
      latitude,
      longitude,
      coverage: intelligence.coverage,
      coverageIndex: coverageIndex(intelligence.coverage),
      definition: intelligence.coverageDefinition,
      retrievedAt: intelligence.retrievedAt,
    });
  } catch (error) {
    return handlerError(error);
  }
}

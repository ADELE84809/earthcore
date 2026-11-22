import { NextRequest } from "next/server";
import { getClimateSummary } from "@/lib/data/providers/open-meteo-archive";
import { handlerError, intParam, json, requireCoordinate } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { latitude, longitude } = requireCoordinate(url);
    const startYear = intParam(url, "start", 1991, 1940, 2030);
    const endYear = intParam(url, "end", new Date().getUTCFullYear() - 1, 1950, 2100);
    const climate = await getClimateSummary(latitude, longitude, {
      startYear,
      endYear: Math.max(startYear, endYear),
    });
    return json(climate, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" },
    });
  } catch (error) {
    return handlerError(error);
  }
}

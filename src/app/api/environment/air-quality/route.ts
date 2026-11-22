import { NextRequest } from "next/server";
import { getAirQuality } from "@/lib/data/providers/open-meteo-air";
import { handlerError, json, requireCoordinate } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { latitude, longitude } = requireCoordinate(new URL(request.url));
    const air = await getAirQuality(latitude, longitude);
    return json(air, {
      headers: { "Cache-Control": "public, max-age=600, stale-while-revalidate=900" },
    });
  } catch (error) {
    return handlerError(error);
  }
}

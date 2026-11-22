import { NextRequest } from "next/server";
import { getEarthquakes } from "@/lib/data/providers/usgs";
import { nearbyEarthquakes } from "@/lib/data/coverage";
import { errorResponse, handlerError, intParam, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const days = intParam(url, "days", 30, 1, 365);
  const minMagnitude = Number(url.searchParams.get("minmagnitude") ?? 2.5);
  const limit = intParam(url, "limit", 2000, 1, 20_000);
  const latRaw = url.searchParams.get("lat");
  const lonRaw = url.searchParams.get("lon");
  const radius = intParam(url, "radius", 1000, 10, 20_000);

  try {
    const result = await getEarthquakes({
      days,
      minMagnitude: Number.isFinite(minMagnitude) ? minMagnitude : 2.5,
      limit,
    });

    let earthquakes = result.earthquakes;
    if (latRaw !== null && lonRaw !== null) {
      const latitude = Number(latRaw);
      const longitude = Number(lonRaw);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        earthquakes = nearbyEarthquakes(earthquakes, latitude, longitude, radius);
      }
    }

    return json({
      earthquakes,
      count: earthquakes.length,
      days,
      minMagnitude,
      generatedAt: result.generatedAt,
      retrievedAt: result.retrievedAt,
      note: "USGS earthquake catalog. Preliminary magnitudes may be revised.",
    });
  } catch (error) {
    return error instanceof Error
      ? handlerError(error)
      : errorResponse(502, "EARTHQUAKES_UNAVAILABLE", "Earthquake provider unavailable");
  }
}

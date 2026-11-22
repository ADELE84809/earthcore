import { NextRequest } from "next/server";
import { getWeather } from "@/lib/data/providers/open-meteo-weather";
import { handlerError, json, requireCoordinate } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { latitude, longitude } = requireCoordinate(new URL(request.url));
    const weather = await getWeather(latitude, longitude);
    return json(weather, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    return handlerError(error);
  }
}

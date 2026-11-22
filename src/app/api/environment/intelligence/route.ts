import { NextRequest } from "next/server";
import { getLocationIntelligence } from "@/lib/data";
import { handlerError, json, requireCoordinate } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { latitude, longitude } = requireCoordinate(url);
    const includeClimate = url.searchParams.get("climate") === "1";
    const intelligence = await getLocationIntelligence(latitude, longitude, { includeClimate });
    return json(intelligence, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    return handlerError(error);
  }
}

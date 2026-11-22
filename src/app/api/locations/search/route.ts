import { NextRequest } from "next/server";
import { searchPlaces } from "@/lib/data/providers/open-meteo-geo";
import { errorResponse, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length < 2) {
    return json({ query, results: [], note: "Type at least two characters." });
  }
  try {
    const results = await searchPlaces(query, { count: 6 });
    return json({ query, results, retrievedAt: new Date().toISOString() });
  } catch (error) {
    return errorResponse(
      502,
      "GEOCODING_UNAVAILABLE",
      error instanceof Error ? error.message : "Geocoding provider unavailable",
    );
  }
}

import { NextRequest } from "next/server";
import { getEvents } from "@/lib/data/providers/eonet";
import { nearbyEvents } from "@/lib/data/coverage";
import { errorResponse, handlerError, intParam, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const days = intParam(url, "days", 30, 1, 365);
  const limit = intParam(url, "limit", 500, 1, 1000);
  const category = url.searchParams.get("category");
  const statusParam = url.searchParams.get("status");
  const status = statusParam === "closed" ? "closed" : "open";

  const latRaw = url.searchParams.get("lat");
  const lonRaw = url.searchParams.get("lon");
  const radius = intParam(url, "radius", 1000, 10, 20_000);

  try {
    const { events, retrievedAt } = await getEvents({ days, status, limit: 1000 });
    let filtered = category
      ? events.filter((event) => event.category.id === category)
      : events;

    if (latRaw !== null && lonRaw !== null) {
      const latitude = Number(latRaw);
      const longitude = Number(lonRaw);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        filtered = nearbyEvents(filtered, latitude, longitude, radius).slice(0, limit);
      }
    }

    return json({
      events: filtered,
      count: filtered.length,
      days,
      status,
      category: category ?? null,
      retrievedAt,
      note: "NASA EONET event records. EarthCore is not an official warning channel.",
    });
  } catch (error) {
    return error instanceof Error
      ? handlerError(error)
      : errorResponse(502, "EVENTS_UNAVAILABLE", "Event provider unavailable");
  }
}

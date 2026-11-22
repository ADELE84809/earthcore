import { z } from "zod";
import { cached } from "../cache";
import { fetchJson } from "../http";
import type { NaturalEvent } from "@/lib/types";

const BASE_URL = "https://eonet.gsfc.nasa.gov/api/v3";
export const EONET_DOC = "https://eonet.gsfc.nasa.gov/docs/v3";

const geometrySchema = z.object({
  date: z.string().nullable().optional(),
  type: z.string().optional(),
  coordinates: z.array(z.number()).optional(),
  magnitudeValue: z.number().nullable().optional(),
  magnitudeUnit: z.string().nullable().optional(),
});

const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  link: z.string().optional(),
  closed: z.string().nullable().optional(),
  categories: z.array(z.object({ id: z.string(), title: z.string() })).optional(),
  sources: z.array(z.object({ id: z.string(), url: z.string() })).optional(),
  geometry: z.array(geometrySchema).optional(),
});

const eventsResponseSchema = z.object({
  events: z.array(eventSchema).optional(),
  description: z.string().optional(),
});

const categoriesResponseSchema = z.object({
  categories: z
    .array(z.object({ id: z.string(), title: z.string(), layers: z.unknown().optional() }))
    .optional(),
});

type RawEvent = z.infer<typeof eventSchema>;

export const EONET_CATEGORY_COLORS: Record<string, string> = {
  wildfires: "#F07878",
  severeStorms: "#8D8CF7",
  volcanoes: "#F4B55C",
  floods: "#4B8EFF",
  landslides: "#3BE0AE",
  seaLakeIce: "#57E7F5",
  waterColor: "#57E7F5",
  dustHaze: "#F4B55C",
  snow: "#A2B2C8",
  tempExtremes: "#F07878",
  manmade: "#8D8CF7",
};

function normalizeEvent(raw: RawEvent): NaturalEvent {
  const geometry = (raw.geometry ?? [])
    .filter((g) => Array.isArray(g.coordinates) && g.coordinates.length >= 2)
    .map((g) => {
      const [lon, lat, third] = g.coordinates as [number, number, number?];
      return {
        date: g.date ?? null,
        type: g.type ?? "Point",
        coordinates: (third !== undefined ? [lon, lat, third] : [lon, lat]) as
          | [number, number]
          | [number, number, number],
        magnitudeValue: g.magnitudeValue ?? null,
        magnitudeUnit: g.magnitudeUnit ?? null,
      };
    });

  const last = geometry[geometry.length - 1];
  const dated = geometry.filter((g) => g.date).sort((a, b) => (a.date! < b.date! ? -1 : 1));

  return {
    id: raw.id,
    title: raw.title,
    category: raw.categories?.[0] ?? { id: "other", title: "Other" },
    status: raw.closed ? "closed" : "open",
    description: raw.description ?? null,
    link: raw.link ?? `${BASE_URL}/events/${raw.id}`,
    sources: (raw.sources ?? []).filter((s) => typeof s.url === "string"),
    geometry,
    point: last ? { longitude: last.coordinates[0], latitude: last.coordinates[1] } : null,
    startedAt: dated[0]?.date ?? null,
    closedAt: raw.closed ?? null,
    magnitude: last?.magnitudeValue ?? null,
    magnitudeUnit: last?.magnitudeUnit ?? null,
  };
}

export async function getEvents(options: { days?: number; status?: "open" | "closed"; limit?: number } = {}) {
  const days = Math.min(365, Math.max(1, options.days ?? 30));
  const status = options.status ?? "open";
  const key = `eonet:${status}:${days}`;

  return cached(key, 15 * 60_000, async () => {
    const params = new URLSearchParams({ status, days: String(days) });
    const { data, retrievedAt } = await fetchJson<unknown>(`${BASE_URL}/events?${params.toString()}`, {
      providerId: "eonet",
      revalidate: 900,
    });
    const parsed = eventsResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("EONET response failed validation");
    }
    const events = (parsed.data.events ?? []).map(normalizeEvent);
    const sorted = events.sort((a, b) => {
      const ad = a.startedAt ?? "";
      const bd = b.startedAt ?? "";
      return bd.localeCompare(ad);
    });
    const limit = options.limit ?? sorted.length;
    return {
      events: sorted.slice(0, limit),
      retrievedAt,
      sourceValidAt: sorted.find((e) => e.startedAt)?.startedAt ?? null,
    };
  });
}

export async function getEventCategories(): Promise<{ id: string; title: string }[]> {
  return cached("eonet:categories", 24 * 60 * 60_000, async () => {
    const { data } = await fetchJson<unknown>(`${BASE_URL}/categories`, {
      providerId: "eonet",
      revalidate: 86_400,
    });
    const parsed = categoriesResponseSchema.safeParse(data);
    if (!parsed.success) return [];
    return (parsed.data.categories ?? []).map(({ id, title }) => ({ id, title }));
  });
}

/** Events whose most recent geometry falls within `radiusKm` of a point. */
export function eventsNear(
  events: NaturalEvent[],
  latitude: number,
  longitude: number,
  radiusKm: number,
): NaturalEvent[] {
  const R = 6371.0088;
  const toRad = (d: number) => (d * Math.PI) / 180;
  return events.filter((event) => {
    if (!event.point) return false;
    const dLat = toRad(event.point.latitude - latitude);
    const dLon = toRad(event.point.longitude - longitude);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(latitude)) * Math.cos(toRad(event.point.latitude)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h))) <= radiusKm;
  });
}

import { z } from "zod";
import { cached } from "../cache";
import { fetchJson } from "../http";
import { asNumber } from "../parse";
import type { Earthquake } from "@/lib/types";

const QUERY_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";
export const USGS_DOC = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/";

const featureSchema = z.object({
  id: z.string(),
  properties: z
    .object({
      mag: z.number().nullable().optional(),
      place: z.string().nullable().optional(),
      time: z.number().nullable().optional(),
      updated: z.number().nullable().optional(),
      tz: z.number().nullable().optional(),
      url: z.string().optional(),
      status: z.string().optional(),
      tsunami: z.number().nullable().optional(),
      sig: z.number().nullable().optional(),
      magType: z.string().nullable().optional(),
      felt: z.number().nullable().optional(),
      title: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
  geometry: z
    .object({
      type: z.string().optional(),
      coordinates: z.array(z.number()).optional(),
    })
    .optional(),
});

const responseSchema = z.object({
  type: z.string().optional(),
  metadata: z
    .object({
      generated: z.number().optional(),
      status: z.number().optional(),
      title: z.string().optional(),
      count: z.number().optional(),
    })
    .optional(),
  features: z.array(featureSchema).optional(),
});

export function buildUsgsUrl(options: {
  startIso: string;
  endIso: string;
  minMagnitude?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  maxRadiusKm?: number;
}): string {
  const params = new URLSearchParams({
    format: "geojson",
    starttime: options.startIso.slice(0, 10),
    endtime: options.endIso.slice(0, 10),
    orderby: "time",
    limit: String(Math.min(20_000, Math.max(1, options.limit ?? 2000))),
  });
  if (options.minMagnitude !== undefined) {
    params.set("minmagnitude", options.minMagnitude.toFixed(1));
  }
  if (options.latitude !== undefined && options.longitude !== undefined && options.maxRadiusKm) {
    params.set("latitude", options.latitude.toFixed(4));
    params.set("longitude", options.longitude.toFixed(4));
    params.set("maxradiuskm", options.maxRadiusKm.toFixed(0));
    params.set("orderby", "magnitude");
  }
  return `${QUERY_URL}?${params.toString()}`;
}

function normalizeFeature(feature: z.infer<typeof featureSchema>): Earthquake | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const props = feature.properties ?? {};
  const time = asNumber(props.time);
  return {
    id: feature.id,
    magnitude: asNumber(props.mag),
    magnitudeType: props.magType ?? null,
    place: props.place ?? "Unknown location",
    time: time !== null ? new Date(time).toISOString() : new Date(0).toISOString(),
    updated: props.updated ? new Date(props.updated).toISOString() : new Date(0).toISOString(),
    depthKm: coords.length >= 3 ? coords[2] : null,
    longitude: coords[0],
    latitude: coords[1],
    url: props.url ?? "https://earthquake.usgs.gov/earthquakes/map/",
    status: props.status === "reviewed" ? "reviewed" : "automatic",
    tsunami: asNumber(props.tsunami),
    significance: asNumber(props.sig),
    feltReports: asNumber(props.felt),
  };
}

export async function getEarthquakes(options: {
  days?: number;
  minMagnitude?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  maxRadiusKm?: number;
} = {}) {
  const days = Math.min(365, Math.max(1, options.days ?? 30));
  const minMagnitude = options.minMagnitude ?? 2.5;
  const key = [
    "usgs",
    days,
    minMagnitude,
    options.limit ?? 2000,
    options.latitude?.toFixed(2) ?? "all",
    options.maxRadiusKm ?? "all",
  ].join(":");

  return cached(key, 5 * 60_000, async () => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 86_400_000);
    const url = buildUsgsUrl({
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      minMagnitude,
      limit: options.limit ?? 2000,
      latitude: options.latitude,
      longitude: options.longitude,
      maxRadiusKm: options.maxRadiusKm,
    });
    const { data, retrievedAt } = await fetchJson<unknown>(url, {
      providerId: "usgs",
      revalidate: 300,
    });
    const parsed = responseSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("USGS response failed validation");
    }
    const earthquakes = (parsed.data.features ?? [])
      .map(normalizeFeature)
      .filter((e): e is Earthquake => e !== null)
      .filter((e) => e.status !== "deleted")
      .sort((a, b) => b.time.localeCompare(a.time));

    return {
      earthquakes,
      retrievedAt,
      generatedAt:
        parsed.data.metadata?.generated !== undefined
          ? new Date(parsed.data.metadata.generated).toISOString()
          : null,
    };
  });
}

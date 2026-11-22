import { z } from "zod";
import { cached } from "../cache";
import { fetchJson } from "../http";
import { asNumber, asString } from "../parse";
import type { Place } from "@/lib/types";

const BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";
export const OPEN_METEO_GEO_DOC = "https://open-meteo.com/en/docs/geocoding-api";

const resultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  feature_code: z.string().optional(),
  country_code: z.string().optional(),
  country: z.string().optional(),
  admin1: z.string().optional(),
  admin2: z.string().optional(),
  timezone: z.string().optional(),
  population: z.number().optional(),
});

const responseSchema = z.object({
  results: z.array(resultSchema).optional(),
  generationtime_ms: z.number().optional(),
});

function normalizePlace(raw: z.infer<typeof resultSchema>): Place {
  return {
    id: String(raw.id),
    name: raw.name,
    country: raw.country ?? null,
    countryCode: raw.country_code ?? null,
    admin1: raw.admin1 ?? null,
    admin2: raw.admin2 ?? null,
    latitude: raw.latitude,
    longitude: raw.longitude,
    elevation: asNumber(raw.elevation),
    timezone: raw.timezone ?? null,
    population: asNumber(raw.population),
    featureCode: raw.feature_code ?? null,
  };
}

export function placeLabel(place: Place): string {
  const region = [place.admin1, place.country].filter(Boolean).join(", ");
  return region ? `${place.name}, ${region}` : place.name;
}

/**
 * Worldwide place search. The provider returns several candidates for ambiguous
 * names; all are preserved so the interface can show geographic context instead
 * of silently choosing one.
 */
export async function searchPlaces(
  query: string,
  options: { count?: number; language?: string } = {},
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const count = Math.min(10, Math.max(1, options.count ?? 6));
  const key = `geo:${q.toLowerCase()}:${count}:${options.language ?? "en"}`;

  return cached(key, 6 * 60 * 60_000, async () => {
    const params = new URLSearchParams({
      name: q,
      count: String(count),
      language: options.language ?? "en",
      format: "json",
    });
    const { data } = await fetchJson<unknown>(`${BASE_URL}?${params.toString()}`, {
      providerId: "open-meteo-geo",
      revalidate: 21_600,
    });
    const parsed = responseSchema.safeParse(data);
    if (!parsed.success) return [];
    return (parsed.data.results ?? []).map(normalizePlace);
  });
}

export function describePlace(place: Place | null): string {
  if (!place) return "Selected coordinates";
  const region = [place.admin1, place.country].filter(Boolean).join(", ");
  return region ? `${place.name}, ${region}` : place.name;
}

export function placeToResult(place: Place): {
  id: string;
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
  kind: string;
} {
  const subtitle = [place.admin1, place.country].filter(Boolean).join(", ");
  return {
    id: place.id,
    name: place.name,
    subtitle: subtitle || place.countryCode || "—",
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
    kind: place.featureCode ?? "place",
  };
}

export { responseSchema as geocodingResponseSchema, resultSchema as geocodingResultSchema };

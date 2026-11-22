/**
 * EarthCore data engine — the single entry point used by pages and API routes.
 *
 * Every call is independent and failure-isolated: if one provider is down the
 * others still populate the interface, and the missing one is reported as
 * unavailable rather than filled with a substitute value.
 */

import type { CoverageItem, Earthquake, ImageryLayer, NaturalEvent, Place } from "@/lib/types";
import type {
  ClimateBundle,
  EarthquakesBundle,
  EventsBundle,
  LocationIntelligence,
  WeatherBundle,
} from "./bundles";
import { buildCoverage, nearbyEarthquakes, nearbyEvents } from "./coverage";
import { cacheStats } from "./cache";
import { getProviderStatuses } from "./registry";
import { getEvents } from "./providers/eonet";
import { getEarthquakes } from "./providers/usgs";
import { getImageryLayers } from "./providers/gibs";
import { getWeather } from "./providers/open-meteo-weather";
import { getAirQuality } from "./providers/open-meteo-air";
import { getClimateSummary } from "./providers/open-meteo-archive";
import { searchPlaces } from "./providers/open-meteo-geo";
import { getGlobalTemperature } from "./providers/gistemp";

export {
  getWeather,
  getAirQuality,
  getClimateSummary,
  getEvents,
  getEarthquakes,
  getImageryLayers,
  searchPlaces,
  getGlobalTemperature,
};

export interface ExploreSnapshot {
  imagery: ImageryLayer[];
  events: NaturalEvent[];
  earthquakes: Earthquake[];
  retrievedAt: string;
  eventsError: string | null;
  earthquakesError: string | null;
  imageryError: string | null;
}

/** Data needed to paint the global view before a location is selected. */
export async function getExploreSnapshot(): Promise<ExploreSnapshot> {
  const [eventsResult, earthquakesResult, imagery] = await Promise.all([
    getEvents({ days: 30, status: "open", limit: 500 }).catch((error: unknown) => ({
      error: error instanceof Error ? error.message : "Events unavailable",
    })),
    getEarthquakes({ days: 30, minMagnitude: 2.5, limit: 2000 }).catch((error: unknown) => ({
      error: error instanceof Error ? error.message : "Earthquakes unavailable",
    })),
    getImageryLayers().catch(() => [] as ImageryLayer[]),
  ]);

  const eventsBundle = eventsResult as EventsBundle | { error: string };
  const earthquakesBundle = earthquakesResult as EarthquakesBundle | { error: string };

  return {
    imagery,
    events: "events" in eventsBundle ? eventsBundle.events : [],
    earthquakes: "earthquakes" in earthquakesBundle ? earthquakesBundle.earthquakes : [],
    retrievedAt: new Date().toISOString(),
    eventsError: ("error" in eventsBundle ? eventsBundle.error : null) ?? null,
    earthquakesError: ("error" in earthquakesBundle ? earthquakesBundle.error : null) ?? null,
    imageryError: imagery.length === 0 ? "No imagery availability could be verified." : null,
  };
}

export interface LocationIntelligenceOptions {
  includeClimate?: boolean;
  eventRadiusKm?: number;
  earthquakeRadiusKm?: number;
}

/**
 * Everything the location dashboard needs, fetched in parallel. Each source is
 * wrapped so that a failure becomes an explicit `null` + error message.
 */
export async function getLocationIntelligence(
  latitude: number,
  longitude: number,
  options: LocationIntelligenceOptions = {},
): Promise<LocationIntelligence> {
  const includeClimate = options.includeClimate ?? false;
  const eventRadiusKm = options.eventRadiusKm ?? 1000;
  const earthquakeRadiusKm = options.earthquakeRadiusKm ?? 1000;

  const [weatherResult, airResult, imageryResult, eventsResult, earthquakesResult, climateResult] =
    await Promise.all([
      getWeather(latitude, longitude).catch((error: unknown) => ({
        error: error instanceof Error ? error.message : "Weather unavailable",
      })),
      getAirQuality(latitude, longitude).catch((error: unknown) => ({
        error: error instanceof Error ? error.message : "Air quality unavailable",
      })),
      getImageryLayers().catch(() => [] as ImageryLayer[]),
      getEvents({ days: 30, status: "open", limit: 500 }).catch((error: unknown) => ({
        error: error instanceof Error ? error.message : "Events unavailable",
      })),
      getEarthquakes({ days: 30, minMagnitude: 2.5, limit: 2000 }).catch((error: unknown) => ({
        error: error instanceof Error ? error.message : "Earthquake catalog unavailable",
      })),
      includeClimate
        ? getClimateSummary(latitude, longitude).catch((error: unknown) => ({
            error: error instanceof Error ? error.message : "Climate archive unavailable",
          }))
        : Promise.resolve(null),
    ]);

  const weather = "error" in (weatherResult as { error?: string })
    ? null
    : (weatherResult as WeatherBundle);
  const weatherError = ((weatherResult as { error?: string }).error ?? null) as string | null;

  const air = "error" in (airResult as { error?: string })
    ? null
    : (airResult as Awaited<ReturnType<typeof getAirQuality>>);
  const airError = ((airResult as { error?: string }).error ?? null) as string | null;

  const imagery = imageryResult as ImageryLayer[];
  const imageryError = imagery.length === 0 ? "No imagery availability could be verified." : null;

  const eventsBundle = eventsResult as EventsBundle | { error: string };
  const earthquakesBundle = earthquakesResult as EarthquakesBundle | { error: string };

  const events = "events" in eventsBundle ? eventsBundle.events : [];
  const earthquakes = "earthquakes" in earthquakesBundle ? earthquakesBundle.earthquakes : [];

  const eventsNearby = "events" in eventsBundle
    ? nearbyEvents(events, latitude, longitude, eventRadiusKm)
    : [];
  const earthquakesNearby = "earthquakes" in earthquakesBundle
    ? nearbyEarthquakes(earthquakes, latitude, longitude, earthquakeRadiusKm)
    : [];

  const climate = climateResult && !("error" in (climateResult as { error?: string }))
    ? (climateResult as ClimateBundle)
    : null;
  const climateError = (climateResult as { error?: string } | null)?.error ?? null;

  const coverageItems: CoverageItem[] = buildCoverage({
    latitude,
    longitude,
    weather,
    weatherError,
    air,
    airError,
    imagery,
    imageryError,
    events: "events" in eventsBundle ? eventsNearby : null,
    eventsError: (("error" in eventsBundle ? eventsBundle.error : null) ?? null) as string | null,
    earthquakes: "earthquakes" in earthquakesBundle ? earthquakesNearby : null,
    earthquakesError: (("error" in earthquakesBundle ? earthquakesBundle.error : null) ?? null) as string | null,
    climate,
    climateError,
  });

  const elevation = weather?.meta.elevationM ?? air?.meta.elevationM ?? null;
  const timezone = weather?.meta.timezone ?? air?.meta.timezone ?? "UTC";
  const utcOffsetSeconds = weather?.meta.utcOffsetSeconds ?? air?.meta.utcOffsetSeconds ?? 0;

  return {
    location: { latitude, longitude, elevationM: elevation, timezone, utcOffsetSeconds },
    retrievedAt: new Date().toISOString(),
    weather,
    weatherError,
    air,
    airError,
    imagery,
    imageryError,
    eventsNearby,
    eventsError: (("error" in eventsBundle ? eventsBundle.error : null) ?? null) as string | null,
    earthquakesNearby,
    earthquakesError: (("error" in earthquakesBundle ? earthquakesBundle.error : null) ?? null) as string | null,
    coverage: coverageItems,
    coverageDefinition: "Coverage index = share of core categories that returned data. It measures metadata availability, not accuracy.",
  };
}

export interface StatusSnapshot {
  generatedAt: string;
  providers: ReturnType<typeof getProviderStatuses>;
  cache: ReturnType<typeof cacheStats>;
  uptimeSeconds: number;
}

const startedAt = Date.now();

export function getStatusSnapshot(): StatusSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    providers: getProviderStatuses(),
    cache: cacheStats(),
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  };
}

export async function searchLocations(query: string): Promise<Place[]> {
  return searchPlaces(query, { count: 6 });
}

export type { Earthquake, ImageryLayer, NaturalEvent, Place };

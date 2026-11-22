import type { CoverageItem, Earthquake, ImageryLayer, NaturalEvent } from "@/lib/types";
import type { AirQualityBundle, ClimateBundle, WeatherBundle } from "./bundles";
import { haversineKm } from "@/lib/geo";
import { relativeFromNow } from "@/lib/time";

export const COVERAGE_DEFINITION =
  "Coverage index = share of the core data categories that returned data for this coordinate. It measures metadata availability, not measurement accuracy or spatial precision.";

interface CoverageInput {
  latitude: number;
  longitude: number;
  weather: WeatherBundle | null;
  weatherError: string | null;
  air: AirQualityBundle | null;
  airError: string | null;
  imagery: ImageryLayer[];
  imageryError: string | null;
  events: NaturalEvent[] | null;
  eventsError: string | null;
  earthquakes: Earthquake[] | null;
  earthquakesError: string | null;
  climate: ClimateBundle | null;
  climateError: string | null;
}

export function buildCoverage(input: CoverageInput): CoverageItem[] {
  const items: CoverageItem[] = [];

  items.push(
    input.weather
      ? {
          metric_id: "weather",
          label: "Weather forecast",
          status: "available",
          measurement_type: "forecast",
          source_id: "open-meteo",
          detail: `NWP forecast · ${input.weather.daily.length} days daily · hourly series · valid ${input.weather.current.validAt ?? "—"}`,
          freshness: relativeFromNow(input.weather.meta.validAt),
          coverageScore: 1,
        }
      : {
          metric_id: "weather",
          label: "Weather forecast",
          status: "unavailable",
          measurement_type: null,
          source_id: "open-meteo",
          detail: input.weatherError ?? "Forecast service returned no data.",
          freshness: null,
          coverageScore: 0,
        },
  );

  items.push(
    input.air
      ? {
          metric_id: "air_quality",
          label: "Air quality",
          status: "available",
          measurement_type: "modeled",
          source_id: "open-meteo-air",
          detail: "CAMS regional model · PM2.5, PM10, O₃, NO₂, CO, SO₂, dust · ≈40 km grid",
          freshness: relativeFromNow(input.air.meta.validAt),
          coverageScore: 1,
        }
      : {
          metric_id: "air_quality",
          label: "Air quality",
          status: "unavailable",
          measurement_type: null,
          source_id: "open-meteo-air",
          detail: input.airError ?? "Air-quality service returned no data.",
          freshness: null,
          coverageScore: 0,
        },
  );

  const latestImagery = input.imagery
    .flatMap((layer) => layer.availableDates)
    .sort()
    .at(-1);

  items.push(
    input.imagery.length > 0
      ? {
          metric_id: "satellite_imagery",
          label: "Satellite imagery",
          status: "available",
          measurement_type: "satellite-derived",
          source_id: "nasa-gibs",
          detail: `${input.imagery.length} verified GIBS layers · latest available ${latestImagery ?? "—"}`,
          freshness: latestImagery ? relativeFromNow(`${latestImagery}T12:00:00Z`) : null,
          coverageScore: 1,
        }
      : {
          metric_id: "satellite_imagery",
          label: "Satellite imagery",
          status: "unavailable",
          measurement_type: null,
          source_id: "nasa-gibs",
          detail: input.imageryError ?? "No imagery availability could be verified.",
          freshness: null,
          coverageScore: 0,
        },
  );

  items.push(
    input.events
      ? {
          metric_id: "natural_events",
          label: "Natural events",
          status: "available",
          measurement_type: "satellite-derived",
          source_id: "eonet",
          detail: `EONET open events · ${input.events.length} within 1,000 km`,
          freshness: relativeFromNow(
            [...input.events].map((e) => e.startedAt).filter(Boolean).sort().at(-1) ?? null,
          ),
          coverageScore: 1,
        }
      : {
          metric_id: "natural_events",
          label: "Natural events",
          status: "unavailable",
          measurement_type: null,
          source_id: "eonet",
          detail: input.eventsError ?? "Event service returned no data.",
          freshness: null,
          coverageScore: 0,
        },
  );

  items.push(
    input.earthquakes
      ? {
          metric_id: "earthquakes",
          label: "Earthquake catalog",
          status: "available",
          measurement_type: "observed",
          source_id: "usgs",
          detail: `USGS catalog · ${input.earthquakes.length} events ≥ M2.5 within 1,000 km (30 days)`,
          freshness: relativeFromNow(
            [...input.earthquakes].map((e) => e.time).sort().at(-1) ?? null,
          ),
          coverageScore: 1,
        }
      : {
          metric_id: "earthquakes",
          label: "Earthquake catalog",
          status: "unavailable",
          measurement_type: null,
          source_id: "usgs",
          detail: input.earthquakesError ?? "Earthquake service returned no data.",
          freshness: null,
          coverageScore: 0,
        },
  );

  items.push(
    input.climate
      ? {
          metric_id: "climate_normals",
          label: "Climate normals",
          status: "available",
          measurement_type: "historical-reconstruction",
          source_id: "open-meteo-archive",
          detail: `ERA5 daily · ${input.climate.baseline.startYear}–${input.climate.baseline.endYear} normals · ${input.climate.annual.length} annual values`,
          freshness: relativeFromNow(input.climate.meta.validAt),
          coverageScore: 1,
        }
      : {
          metric_id: "climate_normals",
          label: "Climate normals",
          status: input.climateError ? "partial" : "unavailable",
          measurement_type: null,
          source_id: "open-meteo-archive",
          detail:
            input.climateError ??
            "Historical reanalysis has not been requested for this coordinate yet.",
          freshness: null,
          coverageScore: 0,
        },
  );

  items.push({
    metric_id: "forest_change",
    label: "Forest change",
    status: "not-applicable",
    measurement_type: null,
    source_id: null,
    detail:
      "Global Forest Watch requires an authenticated API key and quota. EarthCore does not substitute proxy values.",
    freshness: null,
    coverageScore: null,
  });

  items.push({
    metric_id: "marine",
    label: "Sea state & sea level",
    status: "not-applicable",
    measurement_type: null,
    source_id: null,
    detail: "Marine and hydrological models are not integrated in this release.",
    freshness: null,
    coverageScore: null,
  });

  return items;
}

export function coverageIndex(items: CoverageItem[]): number | null {
  const scored = items.filter((item) => item.coverageScore !== null);
  if (scored.length === 0) return null;
  return Math.round((scored.reduce((sum, item) => sum + (item.coverageScore ?? 0), 0) / scored.length) * 100);
}

/** Events within `radiusKm` of the selected coordinate, nearest first. */
export function nearbyEvents(
  events: NaturalEvent[],
  latitude: number,
  longitude: number,
  radiusKm = 1000,
): (NaturalEvent & { distanceKm: number })[] {
  return events
    .filter((event) => event.point)
    .map((event) => ({
      ...event,
      distanceKm: Math.round(
        haversineKm({ latitude, longitude }, { latitude: event.point!.latitude, longitude: event.point!.longitude }),
      ),
    }))
    .filter((event) => event.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Earthquakes within `radiusKm`, largest magnitude first. */
export function nearbyEarthquakes(
  earthquakes: Earthquake[],
  latitude: number,
  longitude: number,
  radiusKm = 1000,
): (Earthquake & { distanceKm: number })[] {
  return earthquakes
    .map((quake) => ({
      ...quake,
      distanceKm: Math.round(
        haversineKm({ latitude, longitude }, { latitude: quake.latitude, longitude: quake.longitude }),
      ),
    }))
    .filter((quake) => quake.distanceKm <= radiusKm)
    .sort((a, b) => (b.magnitude ?? 0) - (a.magnitude ?? 0));
}

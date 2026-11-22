import type { ProviderInfo } from "@/lib/types";
import { getProviderHealth } from "./health";

/**
 * The provider registry is the single source of truth for what EarthCore
 * integrates. `/sources`, `/status` and the coverage engine all read from it,
 * so a provider cannot be described one way in the UI and another in the data
 * layer.
 */
export const PROVIDER_REGISTRY: ProviderInfo[] = [
  {
    id: "open-meteo",
    name: "Open-Meteo Forecast API",
    shortName: "Open-Meteo Weather",
    documentationUrl: "https://open-meteo.com/en/docs",
    homepage: "https://open-meteo.com",
    description:
      "Hourly and daily numerical weather prediction for any coordinate on Earth, served from a global model blend.",
    metrics: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "precipitation",
      "cloud_cover",
      "pressure_msl",
      "surface_pressure",
      "uv_index",
      "weather_code",
    ],
    geographicCoverage: "Global",
    temporalCoverage: "Hourly and daily, up to 16 days ahead",
    dataTypes: ["forecast", "modeled"],
    authentication: "none",
    licensing: "Open-Meteo free tier for non-commercial use (CC BY 4.0). Commercial use requires a paid subscription.",
    attribution: "Weather data by Open-Meteo.com",
    refreshExpectation: "Forecast model update cycles; cached 10 minutes server-side.",
    resolution: "NWP model grid — km-scale grid cell",
    status: "unverified",
    notes:
      "Values describe the model grid cell, not a point observation. Open-Meteo's best_match blends several global models.",
  },
  {
    id: "open-meteo-air",
    name: "Open-Meteo Air Quality API",
    shortName: "Open-Meteo Air Quality",
    documentationUrl: "https://open-meteo.com/en/docs/air-quality-api",
    homepage: "https://open-meteo.com/en/docs/air-quality-api",
    description:
      "Regional atmospheric-composition forecasts for particulate matter and trace gases, plus provider-computed air-quality indices.",
    metrics: [
      "pm2_5",
      "pm10",
      "ozone",
      "nitrogen_dioxide",
      "carbon_monoxide",
      "sulphur_dioxide",
      "dust",
      "us_aqi",
      "european_aqi",
      "uv_index",
    ],
    geographicCoverage: "Global (regional model)",
    temporalCoverage: "Hourly, about 3–5 days ahead",
    dataTypes: ["modeled", "forecast"],
    authentication: "none",
    licensing: "Open-Meteo free tier for non-commercial use (CC BY 4.0).",
    attribution: "Air quality data by Open-Meteo.com, based on CAMS",
    refreshExpectation: "CAMS update cycle; cached 15 minutes server-side.",
    resolution: "≈40 km regional model grid",
    status: "unverified",
    notes:
      "Coarse regional model output. It can differ substantially from a nearby regulatory ground monitor.",
  },
  {
    id: "open-meteo-geo",
    name: "Open-Meteo Geocoding API",
    shortName: "Open-Meteo Geocoding",
    documentationUrl: "https://open-meteo.com/en/docs/geocoding-api",
    homepage: "https://open-meteo.com/en/docs/geocoding-api",
    description: "Worldwide place lookup with administrative context, elevation and population.",
    metrics: [],
    geographicCoverage: "Global",
    temporalCoverage: "Reference data",
    dataTypes: [],
    authentication: "none",
    licensing: "Open-Meteo free tier for non-commercial use.",
    attribution: "Geocoding by Open-Meteo.com",
    refreshExpectation: "Static reference; cached 6 hours.",
    resolution: null,
    status: "unverified",
    notes: "Ambiguous names return several candidates; EarthCore shows them all rather than guessing.",
  },
  {
    id: "eonet",
    name: "NASA Earth Observatory Natural Event Tracker",
    shortName: "NASA EONET",
    documentationUrl: "https://eonet.gsfc.nasa.gov/docs/v3",
    homepage: "https://eonet.gsfc.nasa.gov",
    description:
      "Curated natural-event records with point geometries, categories, source links and open/closed status.",
    metrics: [],
    geographicCoverage: "Global",
    temporalCoverage: "Event records, typically days to months",
    dataTypes: ["satellite-derived"],
    authentication: "none",
    licensing: "NASA open data, publicly available.",
    attribution: "NASA EONET",
    refreshExpectation: "Event feed updated as sources publish; cached 15 minutes.",
    resolution: "Point geometry per event record",
    status: "unverified",
    notes:
      "EONET aggregates event notifications. It is not a hazard forecast and does not provide official warnings.",
  },
  {
    id: "usgs",
    name: "USGS Earthquake Hazards Program",
    shortName: "USGS Earthquakes",
    documentationUrl: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/",
    homepage: "https://earthquake.usgs.gov",
    description:
      "Near-real-time earthquake event feed with magnitude, depth, location, status and official event pages.",
    metrics: ["earthquake_magnitude"],
    geographicCoverage: "Global",
    temporalCoverage: "Event catalog, near real time",
    dataTypes: ["observed"],
    authentication: "none",
    licensing: "USGS public domain data.",
    attribution: "U.S. Geological Survey",
    refreshExpectation: "Feed refreshed every few minutes; cached 5 minutes.",
    resolution: "Point epicentre",
    status: "unverified",
    notes:
      "Earthquakes are geological events. EarthCore does not present them as climate indicators. Preliminary magnitudes can be revised.",
  },
  {
    id: "nasa-gibs",
    name: "NASA Global Imagery Browse Services",
    shortName: "NASA GIBS",
    documentationUrl: "https://nasa-gibs.github.io/gibs-api-docs/",
    homepage: "https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs",
    description:
      "Time-aware satellite imagery and science visualisations through standards-compliant WMTS/XYZ tile services.",
    metrics: ["ndvi", "cloud_fraction"],
    geographicCoverage: "Global",
    temporalCoverage: "Daily from 2000 (product dependent)",
    dataTypes: ["satellite-derived"],
    authentication: "none",
    licensing: "NASA open data, publicly available.",
    attribution: "Imagery courtesy NASA GIBS, part of NASA EOSDIS",
    refreshExpectation: "Daily products, typically 1–2 days latency; availability resolved per layer.",
    resolution: "250 m – 3 km product resolution",
    status: "unverified",
    notes:
      "Availability windows are read from GIBS DescribeDomains. Layers that cannot be verified are not offered.",
  },
  {
    id: "gistemp",
    name: "NASA GISTEMP v4",
    shortName: "NASA GISTEMP",
    documentationUrl: "https://data.giss.nasa.gov/gistemp/",
    homepage: "https://www.giss.nasa.gov/research/briefs/hansen_11/",
    description:
      "Global land-ocean temperature index: monthly and annual anomalies relative to 1951–1980.",
    metrics: [],
    geographicCoverage: "Global mean",
    temporalCoverage: "1880 – present",
    dataTypes: ["historical-reconstruction", "calculated"],
    authentication: "none",
    licensing: "NASA public data.",
    attribution: "NASA Goddard Institute for Space Studies",
    refreshExpectation: "Monthly publication; cached 6 hours.",
    resolution: "Global mean index",
    status: "unverified",
    notes:
      "A global index cannot be attributed to any single city. EarthCore keeps it separate from local reanalysis.",
  },
  {
    id: "open-meteo-archive",
    name: "Open-Meteo Historical Weather API",
    shortName: "Open-Meteo Archive",
    documentationUrl: "https://open-meteo.com/en/docs/historical-weather-api",
    homepage: "https://open-meteo.com/en/docs/historical-weather-api",
    description:
      "ERA5-based daily historical series used for 1991–2020 climate normals and local long-term trends.",
    metrics: ["temperature_2m", "precipitation"],
    geographicCoverage: "Global (gridded reanalysis)",
    temporalCoverage: "1940 – present",
    dataTypes: ["historical-reconstruction"],
    authentication: "none",
    licensing: "Open-Meteo free tier for non-commercial use; ERA5 © Copernicus EMS.",
    attribution: "Historical weather data by Open-Meteo.com, based on ERA5 (Copernicus)",
    refreshExpectation: "Updated daily with several days' lag; cached 12 hours.",
    resolution: "ERA5 grid (~25 km)",
    status: "unverified",
    notes:
      "Reanalysis is a model reconstruction constrained by observations, not a station measurement at the coordinate.",
  },
  {
    id: "gfw",
    name: "Global Forest Watch API",
    shortName: "Global Forest Watch",
    documentationUrl: "https://www.globalforestwatch.org/help/",
    homepage: "https://www.globalforestwatch.org",
    description:
      "Forest-change alerts, tree-cover loss and land-cover statistics. Requires an API key and has request quotas.",
    metrics: [],
    geographicCoverage: "Global",
    temporalCoverage: "Annual and near-real-time alerts",
    dataTypes: ["satellite-derived"],
    authentication: "api-key",
    licensing: "GFW API terms; registration required.",
    attribution: "Global Forest Watch / WRI",
    refreshExpectation: "Not integrated",
    resolution: "30 m (product dependent)",
    status: "planned",
    notes:
      "Not connected: a keyless, documented public endpoint for forest change is not available, so EarthCore reports ecosystem metrics as unavailable instead of inventing them.",
  },
  {
    id: "copernicus-cds",
    name: "Copernicus Climate Data Store",
    shortName: "Copernicus CDS",
    documentationUrl: "https://cds.climate.copernicus.eu/",
    homepage: "https://cds.climate.copernicus.eu/",
    description:
      "ERA5 reanalysis, seasonal forecasts and climate indicators. Requires a Copernicus account and an API key.",
    metrics: [],
    geographicCoverage: "Global",
    temporalCoverage: "1940 – present",
    dataTypes: ["historical-reconstruction"],
    authentication: "api-key",
    licensing: "Copernicus licence; registration required.",
    attribution: "Copernicus Climate Change Service",
    refreshExpectation: "Not integrated",
    resolution: "Product dependent",
    status: "planned",
    notes: "Not connected. EarthCore currently reaches ERA5 through Open-Meteo's documented public API instead.",
  },
  {
    id: "open-meteo-marine",
    name: "Open-Meteo Marine API",
    shortName: "Open-Meteo Marine",
    documentationUrl: "https://open-meteo.com/en/docs/marine-weather-api",
    homepage: "https://open-meteo.com/en/docs/marine-weather-api",
    description: "Wave height, period, direction and sea-surface temperature forecasts.",
    metrics: [],
    geographicCoverage: "Global oceans",
    temporalCoverage: "Hourly forecast",
    dataTypes: ["modeled", "forecast"],
    authentication: "none",
    licensing: "Open-Meteo free tier for non-commercial use.",
    attribution: "Marine data by Open-Meteo.com",
    refreshExpectation: "Not integrated",
    resolution: "Model grid",
    status: "planned",
    notes: "Planned for a later release; not shown as available anywhere in the interface.",
  },
];

export const PROVIDER_IDS = PROVIDER_REGISTRY.map((provider) => provider.id);

export function getProviderInfo(id: string): ProviderInfo | null {
  return PROVIDER_REGISTRY.find((provider) => provider.id === id) ?? null;
}

export interface ProviderStatus extends ProviderInfo {
  runtime: {
    observed: boolean;
    calls: number;
    successes: number;
    failures: number;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    lastError: string | null;
    lastLatencyMs: number | null;
    averageLatencyMs: number | null;
  };
}

/**
 * Merge static registry metadata with observed runtime health. A provider that
 * has never been called in this process is reported as *unverified*, not as
 * operational.
 */
export function getProviderStatuses(): ProviderStatus[] {
  const health = new Map(getProviderHealth().map((entry) => [entry.id, entry]));
  return PROVIDER_REGISTRY.map((provider) => {
    const runtime = health.get(provider.id);
    const observed = Boolean(runtime && runtime.calls > 0);
    const failedRecently = runtime ? runtime.lastFailureAt && (!runtime.lastSuccessAt || runtime.lastFailureAt > runtime.lastSuccessAt) : false;
    return {
      ...provider,
      status:
        provider.status === "planned"
          ? "planned"
          : !observed
            ? "unverified"
            : failedRecently
              ? "degraded"
              : "operational",
      runtime: {
        observed,
        calls: runtime?.calls ?? 0,
        successes: runtime?.successes ?? 0,
        failures: runtime?.failures ?? 0,
        lastSuccessAt: runtime?.lastSuccessAt ?? null,
        lastFailureAt: runtime?.lastFailureAt ?? null,
        lastError: runtime?.lastError ?? null,
        lastLatencyMs: runtime?.lastLatencyMs ?? null,
        averageLatencyMs: runtime?.averageLatencyMs ?? null,
      },
    };
  });
}

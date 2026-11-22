/**
 * EarthCore domain model.
 *
 * EarthCore deliberately keeps four distinct domain shapes instead of forcing
 * every provider into a single "measurement" record:
 *  - PointMeasurement  (weather, air quality, elevation, climate series)
 *  - ImageryLayer      (time-aware satellite rasters from NASA GIBS)
 *  - NaturalEvent      (EONET event geometries with status + magnitude)
 *  - Earthquake        (USGS event catalog entries)
 *
 * Metadata that a provider does not supply stays explicitly `null` — it is never
 * inferred, defaulted or fabricated.
 */

export type MeasurementClass =
  | "observed"
  | "modeled"
  | "forecast"
  | "satellite-derived"
  | "historical-reconstruction"
  | "calculated"
  | "scenario";

export type QualityFlag =
  | "model-grid"
  | "stale"
  | "partial-coverage"
  | "indicative-derivation"
  | "scenario-dependent"
  | "nearest-grid-cell";

export type Unit =
  | "°C"
  | "°F"
  | "K"
  | "%"
  | "km/h"
  | "m/s"
  | "mph"
  | "mm"
  | "hPa"
  | "inHg"
  | "µg/m³"
  | "m"
  | "km"
  | "°"
  | "index"
  | "acres"
  | "km²"
  | "kg/m²"
  | "cm";

export interface MetricDefinition {
  id: string;
  label: string;
  shortLabel: string;
  unit: Unit;
  group: "weather" | "air" | "climate" | "surface" | "geology" | "solar";
  description: string;
  /** Higher is worse / more intense — used only for display, never for scoring. */
  direction?: "higher-worse" | "higher-better" | "neutral";
}

export const METRICS: Record<string, MetricDefinition> = {
  temperature_2m: {
    id: "temperature_2m",
    label: "Air temperature",
    shortLabel: "Temperature",
    unit: "°C",
    group: "weather",
    description: "Modelled 2-metre air temperature.",
  },
  apparent_temperature: {
    id: "apparent_temperature",
    label: "Apparent temperature",
    shortLabel: "Feels like",
    unit: "°C",
    group: "weather",
    description: "Perceived temperature accounting for humidity and wind.",
  },
  relative_humidity_2m: {
    id: "relative_humidity_2m",
    label: "Relative humidity",
    shortLabel: "Humidity",
    unit: "%",
    group: "weather",
    description: "Relative humidity at 2 metres above the model surface.",
  },
  wind_speed_10m: {
    id: "wind_speed_10m",
    label: "Wind speed",
    shortLabel: "Wind",
    unit: "km/h",
    group: "weather",
    description: "Modelled wind speed at 10 metres.",
  },
  wind_direction_10m: {
    id: "wind_direction_10m",
    label: "Wind direction",
    shortLabel: "Wind direction",
    unit: "°",
    group: "weather",
    description: "Meteorological wind direction (direction the wind comes from).",
  },
  wind_gusts_10m: {
    id: "wind_gusts_10m",
    label: "Wind gusts",
    shortLabel: "Gusts",
    unit: "km/h",
    group: "weather",
    description: "Modelled wind gust speed at 10 metres.",
  },
  precipitation: {
    id: "precipitation",
    label: "Precipitation",
    shortLabel: "Precipitation",
    unit: "mm",
    group: "weather",
    description: "Liquid water equivalent of precipitation.",
  },
  rain: {
    id: "rain",
    label: "Rain",
    shortLabel: "Rain",
    unit: "mm",
    group: "weather",
    description: "Rainfall as liquid water equivalent.",
  },
  snowfall: {
    id: "snowfall",
    label: "Snowfall",
    shortLabel: "Snowfall",
    unit: "cm",
    group: "weather",
    description: "Snowfall as snow depth equivalent.",
  },
  cloud_cover: {
    id: "cloud_cover",
    label: "Cloud cover",
    shortLabel: "Clouds",
    unit: "%",
    group: "weather",
    description: "Percentage of the sky covered by cloud.",
  },
  pressure_msl: {
    id: "pressure_msl",
    label: "Mean sea-level pressure",
    shortLabel: "Pressure",
    unit: "hPa",
    group: "weather",
    description: "Atmospheric pressure reduced to mean sea level.",
  },
  surface_pressure: {
    id: "surface_pressure",
    label: "Surface pressure",
    shortLabel: "Surface pressure",
    unit: "hPa",
    group: "weather",
    description: "Atmospheric pressure at the model surface.",
  },
  uv_index: {
    id: "uv_index",
    label: "UV index",
    shortLabel: "UV index",
    unit: "index",
    group: "weather",
    description: "Modelled ultraviolet index at the surface.",
    direction: "higher-worse",
  },
  weather_code: {
    id: "weather_code",
    label: "Weather condition",
    shortLabel: "Conditions",
    unit: "index",
    group: "weather",
    description: "WMO weather interpretation code.",
  },
  pm2_5: {
    id: "pm2_5",
    label: "PM2.5",
    shortLabel: "PM2.5",
    unit: "µg/m³",
    group: "air",
    description: "Fine particulate matter with a diameter of 2.5 µm or less.",
    direction: "higher-worse",
  },
  pm10: {
    id: "pm10",
    label: "PM10",
    shortLabel: "PM10",
    unit: "µg/m³",
    group: "air",
    description: "Particulate matter with a diameter of 10 µm or less.",
    direction: "higher-worse",
  },
  ozone: {
    id: "ozone",
    label: "Ozone",
    shortLabel: "Ozone",
    unit: "µg/m³",
    group: "air",
    description: "Tropospheric ozone concentration.",
    direction: "higher-worse",
  },
  nitrogen_dioxide: {
    id: "nitrogen_dioxide",
    label: "Nitrogen dioxide",
    shortLabel: "NO₂",
    unit: "µg/m³",
    group: "air",
    description: "Nitrogen dioxide concentration.",
    direction: "higher-worse",
  },
  carbon_monoxide: {
    id: "carbon_monoxide",
    label: "Carbon monoxide",
    shortLabel: "CO",
    unit: "µg/m³",
    group: "air",
    description: "Carbon monoxide concentration.",
    direction: "higher-worse",
  },
  sulphur_dioxide: {
    id: "sulphur_dioxide",
    label: "Sulphur dioxide",
    shortLabel: "SO₂",
    unit: "µg/m³",
    group: "air",
    description: "Sulphur dioxide concentration.",
    direction: "higher-worse",
  },
  dust: {
    id: "dust",
    label: "Dust",
    shortLabel: "Dust",
    unit: "µg/m³",
    group: "air",
    description: "Mineral dust aerosol concentration.",
    direction: "higher-worse",
  },
  elevation: {
    id: "elevation",
    label: "Elevation",
    shortLabel: "Elevation",
    unit: "m",
    group: "surface",
    description: "Model grid-cell surface elevation.",
  },
  aqi_pm25: {
    id: "aqi_pm25",
    label: "AQI (PM2.5, US EPA)",
    shortLabel: "AQI",
    unit: "index",
    group: "air",
    description:
      "Indicative US EPA air-quality index computed from the PM2.5 concentration using published breakpoints. The EPA index is defined on a 24-hour average, so a value derived from a single hour is indicative only.",
    direction: "higher-worse",
  },
  earthquake_magnitude: {
    id: "earthquake_magnitude",
    label: "Earthquake magnitude",
    shortLabel: "Magnitude",
    unit: "index",
    group: "geology",
    description: "USGS-reported earthquake magnitude.",
  },
  ndvi: {
    id: "ndvi",
    label: "Vegetation index (NDVI)",
    shortLabel: "NDVI",
    unit: "index",
    group: "surface",
    description: "Normalised difference vegetation index from MODIS.",
    direction: "higher-better",
  },
};

export interface PointMeasurement {
  metric_id: string;
  source_id: string;
  dataset_id: string;
  value: number | null;
  unit: Unit;
  latitude: number | null;
  longitude: number | null;
  coverage_geometry: null;
  spatial_resolution: string | null;
  measurement_type: MeasurementClass;
  valid_at: string | null;
  retrieved_at: string;
  forecast_horizon_hours: number | null;
  quality_flags: QualityFlag[];
  attribution: string;
  source_url: string;
  label: string;
}

export interface MetricSeriesPoint {
  /** ISO-8601 UTC instant. */
  t: string;
  v: number | null;
}

export interface MetricSeries {
  metric_id: string;
  unit: Unit;
  measurement_type: MeasurementClass;
  source_id: string;
  label: string;
  points: MetricSeriesPoint[];
  valid_from: string | null;
  valid_to: string | null;
  quality_flags: QualityFlag[];
  note: string | null;
}

export interface Place {
  id: string;
  name: string;
  country: string | null;
  countryCode: string | null;
  admin1: string | null;
  admin2: string | null;
  latitude: number;
  longitude: number;
  elevation: number | null;
  timezone: string | null;
  population: number | null;
  featureCode: string | null;
}

export interface ProviderInfo {
  id: string;
  name: string;
  shortName: string;
  documentationUrl: string;
  homepage: string;
  description: string;
  metrics: string[];
  geographicCoverage: string;
  temporalCoverage: string;
  dataTypes: MeasurementClass[];
  authentication: "none" | "api-key";
  licensing: string;
  attribution: string;
  refreshExpectation: string;
  resolution: string | null;
  status: "operational" | "degraded" | "unverified" | "planned";
  notes: string | null;
}

export interface ImageryLayer {
  id: string;
  title: string;
  variable: string;
  description: string;
  source_id: string;
  dataset_id: string;
  tileMatrixSet: string;
  format: "jpg" | "png";
  /** `{date}`, `{z}`, `{y}`, `{x}` placeholders (GIBS uses z/y/x order). */
  tileUrlTemplate: string;
  cadence: "daily" | "8-day" | "static";
  temporalCoverage: { start: string | null; end: string | null };
  /** ISO dates that the service actually has data for, newest last. */
  availableDates: string[];
  resolution: string | null;
  measurement_type: MeasurementClass;
  attribution: string;
  source_url: string;
  legend: { kind: "qualitative" | "none"; text: string };
}

export interface NaturalEvent {
  id: string;
  title: string;
  category: { id: string; title: string };
  status: "open" | "closed";
  description: string | null;
  link: string;
  sources: { id: string; url: string }[];
  geometry: {
    date: string | null;
    type: string;
    coordinates: [number, number] | [number, number, number];
    magnitudeValue: number | null;
    magnitudeUnit: string | null;
  }[];
  /** Most recent geometry entry, used for map placement. */
  point: { longitude: number; latitude: number } | null;
  startedAt: string | null;
  closedAt: string | null;
  magnitude: number | null;
  magnitudeUnit: string | null;
}

export interface Earthquake {
  id: string;
  magnitude: number | null;
  magnitudeType: string | null;
  place: string;
  time: string;
  updated: string;
  depthKm: number | null;
  longitude: number;
  latitude: number;
  url: string;
  status: "automatic" | "reviewed" | "deleted";
  tsunami: number | null;
  significance: number | null;
  feltReports: number | null;
}

export interface ClimateSummary {
  location: { latitude: number; longitude: number; label: string };
  baseline: { startYear: number; endYear: number; label: string };
  annual: { year: number; value: number | null; precipitationMm: number | null }[];
  monthlyNormals: { month: number; label: string; temperatureC: number | null; precipitationMm: number | null }[];
  recentAnnual: { year: number; value: number | null }[];
  trendCPerDecade: number | null;
  source: {
    id: string;
    name: string;
    dataset: string;
    url: string;
    attribution: string;
  };
  note: string;
}

export interface CoverageItem {
  metric_id: string;
  label: string;
  status: "available" | "partial" | "unavailable" | "not-applicable";
  measurement_type: MeasurementClass | null;
  source_id: string | null;
  detail: string;
  freshness: string | null;
  coverageScore: number | null;
}

import type {
  Earthquake,
  ImageryLayer,
  MeasurementClass,
  MetricSeries,
  NaturalEvent,
  QualityFlag,
} from "@/lib/types";

export interface SourceMeta {
  providerId: string;
  providerName: string;
  dataset: string;
  model: string;
  attribution: string;
  sourceUrl: string;
  measurementType: MeasurementClass;
  /** True UTC instant of the most recent value, or null when unavailable. */
  validAt: string | null;
  retrievedAt: string;
  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;
  elevationM: number | null;
  spatialResolution: string | null;
  qualityFlags: QualityFlag[];
  note: string | null;
}

export interface CurrentConditions {
  validAt: string | null;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPct: number | null;
  windSpeedKmh: number | null;
  windGustsKmh: number | null;
  windDirectionDeg: number | null;
  precipitationMm: number | null;
  rainMm: number | null;
  snowfallCm: number | null;
  cloudCoverPct: number | null;
  pressureMslHpa: number | null;
  surfacePressureHpa: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
}

export interface DailyForecast {
  date: string;
  validAt: string | null;
  tMaxC: number | null;
  tMinC: number | null;
  apparentMaxC: number | null;
  apparentMinC: number | null;
  weatherCode: number | null;
  precipitationSumMm: number | null;
  precipitationProbabilityPct: number | null;
  windMaxKmh: number | null;
  uvMax: number | null;
  sunriseLocal: string | null;
  sunsetLocal: string | null;
}

export interface HourlyBlock {
  timesLocal: string[];
  instants: string[];
  temperatureC: (number | null)[];
  apparentC: (number | null)[];
  precipitationMm: (number | null)[];
  precipitationProbabilityPct: (number | null)[];
  windSpeedKmh: (number | null)[];
  humidityPct: (number | null)[];
  uvIndex: (number | null)[];
  cloudCoverPct: (number | null)[];
}

export interface WeatherBundle {
  kind: "weather";
  current: CurrentConditions;
  hourly: HourlyBlock;
  daily: DailyForecast[];
  series: MetricSeries[];
  meta: SourceMeta;
}

export interface AirQualityBundle {
  kind: "air-quality";
  current: {
    validAt: string | null;
    pm25: number | null;
    pm10: number | null;
    ozone: number | null;
    nitrogenDioxide: number | null;
    carbonMonoxide: number | null;
    sulphurDioxide: number | null;
    dust: number | null;
    usAqi: number | null;
    europeanAqi: number | null;
    uvIndex: number | null;
  };
  hourly: {
    timesLocal: string[];
    instants: string[];
    pm25: (number | null)[];
    pm10: (number | null)[];
    ozone: (number | null)[];
  };
  series: MetricSeries[];
  meta: SourceMeta;
}

export interface ClimateBundle {
  kind: "climate";
  location: { latitude: number; longitude: number };
  baseline: { startYear: number; endYear: number };
  annual: { year: number; temperatureC: number | null; precipitationMm: number | null }[];
  monthly: {
    month: number;
    label: string;
    temperatureC: number | null;
    precipitationMm: number | null;
  }[];
  recent: { year: number; temperatureC: number | null }[];
  trendCPerDecade: number | null;
  series: MetricSeries[];
  meta: SourceMeta;
}

export interface LocationContext {
  latitude: number;
  longitude: number;
  elevationM: number | null;
  timezone: string;
  utcOffsetSeconds: number;
}

export interface LocationIntelligence {
  location: LocationContext;
  retrievedAt: string;
  weather: WeatherBundle | null;
  weatherError: string | null;
  air: AirQualityBundle | null;
  airError: string | null;
  imagery: ImageryLayer[];
  imageryError: string | null;
  eventsNearby: NaturalEvent[];
  eventsError: string | null;
  earthquakesNearby: Earthquake[];
  earthquakesError: string | null;
  coverage: import("@/lib/types").CoverageItem[];
  coverageDefinition: string;
}

export interface EventsBundle {
  events: NaturalEvent[];
  categories: { id: string; title: string }[];
  retrievedAt: string;
  sourceValidAt: string | null;
  note: string;
  error?: string;
}

export interface EarthquakesBundle {
  earthquakes: Earthquake[];
  retrievedAt: string;
  generatedAt: string | null;
  note: string;
  error?: string;
}

export interface GlobalTemperaturePoint {
  year: number;
  /** Annual anomaly vs the 1951–1980 baseline, in °C. */
  anomalyC: number | null;
  /** Northern-hemisphere meteorological winter (DJF). */
  djfC: number | null;
  /** December–November mean. */
  dnC: number | null;
}

export interface GlobalTemperatureBundle {
  points: GlobalTemperaturePoint[];
  baselineLabel: string;
  dataset: string;
  attribution: string;
  sourceUrl: string;
  retrievedAt: string;
  note: string;
}

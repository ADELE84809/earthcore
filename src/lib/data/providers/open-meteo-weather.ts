import { z } from "zod";
import { cached } from "../cache";
import { fetchJson } from "../http";
import { asNullableNumberArray, asNumber, asStringArray, roundAt } from "../parse";
import { localTimeToIso } from "@/lib/time";
import type { MetricSeries, QualityFlag } from "@/lib/types";
import type { DailyForecast, SourceMeta, WeatherBundle } from "../bundles";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";
export const OPEN_METEO_DOC = "https://open-meteo.com/en/docs";

const CURRENT_VARS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "is_day",
  "precipitation",
  "rain",
  "snowfall",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "surface_pressure",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
] as const;

const HOURLY_VARS = [
  "temperature_2m",
  "apparent_temperature",
  "precipitation_probability",
  "precipitation",
  "wind_speed_10m",
  "relative_humidity_2m",
  "uv_index",
  "cloud_cover",
] as const;

const DAILY_VARS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "sunrise",
  "sunset",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "uv_index_max",
] as const;

const rawSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  generationtime_ms: z.number().optional(),
  timezone: z.string().optional(),
  timezone_abbreviation: z.string().optional(),
  utc_offset_seconds: z.number().optional(),
  current: z.record(z.string(), z.unknown()).optional(),
  hourly: z.record(z.string(), z.array(z.unknown())).optional(),
  daily: z.record(z.string(), z.array(z.unknown())).optional(),
});

type RawForecast = z.infer<typeof rawSchema>;

export function buildWeatherUrl(latitude: number, longitude: number, forecastDays = 8): string {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: CURRENT_VARS.join(","),
    hourly: HOURLY_VARS.join(","),
    daily: DAILY_VARS.join(","),
    timezone: "auto",
    forecast_days: String(Math.min(16, Math.max(1, forecastDays))),
    wind_speed_unit: "kmh",
  });
  return `${BASE_URL}?${params.toString()}`;
}

const qualityFlags: QualityFlag[] = ["model-grid"];

export function normalizeWeather(raw: RawForecast, retrievedAt: string): WeatherBundle {
  const offset = raw.utc_offset_seconds ?? 0;
  const timezone = raw.timezone ?? "UTC";
  const current = raw.current ?? {};
  const hourly = raw.hourly ?? {};
  const daily = raw.daily ?? {};

  const hourlyTimes = asStringArray(hourly.time);
  const instants = hourlyTimes.map((t) => localTimeToIso(t, offset)).filter((v): v is string => !!v);

  const dailyTimes = asStringArray(daily.time);
  const sunrise = asStringArray(daily.sunrise);
  const sunset = asStringArray(daily.sunset);

  const dailyForecasts: DailyForecast[] = dailyTimes.map((date, index) => ({
    date,
    validAt: localTimeToIso(date, offset),
    tMaxC: asNullableNumberArray(daily.temperature_2m_max)[index] ?? null,
    tMinC: asNullableNumberArray(daily.temperature_2m_min)[index] ?? null,
    apparentMaxC: asNullableNumberArray(daily.apparent_temperature_max)[index] ?? null,
    apparentMinC: asNullableNumberArray(daily.apparent_temperature_min)[index] ?? null,
    weatherCode: asNullableNumberArray(daily.weather_code)[index] ?? null,
    precipitationSumMm: asNullableNumberArray(daily.precipitation_sum)[index] ?? null,
    precipitationProbabilityPct: asNullableNumberArray(daily.precipitation_probability_max)[index] ?? null,
    windMaxKmh: asNullableNumberArray(daily.wind_speed_10m_max)[index] ?? null,
    uvMax: asNullableNumberArray(daily.uv_index_max)[index] ?? null,
    sunriseLocal: sunrise[index] ?? null,
    sunsetLocal: sunset[index] ?? null,
  }));

  const temperatureC = asNullableNumberArray(hourly.temperature_2m);
  const apparentC = asNullableNumberArray(hourly.apparent_temperature);
  const precipitationMm = asNullableNumberArray(hourly.precipitation);
  const precipitationProbabilityPct = asNullableNumberArray(hourly.precipitation_probability);
  const windSpeedKmh = asNullableNumberArray(hourly.wind_speed_10m);
  const humidityPct = asNullableNumberArray(hourly.relative_humidity_2m);
  const uvIndex = asNullableNumberArray(hourly.uv_index);
  const cloudCoverPct = asNullableNumberArray(hourly.cloud_cover);

  const toSeries = (
    metricId: string,
    values: (number | null)[],
    label: string,
    unit: MetricSeries["unit"],
  ): MetricSeries => ({
    metric_id: metricId,
    unit,
    measurement_type: "forecast",
    source_id: "open-meteo",
    label,
    points: instants.map((t, i) => ({ t, v: values[i] ?? null })),
    valid_from: instants[0] ?? null,
    valid_to: instants[instants.length - 1] ?? null,
    quality_flags: [...qualityFlags],
    note: "Hourly model forecast. Values are grid-cell estimates, not point observations.",
  });

  const currentTimeRaw = typeof current.time === "string" ? current.time : null;
  const currentValidAt = currentTimeRaw ? localTimeToIso(currentTimeRaw, offset) : null;

  const meta: SourceMeta = {
    providerId: "open-meteo",
    providerName: "Open-Meteo",
    dataset: "Forecast API · best_match",
    model: "Open-Meteo best_match (global NWP blend)",
    attribution: "Weather data by Open-Meteo.com (CC BY 4.0)",
    sourceUrl: OPEN_METEO_DOC,
    measurementType: "forecast",
    validAt: currentValidAt,
    retrievedAt,
    timezone,
    timezoneAbbreviation: raw.timezone_abbreviation ?? timezone,
    utcOffsetSeconds: offset,
    elevationM: asNumber(raw.elevation),
    spatialResolution: "NWP model grid — km-scale grid cell, not a point observation",
    qualityFlags: [...qualityFlags],
    note: "Current conditions are model values for the grid cell containing the coordinate; they are not a station observation.",
  };

  return {
    kind: "weather",
    current: {
      validAt: currentValidAt,
      temperatureC: asNumber(current.temperature_2m),
      apparentTemperatureC: asNumber(current.apparent_temperature),
      humidityPct: asNumber(current.relative_humidity_2m),
      windSpeedKmh: asNumber(current.wind_speed_10m),
      windGustsKmh: asNumber(current.wind_gusts_10m),
      windDirectionDeg: asNumber(current.wind_direction_10m),
      precipitationMm: asNumber(current.precipitation),
      rainMm: asNumber(current.rain),
      snowfallCm: asNumber(current.snowfall),
      cloudCoverPct: asNumber(current.cloud_cover),
      pressureMslHpa: asNumber(current.pressure_msl),
      surfacePressureHpa: asNumber(current.surface_pressure),
      weatherCode: asNumber(current.weather_code),
      isDay: asNumber(current.is_day) === null ? null : asNumber(current.is_day) === 1,
    },
    hourly: {
      timesLocal: hourlyTimes,
      instants,
      temperatureC,
      apparentC,
      precipitationMm,
      precipitationProbabilityPct,
      windSpeedKmh,
      humidityPct,
      uvIndex,
      cloudCoverPct,
    },
    daily: dailyForecasts,
    series: [
      toSeries("temperature_2m", temperatureC, "Air temperature", "°C"),
      toSeries("apparent_temperature", apparentC, "Apparent temperature", "°C"),
      toSeries("precipitation", precipitationMm, "Precipitation", "mm"),
      toSeries("wind_speed_10m", windSpeedKmh, "Wind speed", "km/h"),
      toSeries("relative_humidity_2m", humidityPct, "Relative humidity", "%"),
      toSeries("cloud_cover", cloudCoverPct, "Cloud cover", "%"),
      {
        metric_id: "temperature_2m",
        unit: "°C",
        measurement_type: "forecast",
        source_id: "open-meteo",
        label: "Daily maximum temperature",
        points: dailyForecasts.map((d) => ({ t: d.validAt ?? "", v: d.tMaxC })),
        valid_from: dailyForecasts[0]?.validAt ?? null,
        valid_to: dailyForecasts[dailyForecasts.length - 1]?.validAt ?? null,
        quality_flags: [...qualityFlags],
        note: null,
      },
      {
        metric_id: "temperature_2m",
        unit: "°C",
        measurement_type: "forecast",
        source_id: "open-meteo",
        label: "Daily minimum temperature",
        points: dailyForecasts.map((d) => ({ t: d.validAt ?? "", v: d.tMinC })),
        valid_from: dailyForecasts[0]?.validAt ?? null,
        valid_to: dailyForecasts[dailyForecasts.length - 1]?.validAt ?? null,
        quality_flags: [...qualityFlags],
        note: null,
      },
    ],
    meta,
  };
}

export async function getWeather(latitude: number, longitude: number): Promise<WeatherBundle> {
  const key = `weather:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
  return cached(key, 10 * 60_000, async () => {
    const url = buildWeatherUrl(latitude, longitude);
    const { data, retrievedAt } = await fetchJson<unknown>(url, {
      providerId: "open-meteo",
      revalidate: 600,
    });
    const parsed = rawSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(`Open-Meteo forecast response failed validation: ${parsed.error.message}`);
    }
    const normalized = normalizeWeather(parsed.data, retrievedAt);
    normalized.meta.elevationM = roundAt(normalized.meta.elevationM ?? 0, 0) || normalized.meta.elevationM;
    return normalized;
  });
}

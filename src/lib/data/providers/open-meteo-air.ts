import { z } from "zod";
import { cached } from "../cache";
import { fetchJson } from "../http";
import { asNullableNumberArray, asNumber, asStringArray } from "../parse";
import { localTimeToIso } from "@/lib/time";
import type { MetricSeries, QualityFlag } from "@/lib/types";
import type { AirQualityBundle, SourceMeta } from "../bundles";

const BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
export const OPEN_METEO_AQ_DOC = "https://open-meteo.com/en/docs/air-quality-api";

const CURRENT_VARS = [
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
] as const;

const HOURLY_VARS = ["pm2_5", "pm10", "ozone"] as const;

const rawSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  timezone: z.string().optional(),
  timezone_abbreviation: z.string().optional(),
  utc_offset_seconds: z.number().optional(),
  current: z.record(z.string(), z.unknown()).optional(),
  hourly: z.record(z.string(), z.array(z.unknown())).optional(),
});

type RawAir = z.infer<typeof rawSchema>;

export function buildAirQualityUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: CURRENT_VARS.join(","),
    hourly: HOURLY_VARS.join(","),
    forecast_days: "3",
    timezone: "auto",
  });
  return `${BASE_URL}?${params.toString()}`;
}

export function normalizeAirQuality(raw: RawAir, retrievedAt: string): AirQualityBundle {
  const offset = raw.utc_offset_seconds ?? 0;
  const timezone = raw.timezone ?? "UTC";
  const current = raw.current ?? {};
  const hourly = raw.hourly ?? {};
  const times = asStringArray(hourly.time);
  const instants = times.map((t) => localTimeToIso(t, offset)).filter((v): v is string => !!v);

  const pm25 = asNullableNumberArray(hourly.pm2_5);
  const pm10 = asNullableNumberArray(hourly.pm10);
  const ozone = asNullableNumberArray(hourly.ozone);

  const flags: QualityFlag[] = ["model-grid", "partial-coverage"];
  const currentTimeRaw = typeof current.time === "string" ? current.time : null;
  const currentValidAt = currentTimeRaw ? localTimeToIso(currentTimeRaw, offset) : null;

  const meta: SourceMeta = {
    providerId: "open-meteo-air",
    providerName: "Open-Meteo Air Quality",
    dataset: "Air Quality API · CAMS global atmospheric composition forecast",
    model: "CAMS global (provider default model set)",
    attribution: "Air quality data by Open-Meteo.com, based on CAMS (CC BY 4.0)",
    sourceUrl: OPEN_METEO_AQ_DOC,
    measurementType: "modeled",
    validAt: currentValidAt,
    retrievedAt,
    timezone,
    timezoneAbbreviation: raw.timezone_abbreviation ?? timezone,
    utcOffsetSeconds: offset,
    elevationM: asNumber(raw.elevation),
    spatialResolution: "≈40 km regional model grid — not a street-level measurement",
    qualityFlags: flags,
    note: "Regional atmospheric-composition model output. It can differ substantially from a nearby ground monitor.",
  };

  const toSeries = (
    metricId: string,
    values: (number | null)[],
    label: string,
  ): MetricSeries => ({
    metric_id: metricId,
    unit: "µg/m³",
    measurement_type: "modeled",
    source_id: "open-meteo-air",
    label,
    points: instants.map((t, i) => ({ t, v: values[i] ?? null })),
    valid_from: instants[0] ?? null,
    valid_to: instants[instants.length - 1] ?? null,
    quality_flags: [...flags],
    note: "Hourly regional model estimate.",
  });

  return {
    kind: "air-quality",
    current: {
      validAt: currentValidAt,
      pm25: asNumber(current.pm2_5),
      pm10: asNumber(current.pm10),
      ozone: asNumber(current.ozone),
      nitrogenDioxide: asNumber(current.nitrogen_dioxide),
      carbonMonoxide: asNumber(current.carbon_monoxide),
      sulphurDioxide: asNumber(current.sulphur_dioxide),
      dust: asNumber(current.dust),
      usAqi: asNumber(current.us_aqi),
      europeanAqi: asNumber(current.european_aqi),
      uvIndex: asNumber(current.uv_index),
    },
    hourly: { timesLocal: times, instants, pm25, pm10, ozone },
    series: [
      toSeries("pm2_5", pm25, "PM2.5"),
      toSeries("pm10", pm10, "PM10"),
      toSeries("ozone", ozone, "Ozone"),
    ],
    meta,
  };
}

export async function getAirQuality(latitude: number, longitude: number): Promise<AirQualityBundle> {
  const key = `air:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
  return cached(key, 15 * 60_000, async () => {
    const url = buildAirQualityUrl(latitude, longitude);
    const { data, retrievedAt } = await fetchJson<unknown>(url, {
      providerId: "open-meteo-air",
      revalidate: 900,
    });
    const parsed = rawSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(`Open-Meteo air-quality response failed validation: ${parsed.error.message}`);
    }
    return normalizeAirQuality(parsed.data, retrievedAt);
  });
}

import { z } from "zod";
import { cached } from "../cache";
import { fetchJson } from "../http";
import { asNullableNumberArray, asStringArray } from "../parse";
import type { MetricSeries, QualityFlag } from "@/lib/types";
import type { ClimateBundle, SourceMeta } from "../bundles";

const BASE_URL = "https://archive-api.open-meteo.com/v1/archive";
export const OPEN_METEO_ARCHIVE_DOC = "https://open-meteo.com/en/docs/historical-weather-api";

export const CLIMATE_BASELINE = { startYear: 1991, endYear: 2020 } as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const rawSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  timezone: z.string().optional(),
  utc_offset_seconds: z.number().optional(),
  daily: z.record(z.string(), z.array(z.unknown())).optional(),
});

const FLAGS: QualityFlag[] = ["model-grid"];

export function buildArchiveUrl(
  latitude: number,
  longitude: number,
  startYear: number,
  endYear: number,
): string {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    start_date: `${startYear}-01-01`,
    end_date: `${endYear}-12-31`,
    daily: "temperature_2m_mean,precipitation_sum",
    timezone: "auto",
  });
  return `${BASE_URL}?${params.toString()}`;
}

export interface ClimateComputation {
  annual: ClimateBundle["annual"];
  monthly: ClimateBundle["monthly"];
  recent: ClimateBundle["recent"];
  trendCPerDecade: number | null;
}

/** Annual means, 1991–2020 monthly normals and a linear trend from daily values. */
export function computeClimate(
  dates: string[],
  temperature: (number | null)[],
  precipitation: (number | null)[],
  baseline: { startYear: number; endYear: number } = CLIMATE_BASELINE,
): ClimateComputation {
  const byYear = new Map<number, { temps: number[]; precip: number[] }>();
  const byMonth = new Map<number, { temps: number[]; precip: number[] }>();

  dates.forEach((date, index) => {
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;
    const t = temperature[index] ?? null;
    const p = precipitation[index] ?? null;

    if (t !== null) {
      const bucket = byYear.get(year) ?? { temps: [], precip: [] };
      bucket.temps.push(t);
      byYear.set(year, bucket);
      if (year >= baseline.startYear && year <= baseline.endYear) {
        const monthBucket = byMonth.get(month) ?? { temps: [], precip: [] };
        monthBucket.temps.push(t);
        byMonth.set(month, monthBucket);
      }
    }
    if (p !== null) {
      const bucket = byYear.get(year) ?? { temps: [], precip: [] };
      bucket.precip.push(p);
      byYear.set(year, bucket);
      if (year >= baseline.startYear && year <= baseline.endYear) {
        const monthBucket = byMonth.get(month) ?? { temps: [], precip: [] };
        monthBucket.precip.push(p);
        byMonth.set(month, monthBucket);
      }
    }
  });

  const mean = (values: number[]) =>
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const sum = (values: number[]) =>
    values.length > 0 ? values.reduce((a, b) => a + b, 0) : null;

  const years = [...byYear.keys()].sort((a, b) => a - b);
  const annual = years.map((year) => {
    const bucket = byYear.get(year)!;
    const complete = bucket.temps.length >= 360;
    return {
      year,
      temperatureC: complete ? mean(bucket.temps) : null,
      precipitationMm: bucket.precip.length >= 360 ? sum(bucket.precip) : null,
    };
  });

  const monthly = MONTHS.map((label, index) => {
    const month = index + 1;
    const bucket = byMonth.get(month) ?? { temps: [], precip: [] };
    const yearsOfData = baseline.endYear - baseline.startYear + 1;
    const meanDailyPrecip = bucket.precip.length > 0 ? mean(bucket.precip) : null;
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index];
    return {
      month,
      label,
      temperatureC: mean(bucket.temps),
      precipitationMm:
        meanDailyPrecip !== null && bucket.precip.length >= yearsOfData * 20
          ? meanDailyPrecip * monthDays
          : null,
    };
  });

  const completeAnnual = annual.filter((a): a is { year: number; temperatureC: number; precipitationMm: number | null } => a.temperatureC !== null);
  const recent = completeAnnual.slice(-5).map((a) => ({ year: a.year, temperatureC: a.temperatureC }));

  let trendCPerDecade: number | null = null;
  if (completeAnnual.length >= 10) {
    const xs = completeAnnual.map((a) => a.year);
    const ys = completeAnnual.map((a) => a.temperatureC);
    const n = xs.length;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i += 1) {
      numerator += (xs[i] - meanX) * (ys[i] - meanY);
      denominator += (xs[i] - meanX) ** 2;
    }
    if (denominator > 0) trendCPerDecade = (numerator / denominator) * 10;
  }

  return { annual, monthly, recent, trendCPerDecade };
}

export async function getClimateSummary(
  latitude: number,
  longitude: number,
  options: { startYear?: number; endYear?: number } = {},
): Promise<ClimateBundle> {
  const endYear = options.endYear ?? new Date().getUTCFullYear() - 1;
  const startYear = options.startYear ?? CLIMATE_BASELINE.startYear;
  const key = `climate:${latitude.toFixed(2)}:${longitude.toFixed(2)}:${startYear}:${endYear}`;

  return cached(key, 12 * 60 * 60_000, async () => {
    const url = buildArchiveUrl(latitude, longitude, startYear, endYear);
    const { data, retrievedAt } = await fetchJson<unknown>(url, {
      providerId: "open-meteo-archive",
      revalidate: 43_200,
      timeoutMs: 15_000,
    });
    const parsed = rawSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error("Open-Meteo archive response failed validation");
    }
    const daily = parsed.data.daily ?? {};
    const dates = asStringArray(daily.time);
    const temperature = asNullableNumberArray(daily.temperature_2m_mean);
    const precipitation = asNullableNumberArray(daily.precipitation_sum);
    const computation = computeClimate(dates, temperature, precipitation, {
      startYear,
      endYear: Math.max(startYear, CLIMATE_BASELINE.endYear),
    });

    const flags: QualityFlag[] = [...FLAGS];
    const meta: SourceMeta = {
      providerId: "open-meteo-archive",
      providerName: "Open-Meteo Historical Weather",
      dataset: "ERA5 reanalysis · daily",
      model: "ERA5 (ECMWF) via Open-Meteo",
      attribution: "Historical weather data by Open-Meteo.com, based on ERA5 (CC BY 4.0)",
      sourceUrl: OPEN_METEO_ARCHIVE_DOC,
      measurementType: "historical-reconstruction",
      validAt: dates[dates.length - 1] ? `${dates[dates.length - 1]}T12:00:00Z` : null,
      retrievedAt,
      timezone: parsed.data.timezone ?? "UTC",
      timezoneAbbreviation: parsed.data.timezone ?? "UTC",
      utcOffsetSeconds: parsed.data.utc_offset_seconds ?? 0,
      elevationM: parsed.data.elevation ?? null,
      spatialResolution: "ERA5 reanalysis grid (~25 km) — gridded reconstruction, not a station record",
      qualityFlags: flags,
      note: "Retrospective reanalysis. It is a reconstruction of past conditions, not a direct measurement at this coordinate.",
    };

    const annualPoints: MetricSeries = {
      metric_id: "temperature_2m",
      unit: "°C",
      measurement_type: "historical-reconstruction",
      source_id: "open-meteo-archive",
      label: "Annual mean temperature",
      points: computation.annual.map((a) => ({ t: `${a.year}-07-01T00:00:00Z`, v: a.temperatureC })),
      valid_from: computation.annual[0] ? `${computation.annual[0].year}-01-01T00:00:00Z` : null,
      valid_to: computation.annual[computation.annual.length - 1]
        ? `${computation.annual[computation.annual.length - 1].year}-12-31T00:00:00Z`
        : null,
      quality_flags: [...flags],
      note: "Annual mean of daily mean air temperature. Incomplete years are excluded.",
    };

    return {
      kind: "climate",
      location: { latitude, longitude },
      baseline: { startYear, endYear: Math.max(startYear, CLIMATE_BASELINE.endYear) },
      annual: computation.annual,
      monthly: computation.monthly,
      recent: computation.recent,
      trendCPerDecade: computation.trendCPerDecade,
      series: [annualPoints],
      meta,
    };
  });
}

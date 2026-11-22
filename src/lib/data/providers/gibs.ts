import { cached } from "../cache";
import { fetchText } from "../http";
import type { ImageryLayer, MeasurementClass } from "@/lib/types";

const ROOT = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
export const GIBS_DOC = "https://nasa-gibs.github.io/gibs-api-docs/";
const ATTRIBUTION = "Imagery courtesy NASA GIBS, part of NASA EOSDIS";

interface LayerDefinition {
  id: string;
  title: string;
  variable: string;
  description: string;
  tileMatrixSet: string;
  format: "jpg" | "png";
  cadence: ImageryLayer["cadence"];
  resolution: string | null;
  measurementType: MeasurementClass;
  legend: string;
  /** Fixed date used by static composite layers. */
  staticDate?: string;
}

/**
 * Layer identifiers were verified against GIBS' own `DescribeDomains` service,
 * which returns the real availability window for each product. A layer whose
 * availability cannot be resolved is omitted rather than rendered blank.
 */
export const GIBS_LAYER_DEFINITIONS: LayerDefinition[] = [
  {
    id: "MODIS_Terra_CorrectedReflectance_TrueColor",
    title: "MODIS Terra · True colour",
    variable: "Visible reflectance",
    description:
      "Daily corrected reflectance mosaic from the MODIS instrument on Terra. Cloud, smoke and sun-glint are visible; the mosaic is not cloud-free.",
    tileMatrixSet: "GoogleMapsCompatible_Level6",
    format: "jpg",
    cadence: "daily",
    resolution: "250 m product resolution",
    measurementType: "satellite-derived",
    legend: "True-colour imagery. There is no numeric colour scale.",
  },
  {
    id: "VIIRS_Black_Marble",
    title: "VIIRS · Black Marble",
    variable: "Night lights",
    description:
      "NASA's Black Marble night-lights composite. This is a multi-year composite centred on 2016, not a current observation.",
    tileMatrixSet: "GoogleMapsCompatible_Level8",
    format: "png",
    cadence: "static",
    resolution: "500 m composite",
    measurementType: "satellite-derived",
    legend: "Composite night lights. This layer has no time slider because it is not a daily product.",
    staticDate: "2016-01-01",
  },
  {
    id: "MODIS_Terra_Aerosol",
    title: "MODIS Terra · Aerosol optical depth",
    variable: "Aerosol optical depth (AOD)",
    description:
      "Daily aerosol optical depth from MODIS Terra. Useful for dust, smoke and pollution plumes; missing where the retrieval is unavailable.",
    tileMatrixSet: "GoogleMapsCompatible_Level6",
    format: "png",
    cadence: "daily",
    resolution: "3 km product resolution",
    measurementType: "satellite-derived",
    legend:
      "Relative aerosol optical depth. GIBS does not publish a numeric legend with these tiles, so EarthCore does not display one.",
  },
  {
    id: "MODIS_Terra_Land_Surface_Temp_Day",
    title: "MODIS Terra · Land surface temperature",
    variable: "Daytime land surface temperature",
    description:
      "Daytime land-surface temperature (skin temperature, not air temperature). Cloud and heavy aerosol gaps appear as missing tiles.",
    tileMatrixSet: "GoogleMapsCompatible_Level7",
    format: "png",
    cadence: "daily",
    resolution: "1 km product resolution",
    measurementType: "satellite-derived",
    legend:
      "Relative land-surface temperature. GIBS does not publish a numeric legend with these tiles, so EarthCore does not display one.",
  },
  {
    id: "MODIS_Terra_NDVI_8Day",
    title: "MODIS Terra · Vegetation index",
    variable: "NDVI (8-day)",
    description:
      "Eight-day normalised difference vegetation index. Greenness indicates vegetated surface; clouds and snow reduce values.",
    tileMatrixSet: "GoogleMapsCompatible_Level7",
    format: "png",
    cadence: "8-day",
    resolution: "250 m product resolution",
    measurementType: "satellite-derived",
    legend:
      "Relative vegetation greenness. GIBS does not publish a numeric legend with these tiles, so EarthCore does not display one.",
  },
  {
    id: "MODIS_Terra_Cloud_Fraction_Day",
    title: "MODIS Terra · Cloud fraction",
    variable: "Daytime cloud fraction",
    description: "Daytime fractional cloud cover from MODIS Terra.",
    tileMatrixSet: "GoogleMapsCompatible_Level6",
    format: "png",
    cadence: "daily",
    resolution: "1 km product resolution",
    measurementType: "satellite-derived",
    legend:
      "Relative cloud fraction. GIBS does not publish a numeric legend with these tiles, so EarthCore does not display one.",
  },
];

export interface GibsDomainRange {
  start: string;
  end: string;
  period: "P1D" | "P8D" | "P1Y" | string;
}

/** Parse GIBS `DescribeDomains` output into concrete date ranges. */
export function parseGibsDomains(xml: string): { ranges: GibsDomainRange[]; earliest: string | null; latest: string | null } {
  const ranges: GibsDomainRange[] = [];
  const regex = /(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})\/(P\d+[DY])/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    ranges.push({ start: match[1], end: match[2], period: match[3] });
  }
  const dates = ranges.flatMap((r) => [r.start, r.end]).sort();
  return { ranges, earliest: dates[0] ?? null, latest: dates[dates.length - 1] ?? null };
}

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Expand P1D / P8D / P1Y ranges into concrete dates, bounded by `from`. */
export function expandRanges(
  ranges: GibsDomainRange[],
  from: string | null,
  to: string,
): string[] {
  const dates: string[] = [];
  for (const range of ranges) {
    const stepDays = range.period === "P1D" ? 1 : range.period === "P8D" ? 8 : range.period === "P1Y" ? 365 : 1;
    let cursor = range.start;
    if (from && cursor < from) {
      const days = Math.ceil(
        (new Date(`${from}T00:00:00Z`).getTime() - new Date(`${cursor}T00:00:00Z`).getTime()) /
          86_400_000,
      );
      cursor = addDays(cursor, Math.ceil(days / stepDays) * stepDays);
    }
    let guard = 0;
    while (cursor <= range.end && cursor <= to && guard < 800) {
      dates.push(cursor);
      cursor = addDays(cursor, stepDays);
      guard += 1;
    }
  }
  return [...new Set(dates)].sort();
}

function buildTileUrlTemplate(def: LayerDefinition): string {
  return `${ROOT}/${def.id}/default/{date}/${def.tileMatrixSet}/{z}/{y}/{x}.${def.format}`;
}

export function imageryTileUrl(layer: ImageryLayer, date: string, z: number, x: number, y: number): string {
  return layer.tileUrlTemplate
    .replace("{date}", date)
    .replace("{z}", String(z))
    .replace("{y}", String(y))
    .replace("{x}", String(x));
}

async function resolveLayer(
  def: LayerDefinition,
  now: Date,
): Promise<ImageryLayer | null> {
  const domainUrl = `${ROOT}/1.0.0/${def.id}/default/${def.tileMatrixSet}/all/all.xml`;
  try {
    const { data } = await fetchText(domainUrl, {
      providerId: "gibs",
      revalidate: 1800,
      timeoutMs: 8000,
    });
    const parsed = parseGibsDomains(data);

    if (def.cadence === "static") {
      const date = def.staticDate ?? parsed.latest;
      return {
        ...def,
        source_id: "nasa-gibs",
        dataset_id: def.id,
        tileUrlTemplate: buildTileUrlTemplate(def),
        temporalCoverage: { start: date, end: date },
        availableDates: date ? [date] : [],
        measurement_type: def.measurementType,
        attribution: ATTRIBUTION,
        source_url: GIBS_DOC,
        legend: { kind: "none", text: def.legend },
      };
    }

    if (!parsed.latest || !parsed.earliest) return null;

    const windowStart = addDays(now.toISOString().slice(0, 10), -60);
    const availableDates = expandRanges(parsed.ranges, windowStart, parsed.latest);

    return {
      ...def,
      source_id: "nasa-gibs",
      dataset_id: def.id,
      tileUrlTemplate: buildTileUrlTemplate(def),
      temporalCoverage: { start: parsed.earliest, end: parsed.latest },
      availableDates,
      measurement_type: def.measurementType,
      attribution: ATTRIBUTION,
      source_url: GIBS_DOC,
      legend: { kind: "qualitative", text: def.legend },
    };
  } catch {
    return null;
  }
}

/**
 * Resolve every GIBS layer in parallel. Layers that cannot be verified are
 * dropped, so the UI never offers imagery that the service does not have.
 */
export async function getImageryLayers(): Promise<ImageryLayer[]> {
  return cached("gibs:layers", 20 * 60_000, async () => {
    const now = new Date();
    const settled = await Promise.all(GIBS_LAYER_DEFINITIONS.map((def) => resolveLayer(def, now)));
    return settled.filter((layer): layer is ImageryLayer => layer !== null);
  });
}

export async function getImageryLayer(id: string): Promise<ImageryLayer | null> {
  const layers = await getImageryLayers();
  return layers.find((layer) => layer.id === id) ?? null;
}

/** Pick the newest available date at or before the requested date. */
export function nearestAvailableDate(layer: ImageryLayer, requested: string): string | null {
  if (layer.availableDates.length === 0) return null;
  if (layer.availableDates.includes(requested)) return requested;
  const earlier = layer.availableDates.filter((d) => d <= requested);
  if (earlier.length > 0) return earlier[earlier.length - 1];
  return layer.availableDates[0];
}

/** Tile template with the date resolved, keeping {z}/{y}/{x} placeholders. */
export function imageryTileTemplate(layer: ImageryLayer, date: string): string {
  return layer.tileUrlTemplate.replace("{date}", date);
}

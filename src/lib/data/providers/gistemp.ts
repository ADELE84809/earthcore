import { cached } from "../cache";
import { fetchText } from "../http";
import type { GlobalTemperatureBundle, GlobalTemperaturePoint } from "../bundles";

export const GISTEMP_URL =
  "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.txt";
export const GISTEMP_LANDING = "https://data.giss.nasa.gov/gistemp/";
const BASELINE_LABEL = "1951–1980";

const MISSING = /^\*+$/;

function parseCell(value: string | undefined): number | null {
  if (!value || MISSING.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed / 100 : null;
}

/**
 * Parse the NASA GISTEMP fixed-width text table.
 * Columns: Year, Jan..Dec, J-D, D-N, DJF, MAM, JJA, SON, Year.
 * Anomalies are hundredths of a degree Celsius relative to 1951–1980.
 */
export function parseGistemp(text: string): GlobalTemperaturePoint[] {
  const points: GlobalTemperaturePoint[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!/^\d{4}\s/.test(trimmed)) continue;
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 15) continue;
    const year = Number(tokens[0]);
    if (!Number.isInteger(year) || year < 1880 || year > 2100) continue;
    points.push({
      year,
      anomalyC: parseCell(tokens[13]),
      dnC: parseCell(tokens[14]),
      djfC: parseCell(tokens[15]),
    });
  }
  return points;
}

export async function getGlobalTemperature(): Promise<GlobalTemperatureBundle> {
  return cached("gistemp:global", 6 * 60 * 60_000, async () => {
    const { data, retrievedAt } = await fetchText(GISTEMP_URL, {
      providerId: "gistemp",
      revalidate: 21_600,
      timeoutMs: 12_000,
      headers: { Accept: "text/plain, */*" },
    });
    const points = parseGistemp(data);
    if (points.length < 50) {
      throw new Error("GISTEMP table could not be parsed");
    }
    return {
      points,
      baselineLabel: BASELINE_LABEL,
      dataset: "NASA GISTEMP v4 · Global Land-Ocean Temperature Index",
      attribution: "NASA Goddard Institute for Space Studies",
      sourceUrl: GISTEMP_LANDING,
      retrievedAt,
      note: "Global mean surface temperature anomaly relative to the 1951–1980 base period. The most recent year may be incomplete and is then reported as unavailable.",
    };
  });
}

import { describe, expect, it } from "vitest";
import { cToF, fToC, kmhToMs, formatValue } from "@/lib/units";
import { decodeLocationSlug, encodeLocationSlug, isValidCoordinate, parseCoordinateInput, haversineKm } from "@/lib/geo";
import { parseGistemp } from "@/lib/data/providers/gistemp";

describe("unit conversion and missing values", () => {
  it("converts temperatures and wind speed", () => {
    expect(cToF(0)).toBe(32);
    expect(fToC(32)).toBe(0);
    expect(kmhToMs(36)).toBe(10);
  });
  it("preserves missing measurements as an em dash", () => {
    expect(formatValue(null)).toBe("—");
    expect(formatValue(Number.NaN)).toBe("—");
  });
});

describe("coordinate tools", () => {
  it("validates ranges and parses coordinate text", () => {
    expect(isValidCoordinate(26.9124, 75.7873)).toBe(true);
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(parseCoordinateInput("26.9124, 75.7873")).toEqual({ latitude: 26.9124, longitude: 75.7873 });
    expect(parseCoordinateInput("100, 500")).toBeNull();
  });
  it("round-trips stable location route slugs", () => {
    const slug = encodeLocationSlug("Jaipur", 26.9124, 75.7873);
    expect(decodeLocationSlug(slug)).toEqual({ name: "jaipur", latitude: 26.9124, longitude: 75.7873 });
    expect(decodeLocationSlug(encodeURIComponent(slug))).toEqual({ name: "jaipur", latitude: 26.9124, longitude: 75.7873 });
  });
  it("computes approximate great-circle distance", () => {
    expect(haversineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(111.2, 0);
  });
});

describe("NASA GISTEMP parser", () => {
  it("handles valid fixed-column records and explicit missing cells", () => {
    const points = parseGistemp("2024  10  20  30  40  50  60  70  80  90 100 110 120 130 140 150 160 170 180 190 200 2024\n2025 *****  20  30  40  50  60  70  80  90 100 110 120 ***** 150 160 170 180 190 200 2025");
    expect(points).toHaveLength(2);
    expect(points[0]?.anomalyC).toBe(1.3);
    expect(points[1]?.anomalyC).toBeNull();
  });
});

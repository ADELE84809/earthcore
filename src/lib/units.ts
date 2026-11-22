/** Unit conversions and human-friendly formatting. All conversions are exact. */

export function cToF(c: number): number {
  return c * (9 / 5) + 32;
}

export function fToC(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function cToK(c: number): number {
  return c + 273.15;
}

export function kmhToMs(kmh: number): number {
  return kmh / 3.6;
}

export function msToKmh(ms: number): number {
  return ms * 3.6;
}

export function kmhToMph(kmh: number): number {
  return kmh / 1.609344;
}

export function mmToInches(mm: number): number {
  return mm / 25.4;
}

export function hPaToInHg(hpa: number): number {
  return hpa * 0.0295299830714;
}

export function mToFeet(m: number): number {
  return m * 3.28084;
}

export type TemperatureUnit = "celsius" | "fahrenheit";
export type WindUnit = "kmh" | "ms" | "mph";

export function convertTemperature(value: number, to: TemperatureUnit): number {
  return to === "fahrenheit" ? cToF(value) : value;
}

export function convertWind(valueKmh: number, to: WindUnit): number {
  if (to === "ms") return kmhToMs(valueKmh);
  if (to === "mph") return kmhToMph(valueKmh);
  return valueKmh;
}

export function temperatureUnitLabel(unit: TemperatureUnit): "°C" | "°F" {
  return unit === "fahrenheit" ? "°F" : "°C";
}

export function windUnitLabel(unit: WindUnit): "km/h" | "m/s" | "mph" {
  return unit === "ms" ? "m/s" : unit === "mph" ? "mph" : "km/h";
}

/** Round to a fixed number of decimals, returning a number (never a string). */
export function round(value: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** Format a numeric measurement for display, preserving null as an em dash. */
export function formatValue(
  value: number | null | undefined,
  decimals = 1,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  const fixed = value.toFixed(decimals);
  return fixed;
}

/** Localised fixed-point number with thousands separators. */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Sign a value for anomaly display: +0.42, −0.13. */
export function formatAnomaly(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(decimals)}`;
}

/** 0–360° meteorological direction → 16-point compass label. */
export function compassLabel(degrees: number): string {
  const points = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return points[index] ?? "N";
}

export interface WeatherCodeInfo {
  label: string;
  description: string;
  /** Stable key used to pick an icon/gradient without external assets. */
  icon: "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";
}

/**
 * WMO 4677 present-weather codes as served by Open-Meteo's `weather_code`.
 * Source: Open-Meteo documentation (WMO code table).
 */
export function weatherCodeInfo(code: number | null | undefined): WeatherCodeInfo {
  switch (code) {
    case 0:
      return { label: "Clear sky", description: "No cloud or very little cloud.", icon: "clear" };
    case 1:
      return { label: "Mainly clear", description: "Mostly clear with a little cloud.", icon: "clear" };
    case 2:
      return { label: "Partly cloudy", description: "A mix of sun and cloud.", icon: "partly" };
    case 3:
      return { label: "Overcast", description: "Continuous cloud cover.", icon: "cloudy" };
    case 45:
    case 48:
      return { label: "Fog", description: "Depositing rime fog or fog.", icon: "fog" };
    case 51:
    case 53:
    case 55:
      return { label: "Drizzle", description: "Light to dense drizzle.", icon: "drizzle" };
    case 56:
    case 57:
      return { label: "Freezing drizzle", description: "Drizzle freezing on contact.", icon: "drizzle" };
    case 61:
    case 63:
    case 65:
      return { label: "Rain", description: "Light to heavy rain.", icon: "rain" };
    case 66:
    case 67:
      return { label: "Freezing rain", description: "Rain freezing on contact.", icon: "rain" };
    case 71:
    case 73:
    case 75:
      return { label: "Snow", description: "Light to heavy snowfall.", icon: "snow" };
    case 77:
      return { label: "Snow grains", description: "Snow grains falling.", icon: "snow" };
    case 80:
    case 81:
    case 82:
      return { label: "Rain showers", description: "Showers of rain, possibly violent.", icon: "rain" };
    case 85:
    case 86:
      return { label: "Snow showers", description: "Showers of snow.", icon: "snow" };
    case 95:
      return { label: "Thunderstorm", description: "Thunderstorm with rain.", icon: "storm" };
    case 96:
    case 99:
      return { label: "Thunderstorm + hail", description: "Thunderstorm with hail.", icon: "storm" };
    default:
      return { label: "Conditions unavailable", description: "No weather interpretation available.", icon: "cloudy" };
  }
}

/** WHO global air-quality guideline (2021) for PM2.5, 24-hour mean. */
export const WHO_PM25_24H_GUIDELINE = 15;
/** WHO global air-quality guideline (2021) for PM10, 24-hour mean. */
export const WHO_PM10_24H_GUIDELINE = 45;

/**
 * Qualitative band for a PM2.5 concentration relative to the WHO 24-hour
 * guideline. This is a comparison against a guideline value, not an air-quality
 * index; the provider-supplied index is shown separately.
 */
export function pm25Band(ugM3: number): { label: string; tone: "good" | "moderate" | "high" | "very-high" } {
  if (ugM3 <= WHO_PM25_24H_GUIDELINE) return { label: "Within WHO 24-h guideline", tone: "good" };
  if (ugM3 <= 35) return { label: "Above WHO guideline", tone: "moderate" };
  if (ugM3 <= 55) return { label: "Well above guideline", tone: "high" };
  return { label: "Far above guideline", tone: "very-high" };
}

/** US EPA AQI category from an index value (provider-computed index). */
export function aqiCategory(
  aqi: number | null,
): { label: string; tone: "good" | "moderate" | "high" | "very-high" | "hazardous" } | null {
  if (aqi === null || !Number.isFinite(aqi)) return null;
  if (aqi <= 50) return { label: "Good", tone: "good" };
  if (aqi <= 100) return { label: "Moderate", tone: "moderate" };
  if (aqi <= 150) return { label: "Unhealthy for sensitive groups", tone: "high" };
  if (aqi <= 200) return { label: "Unhealthy", tone: "very-high" };
  if (aqi <= 300) return { label: "Very unhealthy", tone: "very-high" };
  return { label: "Hazardous", tone: "hazardous" };
}

export function windDirectionArrow(degrees: number | null): string {
  if (degrees === null || !Number.isFinite(degrees)) return "—";
  const arrows = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"];
  const normalized = ((degrees % 360) + 360) % 360;
  return arrows[Math.round(normalized / 45) % 8] ?? "↓";
}

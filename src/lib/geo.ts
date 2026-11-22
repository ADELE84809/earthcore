/** Coordinate validation, distance and formatting helpers. */

export const MIN_LAT = -90;
export const MAX_LAT = 90;
export const MIN_LON = -180;
export const MAX_LON = 180;

export function clampLatitude(value: number): number {
  return Math.min(MAX_LAT, Math.max(MIN_LAT, value));
}

export function clampLongitude(value: number): number {
  return Math.min(MAX_LON, Math.max(MIN_LON, value));
}

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= MIN_LAT && value <= MAX_LAT;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= MIN_LON && value <= MAX_LON;
}

export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return isValidLatitude(latitude) && isValidLongitude(longitude);
}

/** Parse a free-text "26.91, 75.79" pair. Returns null when ambiguous/invalid. */
export function parseCoordinateInput(raw: string): { latitude: number; longitude: number } | null {
  const cleaned = raw.trim().replace(/[°\s]/g, "");
  const match = /^(-?\d+(?:\.\d+)?)[,\s/;]+(-?\d+(?:\.\d+)?)$/.exec(cleaned);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!isValidCoordinate(latitude, longitude)) return null;
  return { latitude, longitude };
}

/** Great-circle distance in kilometres (haversine). */
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371.0088;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 26.9124° N, 75.7873° E */
export function formatCoordinate(latitude: number, longitude: number, decimals = 4): string {
  const lat = Math.abs(latitude).toFixed(decimals);
  const lon = Math.abs(longitude).toFixed(decimals);
  return `${lat}° ${latitude >= 0 ? "N" : "S"}, ${lon}° ${longitude >= 0 ? "E" : "W"}`;
}

/** 26.9124, 75.7873 — used for share URLs and API parameters. */
export function coordinatePair(latitude: number, longitude: number, decimals = 4): string {
  return `${latitude.toFixed(decimals)}, ${longitude.toFixed(decimals)}`;
}

/** URL-safe slug, stable across rebuilds. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Bounding box for "events within N km of a point" filtering. */
export function boundingBox(
  latitude: number,
  longitude: number,
  radiusKm: number,
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const latDelta = radiusKm / 110.574;
  const cosLat = Math.cos((latitude * Math.PI) / 180) || 1e-6;
  const lonDelta = radiusKm / (111.32 * cosLat);
  return {
    minLat: clampLatitude(latitude - latDelta),
    maxLat: clampLatitude(latitude + latDelta),
    minLon: Math.max(-180, longitude - lonDelta),
    maxLon: Math.min(180, longitude + lonDelta),
  };
}

/**
 * Stable, readable location route slug.
 * `jaipur@26.9124,75.7873` — the name is cosmetic, the coordinates are exact.
 */
export function encodeLocationSlug(name: string, latitude: number, longitude: number): string {
  const safeName = slugify(name) || "location";
  return `${safeName}@${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

export function decodeLocationSlug(
  slug: string,
): { name: string; latitude: number; longitude: number } | null {
  const match = /^(.*?)@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(slug);
  if (!match) return null;
  const latitude = Number(match[2]);
  const longitude = Number(match[3]);
  if (!isValidCoordinate(latitude, longitude)) return null;
  return {
    name: match[1] ? match[1].replace(/-/g, " ").trim() : "Location",
    latitude,
    longitude,
  };
}

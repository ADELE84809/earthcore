import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
// Bundled public-domain Natural Earth 1:110m geometry (via world-atlas).
import countriesTopology from "world-atlas/countries-110m.json";

export const COUNTRIES_GEOJSON = feature(
  countriesTopology as never,
  (countriesTopology as { objects: { countries: unknown } }).objects.countries as never,
) as unknown as FeatureCollection<Geometry>;

export function buildGraticule(step = 30): FeatureCollection<Geometry> {
  const features: GeoJSON.Feature<Geometry>[] = [];

  for (let lat = -60; lat <= 60; lat += step) {
    const coords: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 5) coords.push([lon, lat]);
    features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
  }

  for (let lon = -180; lon < 180; lon += step) {
    const coords: [number, number][] = [];
    for (let lat = -90; lat <= 90; lat += 5) coords.push([lon, lat]);
    features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
  }

  return { type: "FeatureCollection", features };
}

export function graticuleLabelFor(longitude: number): string {
  const normalized = ((longitude + 180) % 360) - 180;
  const abs = Math.abs(normalized);
  return `${abs.toFixed(0)}° ${normalized >= 0 ? "E" : "W"}`;
}

/** A thin ring showing the observer's horizon at a given latitude. */
export function buildHorizon(latitude: number): FeatureCollection<Geometry> {
  const coords: [number, number][] = [];
  for (let lon = -180; lon <= 180; lon += 3) coords.push([lon, latitude]);
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }],
  };
}

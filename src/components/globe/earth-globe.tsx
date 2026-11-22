"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type {
  Map as MapLibreMap,
  MapMouseEvent,
  MapGeoJSONFeature,
  StyleSpecification,
} from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import type { Earthquake, ImageryLayer, NaturalEvent } from "@/lib/types";
import { COUNTRIES_GEOJSON, buildGraticule } from "./globe-geo";
import "maplibre-gl/dist/maplibre-gl.css";

type MapModule = typeof import("maplibre-gl");

export interface GlobeView {
  longitude: number;
  latitude: number;
  zoom: number;
}

export interface GlobeFocus extends GlobeView {
  key: string | number;
}

export interface GlobeMarker {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface EarthGlobeProps {
  className?: string;
  initialView?: GlobeView;
  focus?: GlobeFocus | null;
  imageryLayers: ImageryLayer[];
  imageryDate?: string;
  basemap?: string;
  events?: NaturalEvent[];
  earthquakes?: Earthquake[];
  showEvents?: boolean;
  showEarthquakes?: boolean;
  showBorders?: boolean;
  showGraticule?: boolean;
  selected?: GlobeMarker | null;
  interactive?: boolean;
  autoRotate?: boolean;
  onSelectCoordinate?: (latitude: number, longitude: number) => void;
  onSelectEvent?: (event: NaturalEvent) => void;
  onSelectEarthquake?: (earthquake: Earthquake) => void;
  onReady?: () => void;
  children?: ReactNode;
  ariaLabel?: string;
  priority?: boolean;
}

const EVENT_COLORS: Record<string, string> = {
  wildfires: "#F07878",
  severeStorms: "#8D8CF7",
  volcanoes: "#F4B55C",
  floods: "#4B8EFF",
  landslides: "#3BE0AE",
  dustHaze: "#F4B55C",
  waterColor: "#57E7F5",
  seaLakeIce: "#57E7F5",
  snow: "#A2B2C8",
  tempExtremes: "#F07878",
  manmade: "#8D8CF7",
};

const DEFAULT_VIEW: GlobeView = { longitude: 78, latitude: 18, zoom: 1.55 };

function eventsToGeoJson(events: NaturalEvent[]): FeatureCollection<Geometry> {
  return {
    type: "FeatureCollection",
    features: events
      .filter((event) => event.point)
      .map((event) => ({
        type: "Feature" as const,
        properties: {
          id: event.id,
          title: event.title,
          category: event.category.id,
          magnitude: event.magnitude ?? 0,
          unit: event.magnitudeUnit ?? "",
          status: event.status,
          startedAt: event.startedAt ?? "",
        },
        geometry: {
          type: "Point" as const,
          coordinates: [event.point!.longitude, event.point!.latitude] as [number, number],
        },
      })),
  };
}

function earthquakesToGeoJson(earthquakes: Earthquake[]): FeatureCollection<Geometry> {
  return {
    type: "FeatureCollection",
    features: earthquakes.map((quake) => ({
      type: "Feature" as const,
      properties: {
        id: quake.id,
        magnitude: quake.magnitude ?? 0,
        place: quake.place,
        time: quake.time,
        depth: quake.depthKm ?? 0,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [quake.longitude, quake.latitude] as [number, number],
      },
    })),
  };
}

function buildStyle(
  layers: ImageryLayer[],
  basemapId: string | undefined,
  date: string,
): StyleSpecification {
  const active = layers.find((layer) => layer.id === basemapId) ?? layers[0];
  const tiles = active ? [active.tileUrlTemplate.replace("{date}", date)] : [];

  const style = {
    version: 8,
    projection: { type: "globe" },
    sky: {
      "sky-color": "#03060D",
      "horizon-color": "rgba(87, 231, 245, 0.30)",
      "fog-color": "#07101C",
      "sky-horizon-blend": 0.55,
      "horizon-fog-blend": 0.55,
      "fog-ground-blend": 0.75,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.85, 4, 0.45, 7, 0.12],
    },
    sources: {
      ...(active
        ? {
            gibs: {
              type: "raster",
              tiles,
              tileSize: 256,
              attribution: active.attribution,
            },
          }
        : {}),
      world: {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]],
          },
        },
      },
      borders: { type: "geojson", data: COUNTRIES_GEOJSON },
      graticule: { type: "geojson", data: buildGraticule(30) },
      events: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
      quakes: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 5,
        clusterRadius: 26,
      },
    },
    layers: [
      {
        id: "space",
        type: "background",
        paint: { "background-color": "#03060D", "background-opacity": 0 },
      },
      {
        id: "ocean",
        type: "fill",
        source: "world",
        paint: { "fill-color": "#050D18", "fill-opacity": 1 },
      },
      {
        id: "land",
        type: "fill",
        source: "borders",
        paint: { "fill-color": "#0C1A2B", "fill-opacity": 1 },
      },
      ...(active
        ? [
            {
              id: "gibs",
              type: "raster",
              source: "gibs",
              paint: {
                "raster-opacity": 0.96,
                "raster-fade-duration": 220,
                "raster-brightness-max": 0.94,
              },
            },
          ]
        : []),
      {
        id: "graticule",
        type: "line",
        source: "graticule",
        paint: { "line-color": "rgba(180,210,255,0.10)", "line-width": 0.55 },
      },
      {
        id: "borders",
        type: "line",
        source: "borders",
        paint: {
          "line-color": "rgba(205, 228, 255, 0.34)",
          "line-width": 0.75,
        },
      },
      {
        id: "quake-clusters",
        type: "circle",
        source: "quakes",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "rgba(244, 181, 92, 0.22)",
          "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 8, 40, 16, 120, 24],
          "circle-stroke-color": "rgba(244, 181, 92, 0.5)",
          "circle-stroke-width": 1,
        },
      },
      {
        id: "quakes",
        type: "circle",
        source: "quakes",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#F4B55C",
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "magnitude"],
            2,
            1.6,
            4,
            3.4,
            6,
            6.5,
            8,
            10,
          ],
          "circle-opacity": 0.85,
          "circle-stroke-color": "rgba(3, 6, 13, 0.85)",
          "circle-stroke-width": 0.8,
        },
      },
      {
        id: "events",
        type: "circle",
        source: "events",
        paint: {
          "circle-color": [
            "match",
            ["get", "category"],
            "wildfires",
            "#F07878",
            "severeStorms",
            "#8D8CF7",
            "volcanoes",
            "#F4B55C",
            "floods",
            "#4B8EFF",
            "landslides",
            "#3BE0AE",
            "#57E7F5",
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            1,
            ["step", ["get", "magnitude"], 2.4, 100, 3.4, 1000, 4.4],
            5,
            ["step", ["get", "magnitude"], 4, 100, 5.5, 1000, 7],
          ],
          "circle-opacity": 0.9,
          "circle-stroke-color": "rgba(3, 6, 13, 0.9)",
          "circle-stroke-width": 1,
        },
      },
    ],
  };

  return style as unknown as StyleSpecification;
}

export function EarthGlobe({
  className = "",
  initialView = DEFAULT_VIEW,
  focus = null,
  imageryLayers,
  imageryDate,
  basemap,
  events = [],
  earthquakes = [],
  showEvents = true,
  showEarthquakes = true,
  showBorders = true,
  showGraticule = true,
  selected = null,
  interactive = true,
  autoRotate = false,
  onSelectCoordinate,
  onSelectEvent,
  onSelectEarthquake,
  onReady,
  children,
  ariaLabel = "Interactive globe of Earth with environmental data layers",
}: EarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const mlRef = useRef<MapModule | null>(null);
  const markerRef = useRef<{ remove: () => void } | null>(null);
  const interactingRef = useRef(false);
  const lastFocusKey = useRef<string | number | null>(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<{ x: number; y: number; label: string; color: string } | null>(null);

  const resolvedDate =
    imageryDate ??
    imageryLayers[0]?.availableDates.at(-1) ??
    imageryLayers[0]?.temporalCoverage.end ??
    "2026-01-01";

  // --- initialise once ---
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      const ml = await import("maplibre-gl");
      if (cancelled) return;
      mlRef.current = ml;
      ml.setWorkerUrl("/maplibre-gl-worker.mjs");

      let map: MapLibreMap;
      try {
        map = new ml.Map({
          container,
          style: buildStyle(imageryLayers, basemap, resolvedDate),
          center: [initialView.longitude, initialView.latitude],
          zoom: initialView.zoom,
          minZoom: 0.3,
          maxZoom: 8,
          attributionControl: false,
          renderWorldCopies: false,
          fadeDuration: 180,
          pixelRatio: Math.min(window.devicePixelRatio || 1, 1.75),
          pitchWithRotate: false,
          touchPitch: false,
          keyboard: interactive,
        });
      } catch {
        setFailed(true);
        return;
      }

      mapRef.current = map;
      (window as unknown as { __ecMap?: MapLibreMap }).__ecMap = map;
      map.addControl(new ml.NavigationControl({ showCompass: false, visualizePitch: false }), "top-right");
      map.getCanvas().setAttribute("aria-label", ariaLabel);
      map.getCanvas().setAttribute("role", "application");

      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(() => {
          window.requestAnimationFrame(() => map.resize());
        });
        observer.observe(container);
        (map as unknown as { __resizeObserver?: ResizeObserver }).__resizeObserver = observer;
      }

      map.on("load", () => {
        if (cancelled) return;
        map.resize();
        window.setTimeout(() => map.resize(), 120);
        try {
          map.setProjection({ type: "globe" });
        } catch {
          /* globe projection unavailable on this renderer */
        }
        try {
          map.setSky({
            "sky-color": "#03060D",
            "horizon-color": "rgba(87, 231, 245, 0.30)",
            "fog-color": "#07101C",
            "sky-horizon-blend": 0.55,
            "horizon-fog-blend": 0.55,
            "fog-ground-blend": 0.75,
            "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.85, 4, 0.45, 7, 0.12],
          });
        } catch {
          /* sky spec unsupported */
        }
        setReady(true);
        onReady?.();
      });

      map.on("error", (event) => {
        // Tile failures are expected when a provider has gaps; surface only fatal errors.
        if (event?.error?.message && /WebGL|context/i.test(event.error.message)) {
          setFailed(true);
        }
      });

      map.on("webglcontextlost", () => setFailed(true));

      if (!interactive) {
        map.dragPan.disable();
        map.scrollZoom.disable();
        map.boxZoom.disable();
        map.dragRotate.disable();
        map.keyboard.disable();
        map.doubleClickZoom.disable();
        map.touchZoomRotate.disable();
      }
    })();

    return () => {
      cancelled = true;
      const map = mapRef.current;
      if (map) {
        const observer = (map as unknown as { __resizeObserver?: ResizeObserver }).__resizeObserver;
        observer?.disconnect();
        map.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- imagery layer / date changes ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const active = imageryLayers.find((layer) => layer.id === basemap) ?? imageryLayers[0];
    if (!active) return;
    const source = map.getSource("gibs") as { setTiles?: (tiles: string[]) => void } | undefined;
    if (source?.setTiles) {
      source.setTiles([active.tileUrlTemplate.replace("{date}", resolvedDate)]);
    }
  }, [basemap, resolvedDate, imageryLayers, ready]);

  // --- event + earthquake data ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource("events") as { setData?: (data: FeatureCollection) => void } | undefined;
    source?.setData?.(eventsToGeoJson(events));
  }, [events, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource("quakes") as { setData?: (data: FeatureCollection) => void } | undefined;
    source?.setData?.(earthquakesToGeoJson(earthquakes));
  }, [earthquakes, ready]);

  // --- layer visibility ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty("events", "visibility", showEvents ? "visible" : "none");
    map.setLayoutProperty("quake-clusters", "visibility", showEarthquakes ? "visible" : "none");
    map.setLayoutProperty("quakes", "visibility", showEarthquakes ? "visible" : "none");
  }, [showEvents, showEarthquakes, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty("borders", "visibility", showBorders ? "visible" : "none");
    map.setLayoutProperty("graticule", "visibility", showGraticule ? "visible" : "none");
  }, [showBorders, showGraticule, ready]);

  // --- hover tooltip + click selection ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !interactive) return;

    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
      setHover(null);
    };

    const onMove = (event: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["events", "quakes", "quake-clusters"],
      });
      const feature = features[0] as MapGeoJSONFeature | undefined;
      if (!feature) {
        setHover(null);
        return;
      }
      const props = feature.properties as Record<string, unknown>;
      const isCluster = feature.layer?.id === "quake-clusters";
      const label = isCluster
        ? `${props.point_count} earthquakes`
        : feature.layer?.id === "events"
          ? String(props.title ?? "Event")
          : `M ${Number(props.magnitude).toFixed(1)} — ${String(props.place ?? "")}`;
      const color = isCluster
        ? "#F4B55C"
        : feature.layer?.id === "events"
          ? EVENT_COLORS[String(props.category)] ?? "#57E7F5"
          : "#F4B55C";
      setHover({ x: event.point.x, y: event.point.y, label, color });
    };

    const onClick = (event: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["events", "quakes"],
      });
      const feature = features[0] as MapGeoJSONFeature | undefined;
      if (feature) {
        const props = feature.properties as Record<string, unknown>;
        if (feature.layer?.id === "events") {
          onSelectEvent?.({
            id: String(props.id),
            title: String(props.title),
            category: { id: String(props.category), title: String(props.category) },
            status: (props.status as "open" | "closed") ?? "open",
            description: null,
            link: "https://eonet.gsfc.nasa.gov",
            sources: [],
            geometry: [],
            point: {
              longitude: (feature.geometry as unknown as { coordinates: [number, number] }).coordinates[0],
              latitude: (feature.geometry as unknown as { coordinates: [number, number] }).coordinates[1],
            },
            startedAt: (props.startedAt as string) || null,
            closedAt: null,
            magnitude: Number(props.magnitude) || null,
            magnitudeUnit: (props.unit as string) || null,
          });
          return;
        }
        onSelectEarthquake?.({
          id: String(props.id),
          magnitude: Number(props.magnitude),
          magnitudeType: null,
          place: String(props.place),
          time: String(props.time),
          updated: String(props.time),
          depthKm: Number(props.depth),
          longitude: (feature.geometry as unknown as { coordinates: [number, number] }).coordinates[0],
          latitude: (feature.geometry as unknown as { coordinates: [number, number] }).coordinates[1],
          url: "https://earthquake.usgs.gov/earthquakes/map/",
          status: "automatic",
          tsunami: null,
          significance: null,
          feltReports: null,
        });
        return;
      }
      onSelectCoordinate?.(round(event.lngLat.lat, 4), round(event.lngLat.lng, 4));
    };

    map.on("mouseenter", "events", onEnter);
    map.on("mouseenter", "quakes", onEnter);
    map.on("mouseenter", "quake-clusters", onEnter);
    map.on("mouseleave", "events", onLeave);
    map.on("mouseleave", "quakes", onLeave);
    map.on("mouseleave", "quake-clusters", onLeave);
    map.on("mousemove", onMove);
    map.on("click", onClick);

    return () => {
      map.off("mouseenter", "events", onEnter);
      map.off("mouseenter", "quakes", onEnter);
      map.off("mouseenter", "quake-clusters", onEnter);
      map.off("mouseleave", "events", onLeave);
      map.off("mouseleave", "quakes", onLeave);
      map.off("mouseleave", "quake-clusters", onLeave);
      map.off("mousemove", onMove);
      map.off("click", onClick);
    };
  }, [ready, interactive, onSelectCoordinate, onSelectEvent, onSelectEarthquake]);

  // --- selected pin ---
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!map || !ml || !ready) return;
    markerRef.current?.remove();
    markerRef.current = null;
    if (!selected) return;
    const element = document.createElement("div");
    element.className = "ec-pin";
    element.innerHTML = '<span class="ec-pin-ring"></span><span class="ec-pin-core"></span>';
    const marker = new ml.Marker({ element, anchor: "center" })
      .setLngLat([selected.longitude, selected.latitude])
      .addTo(map);
    markerRef.current = marker;
  }, [selected?.latitude, selected?.longitude, ready]);

  // --- camera focus ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !focus) return;
    if (lastFocusKey.current === focus.key) return;
    lastFocusKey.current = focus.key;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.easeTo({
      center: [focus.longitude, focus.latitude],
      zoom: focus.zoom,
      duration: reduce ? 0 : 1700,
      essential: true,
    });
  }, [focus, ready]);

  // --- auto rotation ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !autoRotate) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    const pause = () => {
      interactingRef.current = true;
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        interactingRef.current = false;
      }, 3200);
    };

    const onPointerDown = () => pause();
    const onWheel = () => pause();

    const canvas = map.getCanvas();
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("wheel", onWheel, { passive: true });

    const tick = (now: number) => {
      const delta = Math.min(48, now - last);
      last = now;
      if (!interactingRef.current && document.visibilityState === "visible") {
        const center = map.getCenter();
        map.setCenter([center.lng + delta * 0.00075, center.lat]);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      if (resumeTimer) clearTimeout(resumeTimer);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [autoRotate, ready]);

  // --- resize ---
  useEffect(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div className={`relative isolate h-full w-full overflow-hidden ${className}`}>
      <div className="starfield absolute inset-0 -z-10 opacity-70" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_45%,rgba(13,25,41,0.9),#03060D_70%)]" aria-hidden />
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* cinematic vignette */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(3,6,13,0.55)_100%)]"
        aria-hidden
      />

      {!ready && !failed ? (
        <div className="absolute inset-0 flex items-center justify-center" role="status" aria-live="polite">
          <div className="relative h-40 w-40 sm:h-52 sm:w-52">
            <div className="absolute inset-0 animate-spin rounded-full border border-line [animation-duration:14s]">
              <span className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-cyan shadow-[0_0_12px_2px_rgba(87,231,245,0.7)]" />
            </div>
            <div className="absolute inset-4 rounded-full border border-line/60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="eyebrow">Initialising planetary view</span>
            </div>
          </div>
        </div>
      ) : null}

      {failed ? <FallbackGlobe /> : null}

      {hover ? (
        <div
          className="pointer-events-none absolute z-20 max-w-[240px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-lg border border-line bg-void/90 px-2.5 py-1.5 text-[11px] text-text shadow-xl backdrop-blur"
          style={{ left: hover.x, top: hover.y }}
        >
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: hover.color }} />
          {hover.label}
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 p-3">
        <span className="pointer-events-auto rounded-full border border-line bg-void/50 px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] text-muted/70 backdrop-blur">
          IMAGERY {resolvedDate} · NASA GIBS
        </span>
        <span className="pointer-events-auto rounded-full border border-line bg-void/50 px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] text-muted/70 backdrop-blur">
          DRAG TO ROTATE · SCROLL TO ZOOM
        </span>
      </div>

      {children}
    </div>
  );
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function FallbackGlobe() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" role="img" aria-label="Stylised globe">
      <div className="relative aspect-square w-[62%] max-w-[520px] rounded-full bg-[radial-gradient(circle_at_32%_28%,#1d3a5c_0%,#0b1a2c_45%,#03060D_78%)] shadow-[0_0_120px_-20px_rgba(87,231,245,0.35)]">
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute inset-0 grid-overlay opacity-40" />
        </div>
        <div className="absolute inset-0 rounded-full border border-line/60" />
        <div className="absolute inset-[8%] rounded-full border border-line/30" />
        <p className="absolute inset-x-0 -bottom-10 text-center text-[11px] text-muted">
          3D rendering unavailable — data panels remain fully functional.
        </p>
      </div>
    </div>
  );
}

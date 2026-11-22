"use client";

import { useState } from "react";
import Link from "next/link";
import { GlobeMount } from "@/components/globe/globe-mount";
import { formatCoordinate, encodeLocationSlug } from "@/lib/geo";
import type { Earthquake, ImageryLayer, NaturalEvent } from "@/lib/types";
import { Panel } from "@/components/ui/primitives";

export function MissionControl({
  imageryLayers,
  imageryDate,
  events,
  earthquakes,
  eventsError,
  earthquakesError,
  retrievedAt,
}: {
  imageryLayers: ImageryLayer[];
  imageryDate: string;
  events: NaturalEvent[];
  earthquakes: Earthquake[];
  eventsError: string | null;
  earthquakesError: string | null;
  retrievedAt: string;
}) {
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [placeName, setPlaceName] = useState("Selected coordinates");
  const href = point ? `/location/${encodeLocationSlug(placeName, point.latitude, point.longitude)}` : null;

  return (
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
      <Panel className="order-2 p-4 xl:order-1">
        <p className="eyebrow mb-4">INTELLIGENCE LAYERS</p>
        {["Weather · modeled", "Air quality · modeled", "Satellite imagery", `Natural events · ${eventsError ? "unavailable" : events.length}`, `Earthquakes · ${earthquakesError ? "unavailable" : earthquakes.length}`, "Data coverage"].map((label) => (
          <div key={label} className="mb-2 rounded-lg border border-line/60 bg-white/[0.02] px-3 py-3 text-[12px] text-muted">{label}</div>
        ))}
        <p className="mt-5 text-[11px] leading-5 text-muted">Satellite availability is verified against NASA GIBS metadata. Event feeds are informational, not hazard alerts.</p>
      </Panel>

      <div className="order-1 min-w-0 xl:order-2">
        <div className="relative h-[55vh] min-h-[420px] overflow-hidden rounded-2xl border border-line/60 bg-void">
          <GlobeMount
            imageryLayers={imageryLayers}
            imageryDate={imageryDate}
            events={events}
            earthquakes={earthquakes}
            showEvents
            showEarthquakes
            interactive
            autoRotate
            selected={point ? { ...point, label: placeName } : null}
            onSelectCoordinate={(latitude, longitude) => {
              setPlaceName("Selected coordinates");
              setPoint({ latitude, longitude });
            }}
            onSelectEvent={(event) => {
              if (!event.point) return;
              setPlaceName(event.title);
              setPoint({ latitude: event.point.latitude, longitude: event.point.longitude });
            }}
            onSelectEarthquake={(quake) => {
              setPlaceName(quake.place);
              setPoint({ latitude: quake.latitude, longitude: quake.longitude });
            }}
            ariaLabel="Interactive globe with satellite imagery, natural event and earthquake layers"
          />
          <div className="absolute bottom-4 left-4 rounded-full border border-line bg-void/80 px-3 py-2 text-[10px] text-muted backdrop-blur">
            {point ? formatCoordinate(point.latitude, point.longitude) : "Drag to rotate · click the globe or a marker"}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{imageryLayers.slice(0, 6).map((layer) => <span key={layer.id} className="chip">{layer.title}</span>)}</div>
      </div>

      <Panel className="order-3 p-5">
        <p className="eyebrow">INTELLIGENCE PANEL</p>
        <h2 className="display mt-3 text-2xl text-text">{point ? placeName : "Choose a point on Earth"}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          {point
            ? `${formatCoordinate(point.latitude, point.longitude)}. Open the coordinate-resolved dashboard to inspect available environmental data.`
            : "The globe shows source-backed event and earthquake records. Click a place or marker to resolve its coordinates, then open the location dashboard."}
        </p>
        {href ? <Link href={href} className="btn btn-primary mt-5 inline-flex h-10 items-center px-4">Open location intelligence</Link> : <Link href="/location/jaipur@26.9124,75.7873" className="mt-5 block rounded-xl border border-line/60 p-4 text-xs text-muted hover:border-cyan/50">Example location · Jaipur</Link>}
        <div className="mt-6 space-y-3 text-xs text-muted">
          <p>Open events: <strong className="text-text">{eventsError ? "Unavailable" : events.length}</strong></p>
          <p>Earthquakes in feed: <strong className="text-text">{earthquakesError ? "Unavailable" : earthquakes.length}</strong></p>
          <p>Retrieved: <strong className="text-text">{retrievedAt}</strong></p>
        </div>
      </Panel>
    </div>
  );
}

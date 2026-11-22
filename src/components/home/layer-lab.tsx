"use client";

import { useState } from "react";
import { GlobeMount } from "@/components/globe/globe-mount";
import type { ImageryLayer } from "@/lib/types";

export function LayerLab({ layers }: { layers: ImageryLayer[] }) {
  const [activeId, setActiveId] = useState(layers[0]?.id ?? "");
  const active = layers.find((layer) => layer.id === activeId) ?? layers[0];

  if (layers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
        Satellite layers could not be verified against NASA GIBS right now, so none are displayed.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="relative h-[420px] overflow-hidden rounded-2xl border border-line sm:h-[520px]">
        <GlobeMount
          imageryLayers={layers}
          basemap={activeId}
          imageryDate={active?.availableDates.at(-1) ?? undefined}
          autoRotate
          showEvents={false}
          showEarthquakes={false}
          initialView={{ longitude: -30, latitude: 20, zoom: 1.7 }}
          ariaLabel={`Globe showing ${active?.title ?? "satellite imagery"}`}
        />
        <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full border border-line bg-void/60 px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-muted/80 backdrop-blur">
          LAYER LAB · NASA GIBS
        </div>
      </div>

      <div className="flex flex-col">
        <p className="eyebrow mb-3">Observation layer</p>
        <div className="space-y-1.5" role="radiogroup" aria-label="Satellite observation layer">
          {layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              role="radio"
              aria-checked={layer.id === activeId}
              onClick={() => setActiveId(layer.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                layer.id === activeId
                  ? "border-cyan/40 bg-cyan/[0.07]"
                  : "border-line hover:border-line-strong hover:bg-white/[0.03]"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] text-text">{layer.title}</span>
                <span className="block truncate text-[10.5px] text-muted">{layer.variable}</span>
              </span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  layer.id === activeId ? "bg-cyan shadow-[0_0_8px_2px_rgba(87,231,245,0.6)]" : "bg-line-strong"
                }`}
                aria-hidden
              />
            </button>
          ))}
        </div>

        {active ? (
          <div className="mt-4 rounded-xl border border-line bg-panel/60 p-3.5">
            <p className="text-[11.5px] leading-relaxed text-muted">{active.description}</p>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[10.5px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted/70">Cadence</dt>
                <dd className="font-mono text-[10px] text-text/80">{active.cadence}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted/70">Resolution</dt>
                <dd className="text-right font-mono text-[10px] text-text/80">{active.resolution ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted/70">Latest</dt>
                <dd className="font-mono text-[10px] text-text/80">{active.availableDates.at(-1) ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted/70">Available from</dt>
                <dd className="font-mono text-[10px] text-text/80">{active.temporalCoverage.start ?? "—"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[10px] leading-relaxed text-muted/60">{active.legend.text}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

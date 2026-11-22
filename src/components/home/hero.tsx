import Link from "next/link";
import { GlobeMount } from "@/components/globe/globe-mount";
import type { ImageryLayer, NaturalEvent, Earthquake } from "@/lib/types";
import type { GlobalTemperatureBundle } from "@/lib/data/bundles";
import { relativeFromNow } from "@/lib/time";

function latestAnomaly(bundle: GlobalTemperatureBundle | null): { year: number; value: number } | null {
  if (!bundle) return null;
  for (let index = bundle.points.length - 1; index >= 0; index -= 1) {
    const point = bundle.points[index];
    if (point && point.anomalyC !== null) return { year: point.year, value: point.anomalyC };
  }
  return null;
}

export function Hero({
  imagery,
  events,
  earthquakes,
  temperature,
  eventsError,
  earthquakesError,
  imageryError,
}: {
  imagery: ImageryLayer[];
  events: NaturalEvent[];
  earthquakes: Earthquake[];
  temperature: GlobalTemperatureBundle | null;
  eventsError: string | null;
  earthquakesError: string | null;
  imageryError: string | null;
}) {
  const latest = imagery[0]?.availableDates.at(-1) ?? null;
  const anomaly = latestAnomaly(temperature);
  const dayAgo = Date.now() - 86_400_000;
  const significantQuakes = earthquakes.filter((quake) => (quake.magnitude ?? 0) >= 4.5 && new Date(quake.time).getTime() > dayAgo).length;
  const latestEventTime = events.map((event) => event.startedAt).filter(Boolean).sort().at(-1) ?? null;

  return (
    <section className="relative overflow-hidden pt-16">
      <div className="pointer-events-none absolute inset-0 grid-overlay" aria-hidden />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-blue/10 blur-[140px]" aria-hidden />
      <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-cyan/[0.07] blur-[120px]" aria-hidden />

      <div className="relative mx-auto max-w-[1560px] px-5 pb-8 pt-10 sm:px-8 lg:px-10 lg:pt-12">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-2">
          <div className="relative z-20 max-w-[660px] lg:pb-24">
            <p className="eyebrow mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-cyan/60" aria-hidden />
              Planetary intelligence · live Earth observation
            </p>

            <h1 className="display text-balance text-[clamp(2.5rem,5vw,5.15rem)] text-text">
              THE EARTH,
              <br />
              <span className="relative inline-block">
                REIMAGINED
                <span
                  className="absolute -inset-x-1 bottom-1 -z-10 h-[0.18em] bg-gradient-to-r from-cyan/35 via-blue/25 to-transparent blur-[1px]"
                  aria-hidden
                />
              </span>
              <br />
              <span className="text-muted/90">THROUGH DATA.</span>
            </h1>

            <p className="mt-7 max-w-[460px] text-[15.5px] leading-[1.65] text-muted">
              Discover the environmental forces shaping our world. Explore climate, weather, air
              quality, natural events and Earth observation data through one living planetary
              interface.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/explore" className="btn btn-primary h-12 px-6 text-[14px]">
                Explore Earth
                <span aria-hidden className="text-void/60">→</span>
              </Link>
              <Link href="/explore?view=full" className="btn btn-ghost h-12 px-6 text-[14px]">
                Launch Mission Control
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-[11px] text-muted/70">
              <span className="flex items-center gap-2">
                <span className="dot text-aurora" aria-hidden /> Open providers
              </span>
              <span className="h-3 w-px bg-line" aria-hidden />
              <span>Zero fabricated readings</span>
              <span className="h-3 w-px bg-line" aria-hidden />
              <span className="hidden sm:inline">Source-traced to the value</span>
            </div>
          </div>

          <div className="relative">
            <div className="relative h-[56vh] min-h-[380px] overflow-hidden rounded-[28px] border border-line/60 bg-void/40 shadow-[0_60px_160px_-60px_rgba(0,0,0,0.95)] sm:h-[62vh] lg:h-[82vh] lg:min-h-[560px] lg:rounded-none lg:border-0 lg:bg-transparent">
              <GlobeMount
                imageryLayers={imagery}
                imageryDate={latest ?? undefined}
                autoRotate
                initialView={{ longitude: 72, latitude: 16, zoom: 1.5 }}
                showEvents={false}
                showEarthquakes={false}
                showGraticule
                ariaLabel="Rotating globe of Earth showing today's MODIS satellite imagery"
              />

              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
                <span className="rounded-full border border-line bg-void/45 px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-muted/75 backdrop-blur">
                  {imageryError ? "IMAGERY UNAVAILABLE" : `MODIS · ${latest ?? "—"}`}
                </span>
                <span className="rounded-full border border-line bg-void/45 px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-muted/75 backdrop-blur">
                  LIVE VIEW · {new Date().toISOString().slice(11, 16)} UTC
                </span>
              </div>

              {/* floating context panels */}
              <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
                <HeroPanel
                  className="left-2 top-[19%]"
                  label="Global events"
                  value={eventsError ? "—" : String(events.length)}
                  unit="open"
                  caption={
                    eventsError
                      ? "Feed unavailable"
                      : latestEventTime
                        ? `Latest ${relativeFromNow(latestEventTime)} · NASA EONET`
                        : "NASA EONET · last 30 days"
                  }
                  tone="coral"
                />
                <HeroPanel
                  className="right-2 top-[46%]"
                  label="Seismicity"
                  value={earthquakesError ? "—" : String(significantQuakes)}
                  unit="M4.5+ / 24 h"
                  caption={earthquakesError ? "Catalog unavailable" : "USGS · global catalog"}
                  tone="amber"
                />
                <HeroPanel
                  className="bottom-[9%] left-[16%]"
                  label="Climate signal"
                  value={anomaly ? `${anomaly.value > 0 ? "+" : ""}${anomaly.value.toFixed(2)}` : "—"}
                  unit="°C"
                  caption={
                    anomaly
                      ? `${anomaly.year} anomaly vs 1951–1980 · NASA GISTEMP`
                      : "Global index unavailable"
                  }
                  tone="cyan"
                />
              </div>
            </div>

            {/* mobile panels */}
            <div className="mt-3 grid grid-cols-3 gap-2 lg:hidden">
              <MiniStat label="Open events" value={eventsError ? "—" : String(events.length)} note="EONET" />
              <MiniStat label="M4.5+ / 24 h" value={earthquakesError ? "—" : String(significantQuakes)} note="USGS" />
              <MiniStat
                label="Global anomaly"
                value={anomaly ? `${anomaly.value > 0 ? "+" : ""}${anomaly.value.toFixed(2)}` : "—"}
                note="GISTEMP"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4 lg:mt-14">
          <SignalCell
            label="Natural events"
            value={eventsError ? "Unavailable" : `${events.length} open`}
            meta="NASA EONET · 30-day window"
            tone={eventsError ? "muted" : "coral"}
          />
          <SignalCell
            label="Earthquakes"
            value={earthquakesError ? "Unavailable" : `${earthquakes.length} ≥ M2.5`}
            meta="USGS · 30-day catalog"
            tone={earthquakesError ? "muted" : "amber"}
          />
          <SignalCell
            label="Imagery"
            value={latest ? new Date(`${latest}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Unavailable"}
            meta="NASA GIBS · MODIS true colour"
            tone="cyan"
          />
          <SignalCell
            label="Global temperature"
            value={anomaly ? `${anomaly.value > 0 ? "+" : ""}${anomaly.value.toFixed(2)} °C` : "Unavailable"}
            meta="GISTEMP v4 · 1951–1980 base"
            tone="violet"
          />
        </div>
      </div>
    </section>
  );
}

function HeroPanel({
  className,
  label,
  value,
  unit,
  caption,
  tone,
}: {
  className: string;
  label: string;
  value: string;
  unit?: string;
  caption: string;
  tone: "coral" | "amber" | "cyan";
}) {
  const tones = {
    coral: "border-coral/25",
    amber: "border-amber/25",
    cyan: "border-cyan/25",
  };
  return (
    <div className={`absolute ${className} w-[196px] rounded-2xl border bg-void/62 p-3.5 backdrop-blur-md ${tones[tone]}`}>
      <p className="eyebrow mb-1.5">{label}</p>
      <p className="num text-[26px] font-light leading-none tracking-tight text-text">
        {value}
        {unit ? <span className="ml-1.5 text-[10px] tracking-normal text-muted">{unit}</span> : null}
      </p>
      <p className="mt-1.5 text-[10px] leading-snug text-muted/75">{caption}</p>
    </div>
  );
}

function MiniStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/70 px-3 py-2.5">
      <p className="eyebrow mb-1 truncate">{label}</p>
      <p className="num text-[18px] leading-none text-text">{value}</p>
      <p className="mt-1 truncate font-mono text-[8.5px] tracking-[0.12em] text-muted/60 uppercase">{note}</p>
    </div>
  );
}

function SignalCell({
  label,
  value,
  meta,
  tone,
}: {
  label: string;
  value: string;
  meta: string;
  tone: string;
}) {
  const dot: Record<string, string> = {
    coral: "bg-coral",
    amber: "bg-amber",
    cyan: "bg-cyan",
    violet: "bg-violet",
    muted: "bg-muted/50",
  };
  return (
    <div className="bg-void/80 px-4 py-4 sm:px-5">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot[tone] ?? dot.muted}`} aria-hidden />
        <p className="eyebrow">{label}</p>
      </div>
      <p className="num mt-2 text-[16px] font-medium text-text sm:text-[18px]">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted/70">{meta}</p>
    </div>
  );
}

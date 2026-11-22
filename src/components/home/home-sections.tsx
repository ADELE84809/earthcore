import Link from "next/link";
import type { GlobalTemperatureBundle } from "@/lib/data/bundles";
import type { ImageryLayer } from "@/lib/types";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel, Divider } from "@/components/ui/primitives";
import { LayerLab } from "@/components/home/layer-lab";
import { LazyMount } from "@/components/ui/lazy-mount";

const CAPABILITIES = [
  {
    index: "01",
    title: "Weather intelligence",
    href: "/explore",
    description:
      "Hourly and daily forecasts for any coordinate, resolved to the model grid cell and labelled as a forecast — never as a station reading.",
    tag: "Open-Meteo NWP",
  },
  {
    index: "02",
    title: "Climate context",
    href: "/climate",
    description:
      "ERA5 daily reanalysis for local 1991–2020 normals and long-term trends, alongside NASA's global GISTEMP anomaly index.",
    tag: "ERA5 · GISTEMP",
  },
  {
    index: "03",
    title: "Atmospheric composition",
    href: "/atmosphere",
    description:
      "Regional PM2.5, PM10, ozone, nitrogen dioxide, carbon monoxide and dust, with provider-computed air-quality indices.",
    tag: "CAMS",
  },
  {
    index: "04",
    title: "Natural events",
    href: "/events",
    description:
      "Curated wildfire, storm, volcano and flood records from NASA EONET, plus the USGS near-real-time earthquake catalog.",
    tag: "EONET · USGS",
  },
  {
    index: "05",
    title: "Earth observation",
    href: "/explore?layer=MODIS_Terra_CorrectedReflectance_TrueColor",
    description:
      "Time-aware MODIS and VIIRS imagery with acquisition dates resolved live from the imagery service itself.",
    tag: "NASA GIBS",
  },
  {
    index: "06",
    title: "Data coverage",
    href: "/sources",
    description:
      "An explicit account of what is and is not available at a coordinate — including the datasets EarthCore cannot yet reach.",
    tag: "Coverage engine",
  },
] as const;

const TYPES = [
  {
    label: "Observed",
    tone: "text-aurora border-aurora/30",
    body: "An instrument or catalog recorded it. USGS seismicity is observed; a weather model is not.",
  },
  {
    label: "Modelled",
    tone: "text-violet border-violet/30",
    body: "A scientific model computed it for a grid cell. CAMS air quality and ERA5 reanalysis are model output.",
  },
  {
    label: "Forecast",
    tone: "text-cyan border-cyan/30",
    body: "An estimate of future conditions. Open-Meteo hourly values carry an explicit forecast horizon.",
  },
  {
    label: "Satellite-derived",
    tone: "text-blue border-blue/30",
    body: "Retrieved from remote sensing. MODIS reflectance and vegetation indices carry acquisition dates, not surface truth.",
  },
];

function anomalyColor(value: number): string {
  const stops: [number, [number, number, number]][] = [
    [-0.6, [8, 48, 107]],
    [-0.3, [33, 113, 181]],
    [0, [222, 231, 242]],
    [0.4, [244, 165, 130]],
    [0.9, [214, 96, 77]],
    [1.4, [140, 12, 13]],
  ];
  const clamped = Math.min(1.4, Math.max(-0.6, value));
  for (let i = 0; i < stops.length - 1; i += 1) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (clamped >= a && clamped <= b) {
      const t = (clamped - a) / (b - a);
      const mix = ca.map((channel, index) => Math.round(channel + (cb[index] - channel) * t));
      return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
    }
  }
  return "rgb(222,231,242)";
}

export function Capabilities() {
  return (
    <section className="relative border-t border-line">
      <div className="mx-auto max-w-[1560px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionLabel index="01">The platform</SectionLabel>
            <h2 className="display mt-5 max-w-[420px] text-balance text-[clamp(2rem,3.6vw,3.4rem)] text-text">
              Six systems. One planetary interface.
            </h2>
            <p className="mt-5 max-w-[400px] text-[14px] leading-relaxed text-muted">
              EarthCore is not a collection of widgets. It is one continuous view of the planet:
              every reading tied to a provider, a timestamp and a stated measurement type.
            </p>
            <Link href="/sources" className="btn btn-ghost mt-7 h-10 px-4 text-[12.5px]">
              Read the methodology
              <span aria-hidden className="text-cyan">↗</span>
            </Link>
          </div>

          <ul className="divide-y divide-line border-y border-line">
            {CAPABILITIES.map((item, index) => (
              <Reveal key={item.index} as="li" delay={index * 45}>
                <Link
                  href={item.href}
                  className="group grid grid-cols-[42px_1fr] gap-4 py-5 transition-colors hover:bg-white/[0.02] sm:grid-cols-[54px_1fr_auto] sm:gap-6 sm:px-3"
                >
                  <span className="num pt-1 font-mono text-[11px] text-muted/50">{item.index}</span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[16px] font-medium tracking-[-0.01em] text-text sm:text-[18px]">
                        {item.title}
                      </span>
                      <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[8.5px] tracking-[0.12em] text-muted/70 uppercase">
                        {item.tag}
                      </span>
                    </span>
                    <span className="mt-1.5 block max-w-[520px] text-[12.5px] leading-relaxed text-muted/90">
                      {item.description}
                    </span>
                  </span>
                  <span
                    className="hidden self-center text-muted/40 transition-all group-hover:translate-x-1 group-hover:text-cyan sm:block"
                    aria-hidden
                  >
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ClimateSignal({ bundle }: { bundle: GlobalTemperatureBundle | null }) {
  const points = bundle?.points ?? [];
  const complete = points.filter((point) => point.anomalyC !== null) as { year: number; anomalyC: number }[];
  const latest = complete.at(-1) ?? null;
  const warmest = complete.reduce<{ year: number; anomalyC: number } | null>((best, point) => {
    if (!best || point.anomalyC > best.anomalyC) return point;
    return best;
  }, null);
  const first = complete[0] ?? null;

  return (
    <section className="relative overflow-hidden border-t border-line bg-navy/40">
      <div className="pointer-events-none absolute -right-32 top-0 h-[480px] w-[480px] rounded-full bg-violet/[0.06] blur-[140px]" aria-hidden />
      <div className="mx-auto max-w-[1560px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionLabel index="02">Climate signal</SectionLabel>
            <h2 className="display mt-5 max-w-[420px] text-balance text-[clamp(2rem,3.6vw,3.4rem)] text-text">
              The long signal, not today&apos;s weather.
            </h2>
            <p className="mt-5 max-w-[430px] text-[14px] leading-relaxed text-muted">
              A hot afternoon is weather. Climate is the statistics of decades, measured against a
              stated baseline. EarthCore keeps those two things separate — and shows you exactly
              which one you are looking at.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6 border-y border-line py-5">
              <div>
                <p className="eyebrow mb-1.5">Latest complete year</p>
                <p className="num text-[30px] font-light leading-none text-text">
                  {latest ? `${latest.anomalyC > 0 ? "+" : ""}${latest.anomalyC.toFixed(2)}` : "—"}
                  <span className="ml-1.5 text-[13px] text-muted">°C</span>
                </p>
                <p className="mt-1 text-[10.5px] text-muted/70">
                  {latest ? `${latest.year} anomaly` : "Unavailable"} · GISTEMP v4
                </p>
              </div>
              <div>
                <p className="eyebrow mb-1.5">Warmest year on record</p>
                <p className="num text-[30px] font-light leading-none text-text">
                  {warmest ? `${warmest.anomalyC > 0 ? "+" : ""}${warmest.anomalyC.toFixed(2)}` : "—"}
                  <span className="ml-1.5 text-[13px] text-muted">°C</span>
                </p>
                <p className="mt-1 text-[10.5px] text-muted/70">
                  {warmest ? warmest.year : "—"} · of {complete.length} annual values
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-[430px] text-[11px] leading-relaxed text-muted/70">
              Anomalies are relative to the 1951–1980 base period, the reference used by NASA
              GISTEMP. A global index cannot be attributed to any single city; EarthCore never
              derives a local anomaly by subtracting today&apos;s weather from an arbitrary value.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/climate" className="btn btn-primary h-11 px-5 text-[13px]">
                Open the climate record
              </Link>
              <Link href="/sources#methodology" className="btn btn-ghost h-11 px-4 text-[12.5px]">
                Baselines & methodology
              </Link>
            </div>
          </div>

          <Reveal delay={120}>
            <div className="rounded-2xl border border-line bg-panel/50 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-text">Annual global temperature anomaly</p>
                  <p className="mt-0.5 text-[10.5px] text-muted">
                    {complete.length} years · NASA GISTEMP v4 · base 1951–1980
                  </p>
                </div>
                <span className="rounded-full border border-violet/30 px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] text-violet uppercase">
                  Reconstructed index
                </span>
              </div>

              <div className="mt-5 overflow-hidden rounded-lg">
                {complete.length > 0 ? (
                  <div className="flex h-16 w-full gap-px sm:h-20" role="img" aria-label="Warming stripes: annual global temperature anomaly from 1880 to the present">
                    {complete.map((point) => (
                      <div
                        key={point.year}
                        className="h-full flex-1"
                        style={{ background: anomalyColor(point.anomalyC) }}
                        title={`${point.year}: ${point.anomalyC > 0 ? "+" : ""}${point.anomalyC.toFixed(2)} °C`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid h-16 place-items-center text-[11px] text-muted sm:h-20">
                    Global temperature index unavailable
                  </div>
                )}
                <div className="mt-2 flex justify-between font-mono text-[9.5px] text-muted/60">
                  <span>{first?.year ?? "1880"}</span>
                  <span>{latest?.year ?? "present"}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-[9px] text-muted/70">
                  <span>−0.6 °C</span>
                  <span
                    className="h-1.5 w-24 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #08306B, #2171B5, #DEE7F2, #F4A582, #D6604D, #8C0C0D)",
                    }}
                    aria-hidden
                  />
                  <span>+1.4 °C</span>
                </div>
                <span className="font-mono text-[9px] text-muted/50">SOURCE: NASA GISS</span>
              </div>

              {bundle ? (
                <p className="mt-4 border-t border-line pt-3 text-[10px] leading-relaxed text-muted/60">
                  {bundle.note} Retrieved {bundle.retrievedAt.slice(0, 16).replace("T", " ")} UTC.
                </p>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function LayerSection({ layers }: { layers: ImageryLayer[] }) {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-[1560px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[520px]">
            <SectionLabel index="03">Earth observation</SectionLabel>
            <h2 className="display mt-5 text-balance text-[clamp(1.9rem,3.4vw,3.2rem)] text-text">
              The planet, in six verified layers.
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
              Every layer is checked against the imagery service&apos;s own availability domain
              before it appears. If a product has no data for a date, EarthCore says so.
            </p>
          </div>
          <Link href="/explore" className="btn btn-ghost h-10 px-4 text-[12.5px]">
            Open layer controls
            <span aria-hidden className="text-cyan">↗</span>
          </Link>
        </div>

        <div className="mt-10">
          <LazyMount minHeight="420px">
            <LayerLab layers={layers} />
          </LazyMount>
        </div>
      </div>
    </section>
  );
}

export function Provenance() {
  return (
    <section className="border-t border-line bg-navy/30">
      <div className="mx-auto max-w-[1560px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <SectionLabel index="04">Scientific integrity</SectionLabel>
        <div className="mt-5 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="display max-w-[440px] text-balance text-[clamp(2rem,3.6vw,3.4rem)] text-text">
              Every number has a type.
            </h2>
            <p className="mt-5 max-w-[420px] text-[14px] leading-relaxed text-muted">
              Most environmental dashboards blur the line between a thermometer and a simulation.
              EarthCore classifies every value before it reaches the screen.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "No invented readings, no zero-filling of missing data.",
                "No street-level claims from a regional model grid.",
                "No accuracy percentage that is really a metadata score.",
              ].map((rule) => (
                <div key={rule} className="flex items-start gap-3 border-t border-line pt-4">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" aria-hidden />
                  <p className="text-[12.5px] leading-relaxed text-text/85">{rule}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {TYPES.map((type) => (
              <div key={type.label} className="bg-panel/80 p-5">
                <span className={`inline-block rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] uppercase ${type.tone}`}>
                  {type.label}
                </span>
                <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{type.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SolutionsTeaser() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-[1560px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="panel relative overflow-hidden p-6 sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-aurora/[0.08] blur-[100px]" aria-hidden />
          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <SectionLabel index="05">Solutions Lab</SectionLabel>
              <h2 className="display mt-5 max-w-[460px] text-balance text-[clamp(1.9rem,3.4vw,3.2rem)] text-text">
                Understand the problem. Explore the possibilities.
              </h2>
              <p className="mt-5 max-w-[440px] text-[13.5px] leading-relaxed text-muted">
                Observation is only the beginning. A bounded urban-shade planning tool is on the
                roadmap; it is not yet available. Any future scenario will document its geometry,
                solar assumptions and limits rather than promise a temperature outcome.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/solutions" className="btn btn-primary h-11 px-5 text-[13px]">
                  View the Solutions Lab roadmap
                </Link>
                <span className="self-center text-[10.5px] text-muted/60">
                  Hypothetical scenarios · never a temperature forecast
                </span>
              </div>
            </div>

            <div className="relative">
              <svg viewBox="0 0 520 300" className="w-full" role="img" aria-label="Diagram of a hypothetical urban shade scenario with a shadow footprint">
                <defs>
                  <linearGradient id="shade-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#57E7F5" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4B8EFF" stopOpacity="0.05" />
                  </linearGradient>
                  <pattern id="shade-grid" width="26" height="26" patternUnits="userSpaceOnUse">
                    <path d="M26 0H0V26" fill="none" stroke="rgba(180,210,255,0.10)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="520" height="300" rx="16" fill="url(#shade-grid)" />
                <g stroke="rgba(180,210,255,0.35)" strokeWidth="1">
                  {[
                    [70, 150, 46, 90],
                    [140, 120, 34, 120],
                    [196, 168, 52, 72],
                    [270, 96, 40, 144],
                    [330, 140, 56, 100],
                    [404, 112, 38, 128],
                  ].map(([x, y, w, h], index) => (
                    <rect key={index} x={x} y={y} width={w} height={h} rx="2" fill="rgba(18,36,58,0.9)" />
                  ))}
                </g>
                <polygon
                  points="140,240 196,240 236,292 150,292"
                  fill="url(#shade-grad)"
                  stroke="#57E7F5"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
                <line x1="140" y1="240" x2="196" y2="240" stroke="#3BE0AE" strokeWidth="2" />
                <text x="168" y="232" fill="#3BE0AE" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
                  SHADE FOOTPRINT
                </text>
                <text x="168" y="272" fill="rgba(245,249,255,0.55)" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  HYPOTHETICAL
                </text>
                <g fontFamily="monospace" fontSize="8" fill="rgba(162,178,200,0.65)" letterSpacing="1">
                  <text x="18" y="26">SCENARIO 01 · URBAN CANOPY</text>
                  <text x="18" y="286">SOLAR GEOMETRY · 21 JUN · 14:00 LOCAL</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-line">
      <div className="starfield absolute inset-0 opacity-40" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[880px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(87,231,245,0.09),transparent_65%)]" aria-hidden />
      <div className="relative mx-auto max-w-[1560px] px-5 py-24 text-center sm:px-8 lg:px-10 lg:py-32">
        <SectionLabel className="justify-center">The planet is producing data every second</SectionLabel>
        <h2 className="display mx-auto mt-6 max-w-[900px] text-balance text-[clamp(2.2rem,5vw,4.6rem)] text-text">
          EarthCore helps you read it.
        </h2>
        <p className="mx-auto mt-6 max-w-[520px] text-[14px] leading-relaxed text-muted">
          One planet. Infinite intelligence. Every reading traced, every limitation stated.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/explore" className="btn btn-primary h-12 px-7 text-[14px]">
            Enter Mission Control
            <span aria-hidden className="text-void/60">→</span>
          </Link>
          <Link href="/sources" className="btn btn-ghost h-12 px-6 text-[13px]">
            See where the data comes from
          </Link>
        </div>
        <Divider className="mx-auto mt-16 max-w-[640px]" />
        <p className="mt-5 font-mono text-[9.5px] tracking-[0.22em] text-muted/50 uppercase">
          One planet · Infinite intelligence
        </p>
      </div>
    </section>
  );
}

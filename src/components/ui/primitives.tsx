import type { ReactNode } from "react";
import type { MeasurementClass, QualityFlag } from "@/lib/types";

export function SectionLabel({
  index,
  children,
  className = "",
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${className}`}>
      {index ? (
        <span className="text-cyan/80 tabular-nums" aria-hidden>
          {index}
        </span>
      ) : null}
      <span className="h-px w-6 bg-line-strong" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function Panel({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`panel p-5 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

const CLASS_LABEL: Record<MeasurementClass, string> = {
  observed: "Observed",
  modeled: "Modelled",
  forecast: "Forecast",
  "satellite-derived": "Satellite",
  "historical-reconstruction": "Reconstruction",
  calculated: "Calculated",
  scenario: "Scenario",
};

const CLASS_TONE: Record<MeasurementClass, string> = {
  observed: "border-aurora/35 text-aurora bg-aurora/5",
  modeled: "border-violet/35 text-violet bg-violet/5",
  forecast: "border-cyan/35 text-cyan bg-cyan/5",
  "satellite-derived": "border-blue/35 text-blue bg-blue/5",
  "historical-reconstruction": "border-amber/35 text-amber bg-amber/5",
  calculated: "border-text/25 text-text/80 bg-white/5",
  scenario: "border-coral/35 text-coral bg-coral/5",
};

export function MeasurementTypeBadge({ type }: { type: MeasurementClass }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9.5px] tracking-[0.12em] uppercase ${CLASS_TONE[type]}`}
    >
      {CLASS_LABEL[type]}
    </span>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "good" | "moderate" | "high" | "very-high" | "hazardous" | "neutral";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    good: "border-aurora/40 text-aurora bg-aurora/10",
    moderate: "border-amber/40 text-amber bg-amber/10",
    high: "border-coral/40 text-coral bg-coral/10",
    "very-high": "border-coral/60 text-coral bg-coral/15",
    hazardous: "border-coral/80 text-[#FFB4B4] bg-coral/20",
    neutral: "border-line text-muted bg-white/5",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      <span className="dot" aria-hidden />
      {children}
    </span>
  );
}

export function MetricReadout({
  label,
  value,
  unit,
  note,
  accent = "text-text",
  size = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  note?: ReactNode;
  accent?: string;
  size?: "sm" | "default" | "lg";
}) {
  const valueSize = size === "lg" ? "text-[42px] sm:text-[52px]" : size === "sm" ? "text-[20px]" : "text-[30px]";
  return (
    <div className="min-w-0">
      <p className="eyebrow mb-1.5">{label}</p>
      <p className={`num font-light leading-none tracking-[-0.04em] ${accent} ${valueSize}`}>
        {value}
        {unit ? <span className="ml-1.5 text-[0.42em] font-normal tracking-normal text-muted">{unit}</span> : null}
      </p>
      {note ? <div className="mt-2 text-[11.5px] leading-snug text-muted/80">{note}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gradient-to-r from-white/[0.05] via-white/[0.09] to-white/[0.05] ${className}`}
      style={{ backgroundSize: "200% 100%", animation: "shimmer 1.8s linear infinite" }}
      aria-hidden
    />
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center">
      <p className="text-[13px] font-medium text-text">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted">{body}</p>
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}

const FLAG_LABEL: Record<QualityFlag, string> = {
  "model-grid": "Model grid",
  stale: "Possibly stale",
  "partial-coverage": "Partial coverage",
  "indicative-derivation": "Indicative derivation",
  "scenario-dependent": "Scenario dependent",
  "nearest-grid-cell": "Nearest grid cell",
};

export function QualityFlags({ flags }: { flags: QualityFlag[] | undefined }) {
  if (!flags || flags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Data quality notes">
      {flags.map((flag) => (
        <li
          key={flag}
          className="rounded border border-line px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-muted uppercase"
        >
          {FLAG_LABEL[flag]}
        </li>
      ))}
    </ul>
  );
}

export function SourceNote({
  attribution,
  validAt,
  retrievedAt,
  type,
  note,
  flags,
}: {
  attribution: string;
  validAt?: string | null;
  retrievedAt?: string | null;
  type?: MeasurementClass;
  note?: string | null;
  flags?: QualityFlag[];
}) {
  return (
    <div className="space-y-2 border-t border-line pt-3 text-[10.5px] leading-relaxed text-muted/80">
      <div className="flex flex-wrap items-center gap-2">
        {type ? <MeasurementTypeBadge type={type} /> : null}
        <span>{attribution}</span>
      </div>
      {validAt || retrievedAt ? (
        <p className="font-mono text-[9.5px] tracking-wide text-muted/60">
          {validAt ? <>VALID {validAt.slice(0, 16).replace("T", " ")} UTC</> : null}
          {validAt && retrievedAt ? <span className="mx-2 text-muted/30">·</span> : null}
          {retrievedAt ? <>RETRIEVED {retrievedAt.slice(11, 16)} UTC</> : null}
        </p>
      ) : null}
      {note ? <p className="text-muted/70">{note}</p> : null}
      <QualityFlags flags={flags} />
    </div>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-line ${className}`} aria-hidden />;
}

export function KeyFigure({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="border-l border-line pl-4">
      <p className="num text-[26px] font-light leading-none tracking-tight text-text">{value}</p>
      <p className="mt-1.5 text-[11px] text-muted">{label}</p>
      {sub ? <p className="mt-0.5 font-mono text-[9.5px] text-muted/60">{sub}</p> : null}
    </div>
  );
}

"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";

const TICK = { fill: "rgba(162,178,200,0.72)", fontSize: 10, fontFamily: "var(--font-geist-mono)" };
const GRID = "rgba(180,210,255,0.075)";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
}

function tooltipStyle() {
  return {
    contentStyle: {
      background: "rgba(7,16,28,0.94)",
      border: "1px solid rgba(180,210,255,0.18)",
      borderRadius: 12,
      padding: "10px 12px",
      backdropFilter: "blur(12px)",
      fontSize: 11,
      color: "#F5F9FF",
    },
    labelStyle: { color: "rgba(162,178,200,0.9)", fontSize: 10, marginBottom: 6, fontFamily: "var(--font-geist-mono)" },
    itemStyle: { color: "#F5F9FF" },
    cursor: { stroke: "rgba(180,210,255,0.25)", strokeWidth: 1 },
  };
}

export function LineChart({
  data,
  series,
  height = 220,
  unit = "",
  decimals = 1,
  yDomain,
  xKey = "label",
}: {
  data: Array<Record<string, string | number | null>>;
  series: ChartSeries[];
  height?: number;
  unit?: string;
  decimals?: number;
  yDomain?: [number | string, number | string];
  xKey?: string;
}) {
  return (
    <div style={{ width: "100%", height }} className="text-[10px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            domain={yDomain as never}
            tickFormatter={(value: number) => `${Number(value).toFixed(decimals)}${unit ? `°` : ""}`}
          />
          <Tooltip
            {...tooltipStyle()}
            formatter={(value: unknown, name: unknown) => {
              if (value === null || value === undefined) return ["—", String(name)];
              return [`${Number(value).toFixed(decimals)} ${unit}`.trim(), String(name)];
            }}
            labelFormatter={(label: unknown) => String(label)}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={1.6}
              strokeDasharray={s.dashed ? "4 4" : undefined}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: s.color }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DivergingBarChart({
  data,
  height = 260,
  positiveColor = "#F07878",
  negativeColor = "#4B8EFF",
  unit = "°C",
  decimals = 2,
}: {
  data: Array<{ label: string; value: number | null }>;
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
  unit?: string;
  decimals?: number;
}) {
  return (
    <div style={{ width: "100%", height }} className="text-[10px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tick={TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}`}
          />
          <ReferenceLine y={0} stroke="rgba(180,210,255,0.4)" strokeWidth={1} />
          <Tooltip
            {...tooltipStyle()}
            cursor={{ fill: "rgba(180,210,255,0.06)" }}
            formatter={(value: unknown) => {
              if (value === null || value === undefined) return ["—", "Anomaly"];
              const numeric = Number(value);
              const sign = numeric > 0 ? "+" : "";
              return [`${sign}${numeric.toFixed(decimals)} ${unit}`, "Anomaly"];
            }}
          />
          <Bar dataKey="value" isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={entry.value !== null && entry.value < 0 ? negativeColor : positiveColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartSimple({
  data,
  height = 220,
  color = "#57E7F5",
  unit = "",
  decimals = 1,
}: {
  data: Array<{ label: string; value: number | null }>;
  height?: number;
  color?: string;
  unit?: string;
  decimals?: number;
}) {
  return (
    <div style={{ width: "100%", height }} className="text-[10px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} />
          <YAxis
            tick={TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value: number) => value.toFixed(0)}
          />
          <Tooltip
            {...tooltipStyle()}
            cursor={{ fill: "rgba(180,210,255,0.06)" }}
            formatter={(value: unknown) =>
              value === null || value === undefined
                ? ["—", "Value"]
                : [`${Number(value).toFixed(decimals)} ${unit}`, "Value"]
            }
          />
          <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({
  values,
  color = "#57E7F5",
  width = 96,
  height = 28,
}: {
  values: (number | null)[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const clean = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (clean.length < 2) return null;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;
  const step = width / (clean.length - 1);
  const path = clean
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function ChartFrame({
  title,
  subtitle,
  legend,
  children,
  aside,
}: {
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[12.5px] font-medium text-text">{title}</p>
          {subtitle ? <p className="mt-0.5 text-[10.5px] text-muted">{subtitle}</p> : null}
        </div>
        {aside ?? legend}
      </figcaption>
      {children}
    </figure>
  );
}

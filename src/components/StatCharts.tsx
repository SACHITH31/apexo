import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProgressionPoint } from "@/lib/f1-extra.server";

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
} as const;

function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface/95 px-3 py-2 shadow-xl backdrop-blur">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <ul className="mt-1 space-y-0.5">
        {payload.map((p: any) => (
          <li key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-timing tabular-nums text-foreground">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface Series {
  key: string;
  name: string;
  color: string;
}

function toRows(points: ProgressionPoint[], series: Series[]) {
  return points.map((p) => {
    const row: Record<string, string | number> = { label: p.label };
    for (const s of series) row[s.key] = p.values[s.key] ?? 0;
    return row;
  });
}

/** Championship points progression across the season. */
export function ProgressionChart({
  points,
  series,
  invertY = false,
  height = 320,
}: {
  points: ProgressionPoint[];
  series: Series[];
  invertY?: boolean;
  height?: number;
}) {
  const data = toRows(points, series);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...axis} reversed={invertY} allowDecimals={false} width={36} />
          <Tooltip content={<TooltipBox />} cursor={{ stroke: "var(--border)" }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive
              animationDuration={900}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Cumulative team points, drawn as stacked-feeling gradient areas. */
export function TeamAreaChart({
  points,
  series,
  height = 320,
}: {
  points: ProgressionPoint[];
  series: Series[];
  height?: number;
}) {
  const data = toRows(points, series);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={16} />
          <YAxis {...axis} allowDecimals={false} width={36} />
          <Tooltip content={<TooltipBox />} cursor={{ stroke: "var(--border)" }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#fill-${s.key})`}
              isAnimationActive
              animationDuration={900}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Simple ranked bar chart used for wins, poles, DNFs, etc. */
export function RankedBarChart({
  data,
  height = 320,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="name" {...axis} interval={0} angle={-40} textAnchor="end" height={56} />
          <YAxis {...axis} allowDecimals={false} width={36} />
          <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--surface)", opacity: 0.4 }} />
          <Bar dataKey="value" name="Total" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

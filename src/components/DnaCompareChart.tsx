import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { DnaMetric } from "@/lib/f1-dna";

/** Lazy-loaded overlay radar for two F1 DNA profiles. */
export default function DnaCompareChart({
  left,
  right,
  leftName,
  rightName,
  leftColor,
  rightColor,
  animate = true,
  height = 340,
}: {
  left: DnaMetric[];
  right: DnaMetric[];
  leftName: string;
  rightName: string;
  leftColor: string;
  rightColor: string;
  animate?: boolean;
  height?: number;
}) {
  const rightByKey = new Map(right.map((m) => [m.key, m.value]));
  const data = left.map((m) => ({
    label: m.label,
    a: m.value,
    b: rightByKey.get(m.key) ?? 0,
  }));

  return (
    <div style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 9 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <div className="rounded-xl border border-border bg-surface/95 px-3 py-2 shadow-xl backdrop-blur">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {payload[0].payload.label}
                  </div>
                  <div className="mt-1 flex items-center gap-3 font-timing tabular-nums text-sm">
                    <span style={{ color: leftColor }}>{payload[0].payload.a}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span style={{ color: rightColor }}>{payload[0].payload.b}</span>
                  </div>
                </div>
              ) : null
            }
          />
          <Radar
            name={leftName}
            dataKey="a"
            stroke={leftColor}
            fill={leftColor}
            fillOpacity={0.22}
            strokeWidth={2}
            isAnimationActive={animate}
            animationDuration={900}
          />
          <Radar
            name={rightName}
            dataKey="b"
            stroke={rightColor}
            fill={rightColor}
            fillOpacity={0.16}
            strokeWidth={2}
            isAnimationActive={animate}
            animationDuration={900}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

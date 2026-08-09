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

/** Lazy-loaded chart body for the F1 DNA panel. */
export default function DnaRadarChart({
  metrics,
  accent,
  animate = true,
  height = 300,
}: {
  metrics: DnaMetric[];
  accent: string;
  animate?: boolean;
  height?: number;
}) {
  const data = metrics.map((m) => ({ label: m.label, value: m.value }));

  return (
    <div style={{ height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <div className="rounded-xl border border-border bg-surface/95 px-3 py-2 shadow-xl backdrop-blur">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {payload[0].payload.label}
                  </div>
                  <div className="font-timing tabular-nums text-lg">{payload[0].value}</div>
                </div>
              ) : null
            }
          />
          <Radar
            dataKey="value"
            stroke={accent}
            fill={accent}
            fillOpacity={0.26}
            strokeWidth={2}
            isAnimationActive={animate}
            animationDuration={900}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

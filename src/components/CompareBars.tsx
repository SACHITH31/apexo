import { useId } from "react";
import { AnimatedNumber } from "./AnimatedNumber";

export interface CompareMetric {
  label: string;
  left: number;
  right: number;
  decimals?: number;
  suffix?: string;
  /** false when a lower number is the better result (avg finish, avg grid). */
  higherIsBetter?: boolean;
  hint?: string;
}

/**
 * Animated head-to-head bar. Shared by Driver vs Driver and Team vs Team so
 * both comparisons behave and animate identically.
 */
export function CompareRow({
  metric,
  leftColor,
  rightColor,
}: {
  metric: CompareMetric;
  leftColor: string;
  rightColor: string;
}) {
  const { label, left, right, decimals = 0, suffix = "", higherIsBetter = true, hint } = metric;
  const id = useId();
  const max = Math.max(Math.abs(left), Math.abs(right), 0.0001);
  const leftPct = (Math.abs(left) / max) * 100;
  const rightPct = (Math.abs(right) / max) * 100;

  const leftWins = higherIsBetter ? left > right : left < right && left > 0;
  const rightWins = higherIsBetter ? right > left : right < left && right > 0;

  const diff = Math.abs(left - right);
  const base = Math.min(Math.abs(left), Math.abs(right));
  const pct = base > 0 ? (diff / base) * 100 : 0;

  return (
    <div className="py-3.5" role="group" aria-labelledby={id}>
      <div className="flex items-baseline justify-between gap-3">
        <div
          className={
            "font-timing tabular-nums text-2xl transition-colors " +
            (leftWins ? "text-foreground" : "text-muted-foreground")
          }
        >
          <AnimatedNumber value={left} decimals={decimals} suffix={suffix} />
        </div>
        <div
          id={id}
          className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground text-center"
        >
          {label}
          {hint && <span className="block normal-case tracking-normal text-[10px] opacity-70">{hint}</span>}
        </div>
        <div
          className={
            "font-timing tabular-nums text-2xl transition-colors " +
            (rightWins ? "text-foreground" : "text-muted-foreground")
          }
        >
          <AnimatedNumber value={right} decimals={decimals} suffix={suffix} />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-surface/70 overflow-hidden flex justify-end">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${leftPct}%`,
              background: leftColor,
              opacity: leftWins ? 1 : 0.5,
              boxShadow: leftWins ? `0 0 14px ${leftColor}66` : undefined,
            }}
          />
        </div>
        <div className="w-px h-4 bg-border" aria-hidden />
        <div className="flex-1 h-2 rounded-full bg-surface/70 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${rightPct}%`,
              background: rightColor,
              opacity: rightWins ? 1 : 0.5,
              boxShadow: rightWins ? `0 0 14px ${rightColor}66` : undefined,
            }}
          />
        </div>
      </div>

      {diff > 0 && (
        <div className="mt-1.5 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Δ {diff.toFixed(decimals)}
          {suffix}
          {base > 0 && pct < 10000 ? ` · ${pct.toFixed(0)}%` : ""}
        </div>
      )}
    </div>
  );
}

export function CompareList({
  metrics,
  leftColor,
  rightColor,
}: {
  metrics: CompareMetric[];
  leftColor: string;
  rightColor: string;
}) {
  return (
    <div className="glass rounded-2xl px-5 sm:px-8 py-2 divide-y divide-border">
      {metrics.map((m) => (
        <CompareRow key={m.label} metric={m} leftColor={leftColor} rightColor={rightColor} />
      ))}
    </div>
  );
}

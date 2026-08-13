import { lazy, Suspense, useEffect, useState } from "react";
import { Activity, BarChart3 } from "lucide-react";
import type { DnaProfile } from "@/lib/f1-dna";
import { dnaBand } from "@/lib/f1-dna";
import { Skeleton } from "@/components/Skeletons";

const CompareBody = lazy(() => import("./DnaCompareChart"));

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const avg = (p: DnaProfile) =>
  Math.round(p.metrics.reduce((a, m) => a + m.value, 0) / Math.max(1, p.metrics.length));

/** Side-by-side F1 DNA fingerprints for two entities, radar or bars. */
export function DnaCompare({
  left,
  right,
  leftName,
  rightName,
  leftColor,
  rightColor,
}: {
  left: DnaProfile;
  right: DnaProfile;
  leftName: string;
  rightName: string;
  leftColor: string;
  rightColor: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"radar" | "bars">("radar");
  useEffect(() => setMounted(true), []);

  if (!left.metrics.length || !right.metrics.length) return null;

  const rightByKey = new Map(right.metrics.map((m) => [m.key, m.value]));
  const a = avg(left);
  const b = avg(right);

  return (
    <section className="relative min-w-0 overflow-hidden glass rounded-2xl p-5 sm:p-6" aria-labelledby="dna-compare-heading">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />

      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-start">
        <div className="min-w-0">
          <div id="dna-compare-heading" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Activity className="h-3 w-3" /> F1 DNA compare
          </div>
          <h2 className="mt-1 font-display text-xl leading-tight sm:truncate sm:text-2xl">Performance fingerprints</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            <span style={{ color: leftColor }}>{leftName}</span> vs <span style={{ color: rightColor }}>{rightName}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:ml-auto">
          <div className="text-right">
            <div className="flex items-baseline gap-2 font-timing tabular-nums text-2xl leading-none">
              <span style={{ color: leftColor }}>{a}</span>
              <span className="text-xs text-muted-foreground">vs</span>
              <span style={{ color: rightColor }}>{b}</span>
            </div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
              {dnaBand(a)} · {dnaBand(b)}
            </div>
          </div>
          <div className="flex rounded-full border border-border bg-surface/60 p-0.5" role="group" aria-label="DNA compare view">
            {(["radar", "bars"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={
                  "flex h-8 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors " +
                  (view === v ? "bg-surface text-foreground" : "hover:text-foreground")
                }
              >
                {v === "radar" ? <Activity className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                <span className="sr-only">{v === "radar" ? "Radar view" : "Bar view"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-5 min-w-0">
        {view === "radar" && mounted ? (
          <Suspense fallback={<Skeleton className="h-[340px] w-full rounded-xl" />}>
            <CompareBody
              left={left.metrics}
              right={right.metrics}
              leftName={leftName}
              rightName={rightName}
              leftColor={leftColor}
              rightColor={rightColor}
              animate={!prefersReducedMotion()}
            />
          </Suspense>
        ) : (
          <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
            {left.metrics.map((m) => {
              const bv = rightByKey.get(m.key) ?? 0;
              const total = Math.max(1, m.value + bv);
              return (
                <li key={m.key} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-timing tabular-nums text-sm" style={{ color: leftColor }}>{m.value}</span>
                    <span className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{m.label}</span>
                    <span className="font-timing tabular-nums text-sm" style={{ color: rightColor }}>{bv}</span>
                  </div>
                  <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-surface/70">
                    <span style={{ width: `${(m.value / total) * 100}%`, background: leftColor }} />
                    <span style={{ width: `${(bv / total) * 100}%`, background: rightColor }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

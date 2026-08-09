import { lazy, Suspense, useEffect, useState } from "react";
import type { DnaMetric, DnaProfile } from "@/lib/f1-dna";
import { dnaBand } from "@/lib/f1-dna";
import { Skeleton } from "@/components/Skeletons";
import { Activity, BarChart3 } from "lucide-react";

const RadarBody = lazy(() => import("./DnaRadarChart"));

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Segmented-bar fallback — always renders, no chart runtime required. */
export function DnaBars({ metrics, accent }: { metrics: DnaMetric[]; accent: string }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {metrics.map((m) => (
        <li key={m.key}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{m.label}</span>
            <span className="font-timing tabular-nums text-sm">{m.value}</span>
          </div>
          <div
            className="mt-1.5 flex gap-1"
            role="img"
            aria-label={`${m.label}: ${m.value} out of 100 — ${dnaBand(m.value)}`}
          >
            {Array.from({ length: 10 }).map((_, i) => {
              const on = m.value >= (i + 1) * 10 - 5;
              return (
                <span
                  key={i}
                  className={"h-2 flex-1 rounded-full transition-colors " + (on ? "" : "bg-surface/70 border border-border")}
                  style={on ? { background: accent, opacity: 0.45 + i * 0.055 } : undefined}
                />
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * F1 DNA — Apexo's signature performance fingerprint. Renders a Recharts radar
 * on the client and degrades to segmented bars during SSR, while the chart
 * loads, or whenever the user prefers bars.
 */
export function DnaPanel({
  title,
  subtitle,
  profile,
  accent,
  defaultView = "radar",
}: {
  title: string;
  subtitle?: string;
  profile: DnaProfile;
  accent: string;
  defaultView?: "radar" | "bars";
}) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"radar" | "bars">(defaultView);

  useEffect(() => setMounted(true), []);

  const average = Math.round(
    profile.metrics.reduce((a, m) => a + m.value, 0) / Math.max(1, profile.metrics.length),
  );

  if (!profile.metrics.length) {
    return (
      <section className="glass rounded-2xl p-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">F1 DNA</div>
        <p className="mt-3 text-sm text-muted-foreground">
          Not enough data yet to build a performance profile. Check back once the season is underway.
        </p>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden glass rounded-2xl p-6 hover-lift"
      aria-labelledby="dna-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-10 blur-3xl" style={{ background: accent }} />

      <div className="relative flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <div id="dna-heading" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Activity className="h-3 w-3" /> F1 DNA
          </div>
          <h3 className="mt-1 font-display text-2xl leading-none">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <div className="font-timing tabular-nums text-3xl leading-none" style={{ color: accent }}>{average}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{dnaBand(average)} index</div>
          </div>
          <div className="flex rounded-full border border-border bg-surface/60 p-0.5" role="group" aria-label="DNA view">
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

      <div className="relative mt-5">
        {view === "radar" && mounted ? (
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl" />}>
            <RadarBody metrics={profile.metrics} accent={accent} animate={!prefersReducedMotion()} />
          </Suspense>
        ) : (
          <DnaBars metrics={profile.metrics} accent={accent} />
        )}
      </div>

      {!profile.derived && (
        <p className="relative mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
          Season data is not available yet — this profile uses Apexo's baseline model.
        </p>
      )}
    </section>
  );
}

import type { CareerEntry } from "@/lib/driver-career";
import { STAGE_LABEL } from "@/lib/driver-career";
import { Flag, Medal, Rocket, Timer, Trophy, Users, Zap } from "lucide-react";
import type { ComponentType } from "react";

const ICONS: Record<CareerEntry["stage"], ComponentType<{ className?: string }>> = {
  karting: Zap,
  junior: Rocket,
  f3: Timer,
  f2: Timer,
  debut: Flag,
  team: Users,
  win: Medal,
  title: Trophy,
  milestone: Medal,
  current: Users,
};

/**
 * Animated vertical career timeline. Each node fades up in sequence; the
 * stagger is removed automatically under prefers-reduced-motion via the
 * shared animation utilities.
 */
export function CareerTimeline({ entries, accent }: { entries: CareerEntry[]; accent: string }) {
  if (!entries.length) {
    return (
      <p className="rounded-2xl border border-border bg-surface/40 p-6 text-sm text-muted-foreground">
        Career history for this driver isn't available yet.
      </p>
    );
  }

  return (
    <ol className="relative ml-2 space-y-4 border-l border-border pl-6">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-px top-0 h-full w-px opacity-60"
        style={{ background: `linear-gradient(to bottom, ${accent}, transparent)` }}
      />
      {entries.map((e, i) => {
        const Icon = ICONS[e.stage] ?? Flag;
        const highlight = e.stage === "title" || e.stage === "current";
        return (
          <li
            key={`${e.period}-${e.title}-${i}`}
            className="relative animate-slide-up"
            style={{ animationDelay: `${Math.min(i * 60, 480)}ms` }}
          >
            <span
              aria-hidden
              className="absolute -left-[31px] top-1.5 grid h-5 w-5 place-items-center rounded-full border bg-surface"
              style={{ borderColor: accent }}
            >
              <Icon className="h-2.5 w-2.5" />
            </span>
            <div
              className={
                "rounded-xl border p-4 transition-colors " +
                (highlight ? "carbon-texture border-accent/40" : "border-border bg-surface/40")
              }
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-timing tabular-nums text-sm" style={{ color: accent }}>{e.period}</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  {STAGE_LABEL[e.stage]}
                </span>
              </div>
              <div className="mt-1 font-display text-xl leading-tight">{e.title}</div>
              {e.detail && <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

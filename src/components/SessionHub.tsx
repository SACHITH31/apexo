import { useEffect, useState } from "react";
import { CheckCircle2, CircleDot, Clock, Radio } from "lucide-react";
import { FormattedDate } from "./ClientOnly";
import type { Race } from "@/lib/mock-data";

type SessionState = "completed" | "live" | "upcoming";

interface SessionRow {
  key: string;
  label: string;
  iso?: string;
  /** typical broadcast duration in minutes */
  minutes: number;
}

function rowsFor(race: Race): SessionRow[] {
  return [
    { key: "fp1", label: "Practice 1", iso: race.sessions.fp1, minutes: 60 },
    { key: "fp2", label: "Practice 2", iso: race.sessions.fp2, minutes: 60 },
    { key: "fp3", label: "Practice 3", iso: race.sessions.fp3, minutes: 60 },
    { key: "sq", label: "Sprint Qualifying", iso: race.sessions.sprintQuali, minutes: 45 },
    { key: "sprint", label: "Sprint", iso: race.sessions.sprint, minutes: 60 },
    { key: "quali", label: "Qualifying", iso: race.sessions.quali, minutes: 60 },
    { key: "race", label: "Grand Prix", iso: race.sessions.race, minutes: 150 },
  ].filter((r) => Boolean(r.iso)) as SessionRow[];
}

function stateOf(row: SessionRow, now: number): SessionState {
  const start = new Date(row.iso!).getTime();
  const end = start + row.minutes * 60_000;
  if (now >= end) return "completed";
  if (now >= start) return "live";
  return "upcoming";
}

/**
 * Race Weekend Hub — every session on the weekend with its live state.
 * Completed sessions dim, the running session glows, the next one is flagged.
 */
export function SessionHub({ race }: { race: Race }) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const rows = rowsFor(race);
  const mounted = now > 0;
  const states = rows.map((r) => (mounted ? stateOf(r, now) : "upcoming"));
  const nextIndex = mounted ? states.findIndex((s) => s === "upcoming") : -1;
  const liveIndex = states.findIndex((s) => s === "live");

  return (
    <div className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6 hover-lift">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <Clock className="h-3 w-3" /> Weekend hub
        <span className="ml-auto normal-case tracking-normal text-[11px]">
          {rows.length} sessions
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((row, i) => {
          const state = states[i];
          const isCurrent = mounted && (i === liveIndex || (liveIndex === -1 && i === nextIndex));
          return (
            <li key={row.key}>
              <div
                className={
                  "relative flex items-center gap-3 rounded-xl border p-3.5 transition-colors " +
                  (isCurrent
                    ? "border-accent/50 bg-accent/[0.07] shadow-[0_0_24px_-12px_var(--accent)]"
                    : state === "completed"
                      ? "border-border bg-surface/25 opacity-70"
                      : "border-border bg-surface/40")
                }
              >
                {isCurrent && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full accent-line" />}
                <span
                  aria-hidden
                  className={
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border " +
                    (state === "live"
                      ? "border-accent text-accent"
                      : state === "completed"
                        ? "border-border text-muted-foreground"
                        : "border-border text-foreground")
                  }
                >
                  {state === "completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : state === "live" ? (
                    <Radio className="h-4 w-4 animate-pulse-dot" />
                  ) : (
                    <CircleDot className="h-4 w-4" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg leading-tight">{row.label}</div>
                  <div className="text-xs text-muted-foreground">
                    <FormattedDate iso={row.iso!} mode="weekday-datetime" />
                  </div>
                </div>

                <span
                  className={
                    "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest " +
                    (state === "live"
                      ? "border-accent/60 bg-accent/10 text-accent-glow"
                      : state === "completed"
                        ? "border-border text-muted-foreground"
                        : isCurrent
                          ? "border-accent/40 text-accent-glow"
                          : "border-border text-muted-foreground")
                  }
                >
                  {!mounted ? "—" : state === "live" ? "Live" : state === "completed" ? "Done" : isCurrent ? "Up next" : "Upcoming"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

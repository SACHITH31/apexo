import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Crown, Flag, Pause, Play, RotateCcw } from "lucide-react";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { seasonStatsQueryOptions, useSeasonStats } from "@/lib/f1-extra-data";
import { buildChampionshipPlayback, type PlaybackRow } from "@/lib/championship-playback";
import { PageSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useSeasonSelection } from "@/lib/season";

export const Route = createFileRoute("/championship")({
  head: () => ({
    meta: [
      { title: "Championship Playback · Apexo" },
      {
        name: "description",
        content:
          "Replay a Formula 1 season round-by-round: animated driver and constructor standings, leader changes, points swings and title permutations.",
      },
      { property: "og:title", content: "Championship Playback · Apexo" },
      {
        property: "og:description",
        content: "Round-by-round animated replay of the Formula 1 drivers' and constructors' championships.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(seasonQueryOptions());
    context.queryClient.prefetchQuery(seasonStatsQueryOptions());
  },
  component: ChampionshipPlayback,
  pendingComponent: PageSkeleton,
});

const SPEEDS = [0.5, 1, 2] as const;

function ChampionshipPlayback() {
  const season = useSeason();
  const stats = useSeasonStats();
  const { season: year } = useSeasonSelection();
  const rounds = useMemo(() => buildChampionshipPlayback(stats), [stats]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [board, setBoard] = useState<"drivers" | "teams">("drivers");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setIndex(0), [year]);

  useEffect(() => {
    if (!playing || rounds.length === 0) return;
    if (index >= rounds.length - 1) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setIndex((i) => Math.min(i + 1, rounds.length - 1)), 1800 / speed);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, index, speed, rounds.length]);

  if (rounds.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <EmptyState
          title="No completed rounds yet"
          description={`The ${year} championship has not scored any points yet. Pick another season to replay.`}
        />
      </div>
    );
  }

  const current = rounds[Math.min(index, rounds.length - 1)]!;
  const rows = (board === "drivers" ? current.drivers : current.teams).slice(0, 12);
  const max = Math.max(1, rows[0]?.points ?? 1);

  const nameOf = (row: PlaybackRow) =>
    board === "drivers"
      ? `${season.driversById[row.id]?.firstName?.[0] ?? ""}. ${season.driversById[row.id]?.lastName ?? row.id}`
      : teamOf(season, row.id).name;
  const colorOf = (row: PlaybackRow) =>
    teamOf(season, board === "drivers" ? row.constructorId : row.id).color;

  const leader = current.leaderId ? season.driversById[current.leaderId] : undefined;

  return (
    <div className="mx-auto max-w-6xl min-w-0 px-4 sm:px-6 py-6 sm:py-10">
      <header className="relative overflow-hidden rounded-2xl carbon-texture team-aura border border-border p-6 sm:p-8 animate-slide-up">
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="pointer-events-none absolute inset-0 checker-flag opacity-[0.04]" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Championship Playback</p>
          <h1 className="font-display text-4xl sm:text-6xl mt-1">{year} Title Fight</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Replay the season round-by-round. Standings, leader changes and title permutations are recomputed from
            official classified results.
          </p>
        </div>
      </header>

      {/* controls */}
      <section className="mt-6 rounded-2xl glass-elevated border border-border/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { setIndex(0); setPlaying(false); }}
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
            aria-label="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
            aria-label="Previous round"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-2 rounded-full border border-accent/60 bg-accent/15 px-4 py-2 text-xs uppercase tracking-widest text-accent-glow hover-lift"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(rounds.length - 1, i + 1))}
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
            aria-label="Next round"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="ml-auto flex items-center gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={
                  "rounded-full border px-3 py-1.5 font-timing tabular-nums text-xs transition-colors " +
                  (speed === s
                    ? "border-accent/60 bg-accent/15 text-accent-glow"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* jump to round */}
        <div className="mt-4 flex gap-1 overflow-x-auto no-scrollbar pb-1">
          {rounds.map((r, i) => (
            <button
              key={r.round}
              type="button"
              onClick={() => { setIndex(i); setPlaying(false); }}
              title={r.name}
              className={
                "shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] uppercase tracking-widest transition-colors " +
                (i === index
                  ? "border-accent/60 bg-accent/15 text-accent-glow"
                  : i < index
                    ? "border-border/70 bg-surface/60 text-foreground/70"
                    : "border-border/40 text-muted-foreground hover:text-foreground")
              }
            >
              R{r.round}
            </button>
          ))}
        </div>
      </section>

      {/* round summary */}
      <section className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface/40 p-4 sm:col-span-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Flag className="h-3.5 w-3.5" /> Round {current.round} · {current.name}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Crown className="h-5 w-5 text-accent" />
            <span className="font-display text-2xl truncate">
              {leader ? `${leader.firstName} ${leader.lastName}` : current.leaderId ?? "—"}
            </span>
          </div>
          {current.leaderChanged && (
            <p className="mt-1 text-xs text-accent animate-slide-up">New championship leader</p>
          )}
        </div>
        <Metric label="Lead margin" value={current.margin} suffix=" pts" />
        <Metric label="Races remaining" value={current.remaining} />
      </section>

      {current.remaining > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {current.maxAvailable} points still available —{" "}
          {current.titleSwing
            ? "the championship is still mathematically open."
            : "the lead is beyond mathematical reach for P2."}
        </p>
      )}

      {/* board */}
      <section className="mt-6">
        <div className="mb-3 flex gap-1">
          {(["drivers", "teams"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBoard(b)}
              className={
                "rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-widest transition-colors " +
                (board === b
                  ? "border-accent/60 bg-accent/15 text-accent-glow"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {b === "drivers" ? "Drivers" : "Constructors"}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="relative overflow-hidden rounded-xl border border-border bg-surface/40 p-3 transition-all duration-500"
            >
              <div
                className="absolute inset-y-0 left-0 opacity-20 transition-[width] duration-700 ease-out"
                style={{ width: `${(row.points / max) * 100}%`, background: colorOf(row) }}
              />
              <div className="relative flex min-w-0 items-center gap-3">
                <span className="font-timing tabular-nums w-7 text-center text-muted-foreground">
                  {String(row.position).padStart(2, "0")}
                </span>
                <span className="h-8 w-1 rounded-full" style={{ background: colorOf(row) }} />
                <span className="min-w-0 flex-1 truncate font-display text-lg">{nameOf(row)}</span>
                {row.posDelta !== 0 && (
                  <span
                    className={
                      "text-[10px] uppercase tracking-widest " +
                      (row.posDelta > 0 ? "text-emerald-400" : "text-red-400")
                    }
                  >
                    {row.posDelta > 0 ? `▲${row.posDelta}` : `▼${Math.abs(row.posDelta)}`}
                  </span>
                )}
                {row.gained > 0 && (
                  <span className="font-timing tabular-nums text-xs text-accent">+{row.gained}</span>
                )}
                <span className="font-timing tabular-nums text-lg w-14 text-right">{row.points}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-timing tabular-nums text-3xl">
        <AnimatedNumber value={value} suffix={suffix} duration={600} />
      </div>
    </div>
  );
}

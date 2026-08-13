import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flag, RotateCcw, Sparkles, Trophy, Zap } from "lucide-react";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { PageSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import {
  RACE_POINTS,
  SPRINT_POINTS,
  clearSimulation,
  emptyOrder,
  loadSimulation,
  saveSimulation,
  simulate,
  type SimulationState,
} from "@/lib/simulator";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Championship Simulator · Apexo" },
      {
        name: "description",
        content: "Simulate every remaining Formula 1 round and project the drivers' and constructors' championships.",
      },
      { property: "og:title", content: "Championship Simulator · Apexo" },
      { property: "og:description", content: "Set finishing orders and watch the title fight change round by round." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(seasonQueryOptions());
  },
  component: SimulatorPage,
  pendingComponent: PageSkeleton,
});

function SimulatorPage() {
  const data = useSeason();
  const [state, setState] = useState<SimulationState>({});
  const [activeRound, setActiveRound] = useState<number | null>(null);

  useEffect(() => {
    setState(loadSimulation());
  }, []);

  const remaining = useMemo(
    () => data.races.filter((r) => r.status !== "completed").sort((a, b) => a.round - b.round),
    [data.races],
  );

  useEffect(() => {
    if (activeRound === null && remaining.length) setActiveRound(remaining[0].round);
  }, [activeRound, remaining]);

  const driverBase = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of data.driverStandings) out[s.driver.id] = s.driver.seasonPoints;
    return out;
  }, [data.driverStandings]);

  const teamBase = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of data.constructorStandings) out[s.team.id] = s.points;
    return out;
  }, [data.constructorStandings]);

  const driverTeam = useMemo(() => {
    const out: Record<string, string> = {};
    for (const d of data.drivers) out[d.id] = d.team;
    return out;
  }, [data.drivers]);

  const projections = useMemo(
    () =>
      simulate({
        driverBase,
        teamBase,
        driverTeam,
        rounds: remaining.map((r) => ({ round: r.round, hasSprint: r.hasSprint })),
        state,
      }),
    [driverBase, teamBase, driverTeam, remaining, state],
  );

  const update = (round: number, kind: "race" | "sprint", index: number, driverId: string | null) => {
    setState((prev) => {
      const current = prev[round] ?? emptyOrder();
      const list = [...current[kind]];
      // a driver can only occupy one slot per session
      for (let i = 0; i < list.length; i++) if (list[i] === driverId) list[i] = null;
      list[index] = driverId;
      const next = { ...prev, [round]: { ...current, [kind]: list } };
      saveSimulation(next);
      return next;
    });
  };

  const fillFromStandings = (round: number) => {
    setState((prev) => {
      const order = data.driverStandings.map((s) => s.driver.id);
      const next = {
        ...prev,
        [round]: { race: order.slice(0, 10), sprint: order.slice(0, 8) },
      };
      saveSimulation(next);
      return next;
    });
  };

  const resetAll = () => {
    clearSimulation();
    setState({});
  };

  if (!remaining.length) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <EmptyState
          icon={<Trophy className="h-6 w-6" />}
          title="Season complete"
          description="Every round of this season has been run, so there is nothing left to simulate."
          actionLabel="Final standings"
          actionTo="/standings"
        />
      </div>
    );
  }

  const race = remaining.find((r) => r.round === activeRound) ?? remaining[0];
  const order = state[race.round] ?? emptyOrder();
  const projection = projections.find((p) => p.round === race.round);
  const final = projections.at(-1);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="relative overflow-hidden rounded-2xl carbon-texture team-aura border border-border p-6 sm:p-8 animate-slide-up">
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {data.season} season · {remaining.length} rounds left
        </div>
        <h1 className="mt-1 font-display text-4xl sm:text-6xl leading-none">Championship Simulator</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Set the finishing order for every remaining grand prix and sprint. FIA points are applied automatically and
          both championships update live. Your simulation is stored on this device.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillFromStandings(race.round)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/60 px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" /> Fill from standings
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/60 px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset simulation
          </button>
        </div>
      </header>

      <nav aria-label="Remaining rounds" className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {remaining.map((r) => {
          const p = projections.find((x) => x.round === r.round);
          const on = r.round === race.round;
          return (
            <button
              key={r.id}
              type="button"
              aria-current={on ? "true" : undefined}
              onClick={() => setActiveRound(r.round)}
              className={
                "shrink-0 rounded-xl border px-4 py-2.5 text-left transition-colors min-h-11 " +
                (on
                  ? "border-accent/60 bg-accent/10"
                  : "border-border bg-surface/40 hover:border-accent/40")
              }
            >
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">R{r.round}</div>
              <div className="font-display text-base leading-tight">{r.name}</div>
              <div className="mt-0.5 flex gap-1.5 text-[9px] uppercase tracking-widest">
                {r.hasSprint && <span className="text-accent-glow">Sprint</span>}
                {p?.decider && <span className="text-track-red">Decider</span>}
                {p?.leaderChanged && <span className="text-track-yellow">Lead change</span>}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="relative min-w-0 overflow-hidden glass rounded-2xl p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Flag className="h-3 w-3" /> Finishing order · {race.name}
          </div>

          <OrderEditor
            label="Grand Prix"
            table={RACE_POINTS}
            values={order.race}
            drivers={data.drivers}
            onChange={(i, id) => update(race.round, "race", i, id)}
          />

          {race.hasSprint && (
            <OrderEditor
              label="Sprint"
              icon={<Zap className="h-3 w-3" />}
              table={SPRINT_POINTS}
              values={order.sprint}
              drivers={data.drivers}
              onChange={(i, id) => update(race.round, "sprint", i, id)}
            />
          )}
        </section>

        <div className="min-w-0 space-y-6">
          <StandingsPanel
            title={`Drivers after R${race.round}`}
            rows={(projection?.drivers ?? []).slice(0, 10).map((row) => {
              const d = data.driversById[row.id];
              return {
                id: row.id,
                name: d ? `${d.firstName} ${d.lastName}` : row.id,
                sub: d ? teamOf(data, d.team).name : "",
                color: d ? teamOf(data, d.team).color : "var(--accent)",
                points: row.points,
                gained: row.gained,
              };
            })}
            highlight={projection?.leaderChanged ? "Championship lead change" : undefined}
          />

          <StandingsPanel
            title={`Constructors after R${race.round}`}
            rows={(projection?.teams ?? []).slice(0, 10).map((row) => {
              const t = teamOf(data, row.id);
              return { id: row.id, name: t.name, sub: t.fullName, color: t.color, points: row.points, gained: row.gained };
            })}
          />

          {final && (
            <section className="relative min-w-0 overflow-hidden glass rounded-2xl p-5 sm:p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                <Trophy className="h-3 w-3" /> Projected champions
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <BattleCard
                  label="Drivers' title"
                  leader={
                    data.driversById[final.drivers[0]?.id ?? ""]
                      ? `${data.driversById[final.drivers[0].id].firstName} ${data.driversById[final.drivers[0].id].lastName}`
                      : "—"
                  }
                  gap={(final.drivers[0]?.points ?? 0) - (final.drivers[1]?.points ?? 0)}
                />
                <BattleCard
                  label="Constructors' title"
                  leader={teamOf(data, final.teams[0]?.id ?? "").name}
                  gap={(final.teams[0]?.points ?? 0) - (final.teams[1]?.points ?? 0)}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderEditor({
  label,
  icon,
  table,
  values,
  drivers,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  table: number[];
  values: (string | null)[];
  drivers: { id: string; firstName: string; lastName: string; code: string }[];
  onChange: (index: number, driverId: string | null) => void;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <ul className="mt-2 space-y-1.5">
        {table.map((pts, i) => (
          <li key={i} className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/40 p-2 pl-3">
            <span className="font-display text-lg w-8 shrink-0">P{i + 1}</span>
            <label className="sr-only" htmlFor={`${label}-${i}`}>
              {label} position {i + 1}
            </label>
            <select
              id={`${label}-${i}`}
              value={values[i] ?? ""}
              onChange={(e) => onChange(i, e.target.value || null)}
              className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <option value="">—</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} · {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
            <span className="font-timing tabular-nums text-sm text-muted-foreground w-10 text-right">+{pts}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StandingsPanel({
  title,
  rows,
  highlight,
}: {
  title: string;
  rows: { id: string; name: string; sub: string; color: string; points: number; gained: number }[];
  highlight?: string;
}) {
  if (!rows.length) return null;
  return (
    <section className="relative min-w-0 overflow-hidden glass rounded-2xl p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {title}
        {highlight && (
          <span className="ml-auto rounded-full border border-accent/60 bg-accent/10 px-2 py-0.5 text-accent-glow">
            {highlight}
          </span>
        )}
      </div>
      <ol className="mt-3 space-y-1.5">
        {rows.map((r, i) => {
          const leaderPoints = rows[0].points;
          return (
            <li
              key={r.id}
              className="relative flex items-center gap-3 rounded-xl border border-border bg-surface/40 p-2.5 pl-4 transition-colors hover:border-accent/40"
              style={{ borderLeftColor: r.color, borderLeftWidth: 2 }}
            >
              <span className="font-display text-lg w-7 shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-base leading-tight truncate">{r.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{r.sub}</div>
              </div>
              <div className="text-right">
                <div className="font-timing tabular-nums text-lg leading-none">
                  <AnimatedNumber value={r.points} />
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  {i === 0 ? (r.gained ? `+${r.gained} sim` : "leader") : `−${leaderPoints - r.points}`}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function BattleCard({ label, leader, gap }: { label: string; leader: string; gap: number }) {
  const intensity = Math.max(4, Math.min(100, 100 - gap));
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl leading-tight truncate">{leader}</div>
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Battle intensity</span>
        <span className="tabular-nums">{gap} pts</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full border border-border bg-surface/70 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${intensity}%`, background: "linear-gradient(90deg, var(--accent), var(--track-yellow))" }}
        />
      </div>
    </div>
  );
}

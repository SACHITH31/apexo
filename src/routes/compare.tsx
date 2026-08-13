import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Swords } from "lucide-react";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { seasonStatsQueryOptions, useSeasonStats } from "@/lib/f1-extra-data";
import { CompareList, type CompareMetric } from "@/components/CompareBars";
import { ProgressionChart, type Series } from "@/components/StatCharts";
import { PageSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { ShareCard } from "@/components/ShareCard";
import { DnaCompare } from "@/components/DnaCompare";
import { driverDna, teamDna } from "@/lib/f1-dna";

type Mode = "drivers" | "teams";

interface Search {
  mode: Mode;
  a?: string;
  b?: string;
}

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Head to Head · Apexo" },
      {
        name: "description",
        content:
          "Compare any two Formula 1 drivers or constructors side by side: points, wins, qualifying, race pace and reliability.",
      },
      { property: "og:title", content: "Head to Head · Apexo" },
      {
        property: "og:description",
        content: "Driver vs driver and team vs team Formula 1 comparisons with live season data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode: search.mode === "teams" ? "teams" : "drivers",
    a: typeof search.a === "string" ? search.a : undefined,
    b: typeof search.b === "string" ? search.b : undefined,
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(seasonQueryOptions());
    context.queryClient.prefetchQuery(seasonStatsQueryOptions());
  },
  component: ComparePage,
  pendingComponent: PageSkeleton,
});

function ComparePage() {
  const { mode, a, b } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const season = useSeason();
  const stats = useSeasonStats();

  const options = useMemo(() => {
    if (mode === "teams") {
      return season.constructorStandings.map((s) => ({ id: s.team.id, label: s.team.name, color: s.team.color }));
    }
    return season.driverStandings.map((s) => ({
      id: s.driver.id,
      label: `${s.driver.firstName} ${s.driver.lastName}`,
      color: teamOf(season, s.driver.team).color,
    }));
  }, [mode, season]);

  const idA = a && options.some((o) => o.id === a) ? a : options[0]?.id;
  const idB = b && options.some((o) => o.id === b) ? b : options[1]?.id;

  const h2h = useMemoH2H(stats, mode, idA ?? "", idB ?? "");

  const set = (patch: Partial<Search>) =>
    navigate({ search: (prev: Search) => ({ ...prev, ...patch }), replace: true });

  if (!idA || !idB) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Nothing to compare yet" description="Season entries load as soon as data is available." />
      </div>
    );
  }

  const colorA = options.find((o) => o.id === idA)!.color;
  const colorB = options.find((o) => o.id === idB)!.color;

  const metrics: CompareMetric[] = mode === "drivers" ? driverMetrics(stats, idA, idB) : teamMetrics(stats, idA, idB);

  const series: Series[] = [
    { key: idA, name: options.find((o) => o.id === idA)!.label, color: colorA },
    { key: idB, name: options.find((o) => o.id === idB)!.label, color: colorB },
  ];
  const points = mode === "drivers" ? stats.driverPoints : stats.teamPoints;

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 px-4 sm:px-6 py-6 sm:py-10">
      <header className="relative overflow-hidden rounded-2xl carbon-texture border border-border p-6 sm:p-8 animate-slide-up">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: `linear-gradient(100deg, ${colorA}26, transparent 45%, transparent 55%, ${colorB}26)` }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Swords className="h-3 w-3" /> Head to head · {stats.season || season.season}
          </div>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl leading-none">
            {mode === "drivers" ? "Driver vs Driver" : "Team vs Team"}
          </h1>

          <div className="mt-3 flex gap-2">
            {(["drivers", "teams"] as const).map((m) => (
              <button
                key={m}
                onClick={() => set({ mode: m, a: undefined, b: undefined })}
                aria-pressed={mode === m}
                className={
                  "min-h-11 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors " +
                  (mode === m
                    ? "border-accent/60 bg-accent/10 text-accent-glow"
                    : "border-border bg-surface/50 text-muted-foreground hover:text-foreground hover:border-accent/40")
                }
              >
                {m === "drivers" ? "Driver vs driver" : "Team vs team"}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Picker value={idA} options={options} onChange={(v) => set({ a: v })} color={colorA} label="First" />
            <span className="font-display text-3xl text-muted-foreground">VS</span>
            <Picker
              value={idB}
              options={options}
              onChange={(v) => set({ b: v })}
              color={colorB}
              label="Second"
              align="right"
            />
          </div>

          {h2h.total > 0 && (
            <div className="mt-5 flex items-center gap-3">
              <span className="font-timing tabular-nums text-3xl" style={{ color: colorA }}>{h2h.aWins}</span>
              <span className="flex-1 h-2.5 rounded-full overflow-hidden bg-surface/70 flex">
                <span style={{ width: `${(h2h.aWins / h2h.total) * 100}%`, background: colorA }} />
                <span style={{ width: `${(h2h.bWins / h2h.total) * 100}%`, background: colorB }} />
              </span>
              <span className="font-timing tabular-nums text-3xl" style={{ color: colorB }}>{h2h.bWins}</span>
            </div>
          )}
          <div className="mt-1 text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {h2h.total > 0 ? `${h2h.total} race${h2h.total > 1 ? "s" : ""} judged on finishing order` : "No shared results yet"}
          </div>

          <div className="mt-4 flex justify-center">
            <ShareCard
              eyebrow="Head to head"
              title={`${series[0].name} vs ${series[1].name}`}
              subtitle={`${stats.season || season.season} Formula 1 season`}
              accent={colorA}
              fileName="apexo-head-to-head"
              stats={[
                { label: "Race wins h2h", value: `${h2h.aWins} — ${h2h.bWins}` },
                ...metrics.slice(0, 3).map((m) => ({
                  label: m.label,
                  value: `${m.left.toFixed(m.decimals ?? 0)} — ${m.right.toFixed(m.decimals ?? 0)}`,
                })),
              ]}
            />
          </div>
        </div>
      </header>

      <div className="mt-6">
        <DnaCompare
          left={mode === "drivers" ? driverDna(idA, stats.drivers[idA]) : teamDna(idA, stats.teams[idA])}
          right={mode === "drivers" ? driverDna(idB, stats.drivers[idB]) : teamDna(idB, stats.teams[idB])}
          leftName={series[0].name}
          rightName={series[1].name}
          leftColor={colorA}
          rightColor={colorB}
        />
      </div>

      <div className="mt-6">
        <CompareList metrics={metrics} leftColor={colorA} rightColor={colorB} />
      </div>

      {points.length > 0 && (
        <section className="mt-6 relative overflow-hidden glass rounded-2xl p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
          <h2 className="font-display text-2xl leading-none">Points progression</h2>
          <div className="mt-4">
            <ProgressionChart points={points} series={series} />
          </div>
        </section>
      )}
    </div>
  );
}

function Picker({
  value,
  options,
  onChange,
  color,
  label,
  align = "left",
}: {
  value: string;
  options: { id: string; label: string; color: string }[];
  onChange: (v: string) => void;
  color: string;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <label className="block text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-11 rounded-xl border bg-surface/70 px-3 py-2 text-sm font-semibold uppercase tracking-wider outline-none focus:border-accent"
        style={{ borderColor: `${color}80` }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function driverMetrics(stats: ReturnType<typeof useSeasonStats>, a: string, b: string): CompareMetric[] {
  const A = stats.drivers[a];
  const B = stats.drivers[b];
  const g = (k: keyof NonNullable<typeof A>) => [Number(A?.[k] ?? 0), Number(B?.[k] ?? 0)] as const;
  const [pA, pB] = g("points");
  return [
    { label: "Points", left: pA, right: pB },
    { label: "Wins", left: g("wins")[0], right: g("wins")[1] },
    { label: "Podiums", left: g("podiums")[0], right: g("podiums")[1] },
    { label: "Poles", left: g("poles")[0], right: g("poles")[1] },
    { label: "Fastest laps", left: g("fastestLaps")[0], right: g("fastestLaps")[1] },
    { label: "Avg finish", left: g("avgFinish")[0], right: g("avgFinish")[1], decimals: 1, higherIsBetter: false },
    { label: "Avg grid", left: g("avgGrid")[0], right: g("avgGrid")[1], decimals: 1, higherIsBetter: false },
    { label: "Best finish", left: g("bestFinish")[0], right: g("bestFinish")[1], higherIsBetter: false },
    { label: "Finish rate", left: g("finishRate")[0], right: g("finishRate")[1], decimals: 0, suffix: "%" },
    { label: "Retirements", left: g("dnfs")[0], right: g("dnfs")[1], higherIsBetter: false },
  ];
}

function teamMetrics(stats: ReturnType<typeof useSeasonStats>, a: string, b: string): CompareMetric[] {
  const A = stats.teams[a];
  const B = stats.teams[b];
  const g = (k: keyof NonNullable<typeof A>) => [Number(A?.[k] ?? 0), Number(B?.[k] ?? 0)] as const;
  return [
    { label: "Points", left: g("points")[0], right: g("points")[1] },
    { label: "Wins", left: g("wins")[0], right: g("wins")[1] },
    { label: "Podiums", left: g("podiums")[0], right: g("podiums")[1] },
    { label: "Poles", left: g("poles")[0], right: g("poles")[1] },
    { label: "Fastest laps", left: g("fastestLaps")[0], right: g("fastestLaps")[1] },
    { label: "Avg finish", left: g("avgFinish")[0], right: g("avgFinish")[1], decimals: 1, higherIsBetter: false },
    { label: "Avg grid", left: g("avgGrid")[0], right: g("avgGrid")[1], decimals: 1, higherIsBetter: false },
    { label: "Finish rate", left: g("finishRate")[0], right: g("finishRate")[1], decimals: 0, suffix: "%" },
    { label: "Retirements", left: g("dnfs")[0], right: g("dnfs")[1], higherIsBetter: false },
  ];
}

function useMemoH2H(stats: ReturnType<typeof useSeasonStats>, mode: Mode, a: string, b: string) {
  return useMemo(() => {
    let aWins = 0;
    let bWins = 0;
    for (const race of stats.perRace) {
      const best = (id: string) => {
        const entries = race.entries.filter((e) => (mode === "drivers" ? e.driverId === id : e.constructorId === id));
        const finished = entries.filter((e) => !e.dnf).map((e) => e.position);
        return finished.length ? Math.min(...finished) : undefined;
      };
      const pa = best(a);
      const pb = best(b);
      if (pa === undefined || pb === undefined) continue;
      if (pa < pb) aWins += 1;
      else if (pb < pa) bWins += 1;
    }
    return { aWins, bWins, total: aWins + bWins };
  }, [stats, mode, a, b]);
}

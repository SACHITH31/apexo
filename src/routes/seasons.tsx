import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { seasonStatsQueryOptions } from "@/lib/f1-extra-data";
import { compareMetrics, summarizeSeason } from "@/lib/season-compare";
import { currentSeason, useAvailableSeasons } from "@/lib/season";
import { PageSkeleton, Skeleton } from "@/components/Skeletons";

export const Route = createFileRoute("/seasons")({
  head: () => ({
    meta: [
      { title: "Season Comparison · Apexo" },
      {
        name: "description",
        content:
          "Compare any two Formula 1 seasons: race winners, pole sitters, fastest laps, retirements, dominance and championship margins.",
      },
      { property: "og:title", content: "Season Comparison · Apexo" },
      {
        property: "og:description",
        content: "Head-to-head analytics between any two Formula 1 seasons, built from official results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(seasonQueryOptions());
  },
  component: SeasonComparePage,
  pendingComponent: PageSkeleton,
});

function SeasonComparePage() {
  const season = useSeason();
  const seasons = useAvailableSeasons();
  const now = currentSeason();
  const [a, setA] = useState(String(Number(now) - 1));
  const [b, setB] = useState(now);

  const options = useMemo(() => {
    const set = new Set<string>([...seasons, a, b]);
    return [...set].sort((x, y) => Number(y) - Number(x));
  }, [seasons, a, b]);

  const [qa, qb] = useQueries({
    queries: [seasonStatsQueryOptions(a), seasonStatsQueryOptions(b)],
  });

  const ready = Boolean(qa.data && qb.data);
  const sa = useMemo(() => (qa.data ? summarizeSeason(qa.data) : null), [qa.data]);
  const sb = useMemo(() => (qb.data ? summarizeSeason(qb.data) : null), [qb.data]);
  const metrics = sa && sb ? compareMetrics(sa, sb) : [];

  const chartData = metrics
    .filter((m) => ["winners", "poles", "fl", "podium", "topwins"].includes(m.key))
    .map((m) => ({ name: m.label.replace("Different ", ""), [a]: m.a, [b]: m.b }));

  const dominance = metrics
    .filter((m) => ["ddom", "cdom", "dnfrate"].includes(m.key))
    .map((m) => ({ name: m.label, [a]: m.a, [b]: m.b }));

  const colorA = "var(--accent)";
  const colorB = "#8A8F98";

  return (
    <div className="mx-auto max-w-6xl min-w-0 px-4 sm:px-6 py-6 sm:py-10">
      <header className="relative overflow-hidden rounded-2xl carbon-texture team-aura border border-border p-6 sm:p-8 animate-slide-up">
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="pointer-events-none absolute inset-0 checker-flag opacity-[0.04]" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Season Comparison</p>
          <h1 className="font-display text-4xl sm:text-6xl mt-1">
            {a} <span className="text-muted-foreground">vs</span> {b}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Two full championships side by side — competitiveness, reliability and dominance, aggregated from every
            classified result.
          </p>
        </div>
      </header>

      <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl glass-elevated border border-border/60 p-4">
        <SeasonPicker label="Season A" value={a} onChange={setA} options={options} />
        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
        <SeasonPicker label="Season B" value={b} onChange={setB} options={options} />
        <button
          type="button"
          onClick={() => { setA(b); setB(a); }}
          className="ml-auto rounded-full border border-border px-4 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
        >
          Swap
        </button>
      </section>

      {!ready ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            {sa && sb && (
              <>
                <Champion title={a} driverId={sa.topDriverId} teamId={sa.topTeamId} wins={sa.topDriverWins} season={season} />
                <Champion title={b} driverId={sb.topDriverId} teamId={sb.topTeamId} wins={sb.topDriverWins} season={season} />
              </>
            )}
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-surface/40 p-4 sm:p-5">
            <h2 className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Head to head</h2>
            <ul className="divide-y divide-border/60">
              {metrics.map((m) => {
                const total = Math.max(1, m.a + m.b);
                return (
                  <li key={m.key} className="py-2.5">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-timing tabular-nums w-20 text-right text-accent-glow">
                        {m.a}
                        {m.suffix ?? ""}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full transition-[width] duration-700"
                            style={{ width: `${(m.a / total) * 100}%`, background: colorA }}
                          />
                        </div>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full transition-[width] duration-700"
                            style={{ width: `${(m.b / total) * 100}%`, background: colorB }}
                          />
                        </div>
                      </div>
                      <span className="font-timing tabular-nums w-20 text-muted-foreground">
                        {m.b}
                        {m.suffix ?? ""}
                      </span>
                    </div>
                    <div className="mt-1 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      {m.label}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Competitiveness">
              <CompareChart data={chartData} a={a} b={b} colorA={colorA} colorB={colorB} />
            </ChartCard>
            <ChartCard title="Dominance & reliability (%)">
              <CompareChart data={dominance} a={a} b={b} colorA={colorA} colorB={colorB} />
            </ChartCard>
          </section>
        </>
      )}
    </div>
  );
}

function Champion({
  title,
  driverId,
  teamId,
  wins,
  season,
}: {
  title: string;
  driverId?: string;
  teamId?: string;
  wins: number;
  season: ReturnType<typeof useSeason>;
}) {
  const team = teamId ? teamOf(season, teamId) : undefined;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-4">
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: team?.color ?? "var(--accent)" }} />
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{title} leader</div>
      <div className="mt-1 font-display text-2xl truncate">{driverId ?? "—"}</div>
      <div className="mt-1 text-xs text-muted-foreground truncate">
        {team?.name ?? "—"} · {wins} win{wins === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-4 sm:p-5">
      <h2 className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function CompareChart({
  data,
  a,
  b,
  colorA,
  colorB,
}: {
  data: Record<string, string | number>[];
  a: string;
  b: string;
  colorA: string;
  colorB: string;
}) {
  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={56}
          />
          <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={36} />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey={a} fill={colorA} radius={[4, 4, 0, 0]} animationDuration={800} />
          <Bar dataKey={b} fill={colorB} radius={[4, 4, 0, 0]} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SeasonPicker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex min-w-0 items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-border bg-surface/60 px-3 py-1.5 font-timing tabular-nums text-xs outline-none hover:border-accent/50 focus:border-accent transition-colors"
      >
        {options.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}

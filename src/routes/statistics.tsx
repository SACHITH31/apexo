import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, LineChart, Trophy } from "lucide-react";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { seasonStatsQueryOptions, useSeasonStats } from "@/lib/f1-extra-data";
import { ProgressionChart, RankedBarChart, TeamAreaChart, type Series } from "@/components/StatCharts";
import { PageSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { ShareCard } from "@/components/ShareCard";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Championship Statistics · Apexo" },
      {
        name: "description",
        content:
          "Points progression, championship position swings, wins, poles and reliability analytics for the current Formula 1 season.",
      },
      { property: "og:title", content: "Championship Statistics · Apexo" },
      {
        property: "og:description",
        content: "Interactive Formula 1 championship analytics: progression charts, wins, poles and reliability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(seasonQueryOptions());
    context.queryClient.prefetchQuery(seasonStatsQueryOptions());
  },
  component: StatisticsPage,
  pendingComponent: PageSkeleton,
});

type Tab = "drivers" | "teams" | "records";

function StatisticsPage() {
  const season = useSeason();
  const stats = useSeasonStats();
  const [tab, setTab] = useState<Tab>("drivers");

  const topDrivers = useMemo<Series[]>(
    () =>
      Object.values(stats.drivers)
        .sort((a, b) => b.points - a.points)
        .slice(0, 6)
        .map((d) => ({
          key: d.driverId,
          name: season.driversById[d.driverId]?.code ?? d.driverId,
          color: teamOf(season, d.constructorId).color,
        })),
    [stats, season],
  );

  const topTeams = useMemo<Series[]>(
    () =>
      Object.values(stats.teams)
        .sort((a, b) => b.points - a.points)
        .slice(0, 6)
        .map((t) => ({
          key: t.constructorId,
          name: teamOf(season, t.constructorId).name,
          color: teamOf(season, t.constructorId).color,
        })),
    [stats, season],
  );

  const bars = (metric: "wins" | "poles" | "fastestLaps" | "dnfs") =>
    Object.values(stats.drivers)
      .map((d) => ({
        name: season.driversById[d.driverId]?.code ?? d.driverId,
        value: d[metric],
        color: teamOf(season, d.constructorId).color,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);

  const leader = Object.values(stats.drivers).sort((a, b) => b.points - a.points)[0];
  const leaderDriver = leader ? season.driversById[leader.driverId] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="relative overflow-hidden rounded-2xl carbon-texture team-aura border border-border p-6 sm:p-8 animate-slide-up">
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="pointer-events-none absolute inset-0 checker-flag opacity-[0.04]" />
        <div className="relative flex flex-wrap items-end gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {stats.season || season.season} Season · Analytics
            </div>
            <h1 className="mt-1 font-display text-4xl sm:text-6xl leading-none">Statistics</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Championship progression, form swings and reliability — rebuilt after every round.
            </p>
          </div>
          {leaderDriver && leader && (
            <ShareCard
              className="ml-auto"
              eyebrow={`${stats.season} Championship`}
              title={`${leaderDriver.firstName} ${leaderDriver.lastName}`}
              subtitle={teamOf(season, leader.constructorId).fullName}
              accent={teamOf(season, leader.constructorId).color}
              fileName="apexo-championship"
              stats={[
                { label: "Points", value: String(leader.points) },
                { label: "Wins", value: String(leader.wins) },
                { label: "Podiums", value: String(leader.podiums) },
                { label: "Avg finish", value: leader.avgFinish.toFixed(1) },
              ]}
            />
          )}
        </div>
      </header>

      {!stats.rounds.length ? (
        <div className="mt-6">
          <EmptyState
            title="No completed rounds yet"
            description="Championship analytics unlock as soon as the season's first Grand Prix is in the books."
            actionLabel="See the calendar"
            actionTo="/calendar"
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex gap-2" role="tablist" aria-label="Statistics view">
            {(
              [
                ["drivers", "Drivers", LineChart],
                ["teams", "Teams", BarChart3],
                ["records", "Records", Trophy],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors " +
                  (tab === id
                    ? "border-accent/60 bg-accent/10 text-accent-glow"
                    : "border-border bg-surface/50 text-muted-foreground hover:text-foreground hover:border-accent/40")
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-5">
            {tab === "drivers" && (
              <>
                <Panel title="Points progression" note="Cumulative championship points by round">
                  <ProgressionChart points={stats.driverPoints} series={topDrivers} />
                </Panel>
                <Panel title="Championship position" note="Lower is better — the title fight, round by round">
                  <ProgressionChart points={stats.driverPositions} series={topDrivers} invertY />
                </Panel>
              </>
            )}

            {tab === "teams" && (
              <>
                <Panel title="Constructor points" note="Cumulative team points by round">
                  <TeamAreaChart points={stats.teamPoints} series={topTeams} />
                </Panel>
                <Panel title="Team reliability" note="Retirements this season">
                  <RankedBarChart
                    data={Object.values(stats.teams)
                      .map((t) => ({
                        name: teamOf(season, t.constructorId).name,
                        value: t.dnfs,
                        color: teamOf(season, t.constructorId).color,
                      }))
                      .sort((a, b) => b.value - a.value)}
                  />
                </Panel>
              </>
            )}

            {tab === "records" && (
              <div className="grid gap-5 lg:grid-cols-2">
                <Panel title="Race wins" note="Grands Prix won">
                  <RankedBarChart data={bars("wins")} height={280} />
                </Panel>
                <Panel title="Pole positions" note="Qualified P1">
                  <RankedBarChart data={bars("poles")} height={280} />
                </Panel>
                <Panel title="Fastest laps" note="Purple laps on race day">
                  <RankedBarChart data={bars("fastestLaps")} height={280} />
                </Panel>
                <Panel title="Retirements" note="Did-not-finish count">
                  <RankedBarChart data={bars("dnfs")} height={280} />
                </Panel>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6 hover-lift">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-2xl leading-none">{title}</h2>
        {note && <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{note}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

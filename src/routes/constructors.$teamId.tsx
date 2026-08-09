import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { seasonStatsQueryOptions, useSeasonStats } from "@/lib/f1-extra-data";
import { DriverRow } from "@/components/DriverRow";
import { ChevronLeft, Factory } from "lucide-react";
import { DetailSkeleton } from "@/components/Skeletons";
import { garageFor } from "@/lib/team-garage";
import { ChampionshipHistory } from "@/components/ChampionshipHistory";
import { DnaPanel } from "@/components/DnaRadar";
import { teamDna } from "@/lib/f1-dna";
import { ProShareCard } from "@/components/ProShareCard";

export const Route = createFileRoute("/constructors/$teamId")({
  head: ({ params }) => {
    const name = params.teamId
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return { meta: [
      { title: `${name} · Apexo` },
      { name: "description", content: `${name} — current Formula 1 lineup, championships, and season points.` },
    ] };
  },
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(seasonQueryOptions());
    if (!data.teams[params.teamId]) throw notFound();
    context.queryClient.prefetchQuery(seasonStatsQueryOptions());
  },
  component: TeamProfile,
  pendingComponent: DetailSkeleton,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Team not found</h1>
      <Link to="/constructors" className="mt-4 inline-block text-accent uppercase tracking-widest text-xs">All teams</Link>
    </div>
  ),
});

function TeamProfile() {
  const { teamId } = Route.useParams();
  const data = useSeason();
  const stats = useSeasonStats();
  const { drivers, constructorStandings, season } = data;
  const t = teamOf(data, teamId);
  const roster = drivers.filter((d) => d.team === t.id);
  const standing = constructorStandings.find((c) => c.team.id === t.id);
  const garage = useMemo(() => garageFor(t.id, t.base), [t]);
  const stat = stats.teams[t.id];
  const dna = useMemo(() => teamDna(t.id, stat, t.championships), [t, stat]);
  const roundsRun = stats.rounds.length;
  const totalRounds = data.races.length || roundsRun;
  const progress = totalRounds ? Math.round((roundsRun / totalRounds) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/constructors" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-3 w-3" /> All teams
      </Link>

      <header className="relative overflow-hidden rounded-2xl carbon-texture border border-border p-6 sm:p-10">
        <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: t.color }} />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-15 blur-3xl" style={{ background: t.color }} />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Constructor</div>
          <h1 className="mt-1 font-display text-4xl sm:text-6xl" style={{ color: t.color }}>{t.name}</h1>
          <p className="mt-2 text-muted-foreground">{t.fullName}</p>
          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label={`P ${standing?.position ?? "-"}`} value={standing?.points ?? 0} unit={`pts (${season})`} highlight />
            <Stat label="Titles" value={t.championships} />
            <Stat label="Founded" value={t.founded} />
            <Stat label="Principal" value={t.principal} textual />
          </dl>
          <div className="mt-3 text-xs text-muted-foreground">Base: {t.base}</div>
          <div className="mt-4">
            <ProShareCard
              label="Share team card"
              data={{
                eyebrow: `${season} Constructors`,
                title: t.name,
                subtitle: t.fullName,
                accent: t.color,
                fileName: `apexo-${t.id}`,
                stats: [
                  { label: "Championship position", value: `P${standing?.position ?? "-"}` },
                  { label: "Points", value: String(standing?.points ?? 0) },
                  { label: "Titles", value: String(t.championships) },
                  { label: "Founded", value: String(t.founded) },
                ],
              }}
            />
          </div>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <Factory className="h-3 w-3" /> Team garage
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Spec label="Factory" value={garage.factory} />
          <Spec label="Country" value={garage.country} />
          <Spec label="Team principal" value={t.principal} />
          <Spec label="Technical director" value={garage.technicalDirector} />
          <Spec label="Power unit" value={garage.powerUnit} />
          <Spec label="Engine supplier" value={garage.engineSupplier} />
          <Spec label="Chassis" value={garage.chassis} />
          <Spec label="Car name" value={garage.carName} />
          <Spec label="Reserve driver" value={garage.reserveDriver ?? "—"} />
        </dl>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Titles" value={t.championships} />
          <Stat label="Wins" value={garage.wins} />
          <Stat label="Podiums" value={garage.podiums} />
          <Stat label="Poles" value={garage.poles} />
          <Stat label="Fastest laps" value={garage.fastestLaps} />
          <Stat label="Founded" value={t.founded} />
        </div>

        <div className="mt-3 rounded-xl border border-border bg-surface/40 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {season} season progress
            </span>
            <span className="font-timing tabular-nums text-sm">
              {roundsRun}/{totalRounds} rounds
            </span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-surface"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${season} season progress`}
          >
            <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${progress}%`, background: t.color }} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <ChampionshipHistory years={garage.titleYears} accent={t.color} teamName={t.name} />
      </section>

      <section className="mt-8">
        <DnaPanel
          title={t.name}
          subtitle="Constructor performance fingerprint"
          profile={dna}
          accent={t.color}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">{season} driver lineup</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {roster.map((d) => (
            <DriverRow key={d.id} driver={d} right={<div className="font-timing text-2xl tabular-nums">{d.seasonPoints}</div>} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-display text-xl leading-tight">{value}</dd>
    </div>
  );
}

function Stat({ label, value, unit, highlight, textual }: { label: string; value: string | number; unit?: string; highlight?: boolean; textual?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={"mt-1 leading-none " + (textual ? "text-base font-medium" : "font-timing tabular-nums text-3xl ") + (highlight ? " text-gradient-accent" : "")}>
        {value}
      </div>
      {unit && <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{unit}</div>}
    </div>
  );
}

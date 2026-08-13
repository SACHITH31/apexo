import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { seasonStatsQueryOptions, useSeasonStats } from "@/lib/f1-extra-data";
import { ChevronLeft, Award } from "lucide-react";
import { DetailSkeleton } from "@/components/Skeletons";
import { bioFor } from "@/lib/driver-career";
import { CareerTimeline } from "@/components/CareerTimeline";
import { DnaPanel } from "@/components/DnaRadar";
import { SeasonBadges } from "@/components/SeasonBadges";
import { driverDna } from "@/lib/f1-dna";
import { ProShareCard } from "@/components/ProShareCard";

export const Route = createFileRoute("/drivers/$driverId")({
  head: ({ params }) => {
    const name = params.driverId
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return { meta: [
      { title: `${name} · Apexo` },
      { name: "description", content: `${name} — current Formula 1 season stats, team, and career record.` },
    ] };
  },
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(seasonQueryOptions());
    if (!data.driversById[params.driverId]) throw notFound();
    context.queryClient.prefetchQuery(seasonStatsQueryOptions());
  },
  component: DriverProfile,
  pendingComponent: DetailSkeleton,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Driver not found</h1>
      <Link to="/drivers" className="mt-4 inline-block text-accent uppercase tracking-widest text-xs">Back to grid</Link>
    </div>
  ),
});

function DriverProfile() {
  const { driverId } = Route.useParams();
  const data = useSeason();
  const stats = useSeasonStats();
  const { driversById, races, season } = data;
  const d = driversById[driverId];
  const t = teamOf(data, d.team);
  const age = new Date(Date.now() - new Date(d.dob).getTime()).getUTCFullYear() - 1970;
  const stat = stats.drivers[driverId];
  const bio = useMemo(
    () =>
      bioFor(driverId, {
        dob: d.dob,
        team: t.id,
        teamName: t.name,
        wins: d.wins,
        championships: d.championships,
      }),
    [driverId, d, t],
  );
  const dna = useMemo(() => driverDna(driverId, stat), [driverId, stat]);

  const driverRaces = races
    .filter((r) => r.status === "completed" && r.podium?.includes(d.id))
    .map((r) => ({ race: r, position: (r.podium?.indexOf(d.id) ?? -1) + 1 }));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/drivers" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-3 w-3" /> All drivers
      </Link>

      <header className="relative overflow-hidden rounded-2xl carbon-texture border border-border p-6 sm:p-10">
        <div className="absolute inset-y-0 left-0 w-1" style={{ background: t.color }} />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: t.color }} />

        <div className="flex flex-wrap items-end gap-6 relative">
          <div
            className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl border-4 flex items-center justify-center font-display text-6xl sm:text-7xl"
            style={{ borderColor: t.color, background: `${t.color}18` }}
          >
            {d.code}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <span aria-hidden>{d.flag}</span> {d.nationality} · Car #{d.number}
            </div>
            <h1 className="mt-1 font-display text-4xl sm:text-6xl leading-none">
              <span className="text-muted-foreground">{d.firstName}</span>{" "}
              <span>{d.lastName}</span>
            </h1>
            <Link
              to="/constructors/$teamId"
              params={{ teamId: t.id }}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs uppercase tracking-widest hover:border-accent/50"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: t.color }} /> {t.name}
            </Link>
            <div className="mt-3">
              <ProShareCard
                label="Share driver card"
                data={{
                  eyebrow: `${season} · ${t.name}`,
                  title: `${d.firstName} ${d.lastName}`,
                  subtitle: `#${d.number} · ${d.nationality}`,
                  accent: t.color,
                  fileName: `apexo-${d.id}`,
                  stats: [
                    { label: "Season points", value: String(d.seasonPoints) },
                    { label: "Wins", value: String(d.wins) },
                    { label: "Podiums", value: String(d.podiums) },
                    { label: "Poles", value: String(d.poles) },
                    { label: "Titles", value: String(d.championships) },
                  ],
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <SeasonBadges stats={stats} driverId={d.id} />

      <section className="mt-8">

        <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Career</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <BigStat label="Titles" value={d.championships} highlight={d.championships > 0} />
          <BigStat label="Wins" value={d.wins} />
          <BigStat label="Podiums" value={d.podiums} />
          <BigStat label="Poles" value={d.poles} />
          <BigStat label="Career pts" value={d.careerPoints.toLocaleString()} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">{season} season</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BigStat label="Points" value={d.seasonPoints} />
          <BigStat label="Wins" value={d.seasonWins} />
          <BigStat label="Podiums" value={d.seasonPodiums} />
          <BigStat label="Age" value={age} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Profile</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Fact label="Driver number" value={`#${d.number}`} />
          <Fact label="Nationality" value={`${d.flag} ${d.nationality}`} />
          <Fact label="Birthplace" value={bio.birthplace ?? "—"} />
          <Fact label="Date of birth" value={new Date(d.dob).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })} />
          <Fact label="Height" value={bio.heightCm ? `${bio.heightCm} cm` : "—"} />
          <Fact label="Debut season" value={bio.debutSeason ? String(bio.debutSeason) : "—"} />
        </dl>
      </section>

      {stat && (
        <section className="mt-8">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Season record</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <BigStat label="Starts" value={stat.entries} />
            <BigStat label="Fastest laps" value={stat.fastestLaps} />
            <BigStat label="Avg finish" value={stat.avgFinish ? stat.avgFinish.toFixed(1) : "—"} />
            <BigStat label="Avg grid" value={stat.avgGrid ? stat.avgGrid.toFixed(1) : "—"} />
          </div>
        </section>
      )}

      <section className="mt-8">
        <DnaPanel
          title={`${d.firstName} ${d.lastName}`}
          subtitle="Performance fingerprint across ten racing traits"
          profile={dna}
          accent={t.color}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Career timeline</h2>
        <CareerTimeline entries={bio.timeline} accent={t.color} />
      </section>

      {driverRaces.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3 flex items-center gap-2">
            <Award className="h-3 w-3" /> Podiums this season
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {driverRaces.map(({ race, position }) => (
              <li key={race.id}>
                <Link to="/races/$raceId" params={{ raceId: race.id }} className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 hover:border-accent/40">
                  <div className="font-display text-3xl" style={{ color: position === 1 ? "var(--accent)" : undefined }}>P{position}</div>
                  <div className="min-w-0">
                    <div className="font-display text-lg leading-tight truncate">{race.name}</div>
                    <div className="text-xs text-muted-foreground">Round {race.round}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-display text-xl leading-tight">{value}</dd>
    </div>
  );
}

function BigStat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={"mt-1 font-timing tabular-nums text-4xl leading-none " + (highlight ? "text-gradient-accent" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}

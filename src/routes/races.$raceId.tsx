import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { raceDetailQueryOptions, useRaceDetail } from "@/lib/f1-extra-data";
import { ChevronLeft, Flag, Timer, Trophy, Wrench, Zap } from "lucide-react";
import { LightsOutCountdown } from "@/components/LightsOutCountdown";
import { CircuitSignature } from "@/components/CircuitSignature";
import { FormattedDate } from "@/components/ClientOnly";
import { DetailSkeleton } from "@/components/Skeletons";
import { SessionHub } from "@/components/SessionHub";
import { RaceControlTimeline, RaceControlTimelineSkeleton } from "@/components/RaceControlTimeline";
import { TyreTracker } from "@/components/TyreTracker";
import { PitStopDashboard } from "@/components/PitStopDashboard";
import { ShareCard } from "@/components/ShareCard";
import { WeatherCenter } from "@/components/WeatherCenter";
import { LiveTrackStatus } from "@/components/LiveTrackStatus";


export const Route = createFileRoute("/races/$raceId")({
  head: () => ({
    meta: [
      { title: "Race weekend · Apexo" },
      { name: "description", content: "Session times, circuit info, and results for this Formula 1 race weekend." },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(seasonQueryOptions());
    const race = data.racesById[params.raceId];
    if (!race) throw notFound();
    if (race.status !== "upcoming") {
      context.queryClient.prefetchQuery(raceDetailQueryOptions(race.round));
    }
  },
  component: RacePage,
  pendingComponent: DetailSkeleton,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Race not found</h1>
      <Link to="/calendar" className="mt-4 inline-block text-accent uppercase tracking-widest text-xs">Full calendar</Link>
    </div>
  ),
});

function RacePage() {
  const { raceId } = Route.useParams();
  const data = useSeason();
  const { racesById, circuits, driversById } = data;
  const r = racesById[raceId];
  const c = circuits[r.circuitId];
  const isUpcoming = r.status === "upcoming";

  const detail = useRaceDetail(r.round);
  const driversByNumber = useMemo(
    () => Object.fromEntries(data.drivers.map((d) => [d.number, d])),
    [data.drivers],
  );
  const teamFor = (d: (typeof data.drivers)[number]) => teamOf(data, d.team);


  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/calendar" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-3 w-3" /> Calendar
      </Link>

      <header className="relative overflow-hidden rounded-2xl carbon-texture team-aura border border-border p-6 sm:p-10 animate-slide-up">
        <div className="pointer-events-none absolute -right-6 -top-6 h-64 w-[28rem] text-accent opacity-25">
          <CircuitSignature id={c.id} className="h-full w-full" strokeWidth={1.4} />
        </div>
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Round {r.round} · <span aria-hidden>{c.flag}</span> {c.country}
          </div>
          <h1 className="mt-1 font-display text-4xl sm:text-6xl leading-none">{r.name}</h1>
          <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{r.officialName}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {r.hasSprint && <Badge><Zap className="h-3 w-3" /> Sprint weekend</Badge>}
            <Badge>{isUpcoming ? "Upcoming" : "Completed"}</Badge>
            <ShareCard
              className="ml-auto"
              eyebrow={`Round ${r.round} · ${c.country}`}
              title={r.name}
              subtitle={`${c.name} · ${c.location}`}
              fileName={`apexo-${r.id}`}
              stats={
                r.podium && driversById[r.podium[0]]
                  ? [
                      { label: "Winner", value: driversById[r.podium[0]].lastName.toUpperCase() },
                      { label: "Laps", value: String(c.laps) },
                      { label: "Length", value: `${c.lengthKm} km` },
                    ]
                  : [
                      { label: "Circuit", value: c.name },
                      { label: "Laps", value: String(c.laps) },
                      { label: "Length", value: `${c.lengthKm} km` },
                    ]
              }
            />
          </div>
        </div>
      </header>

      {isUpcoming && (
        <section className="mt-6 animate-slide-up" style={{ animationDelay: "80ms" }}>
          <LightsOutCountdown target={r.sessions.race} label="Lights out" sublabel="Race start" />
        </section>
      )}

      <div className="mt-6 space-y-6">
        <LiveTrackStatus race={r} circuitId={c.id} events={detail.data?.events ?? []} />
        <WeatherCenter race={r} circuitId={c.id} />
      </div>



      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <SessionHub race={r} />


        <div className="relative overflow-hidden glass rounded-2xl p-6 hover-lift">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-40 w-56 text-accent opacity-15">
            <CircuitSignature id={c.id} className="h-full w-full" strokeWidth={1.6} />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <Flag className="h-3 w-3" /> Circuit
            </div>
            <div className="mt-3 font-display text-2xl">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.location}, {c.country}</div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Length</dt><dd className="font-timing text-lg">{c.lengthKm} km</dd></div>
              <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Laps</dt><dd className="font-timing text-lg">{c.laps}</dd></div>
              <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">DRS</dt><dd className="font-timing text-lg">{c.drsZones}</dd></div>
            </dl>
            <Link to="/circuits/$circuitId" params={{ circuitId: c.id }} className="mt-4 inline-block text-xs uppercase tracking-widest text-accent story-link">
              Full circuit info →
            </Link>
          </div>
        </div>

      </section>

      {r.podium && (
        <section className="mt-8">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy className="h-3 w-3" /> Podium
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {r.podium.filter((did: string) => driversById[did]).map((did: string, i: number) => {
              const d = driversById[did];
              const t = teamOf(data, d.team);
              return (
                <Link
                  key={did}
                  to="/drivers/$driverId"
                  params={{ driverId: did }}
                  className={"relative overflow-hidden rounded-2xl border p-4 sm:p-5 hover:border-accent/50 transition-colors " + (i === 0 ? "carbon-texture border-accent/40" : "border-border bg-surface/40")}
                >
                  <div className="absolute inset-y-0 left-0 w-1" style={{ background: t.color }} />
                  <div className="font-display text-4xl sm:text-5xl" style={{ color: i === 0 ? "var(--accent)" : undefined }}>P{i + 1}</div>
                  <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">{t.name}</div>
                  <div className="font-display text-xl leading-tight">{d.firstName}</div>
                  <div className="font-display text-2xl leading-tight">{d.lastName}</div>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {r.poleId && driversById[r.poleId] && (
              <MiniStat label="Pole position" value={`${driversById[r.poleId].firstName} ${driversById[r.poleId].lastName}`} sub={teamOf(data, driversById[r.poleId].team).name} />
            )}
            {r.fastestLap && driversById[r.fastestLap.driverId] && (
              <MiniStat label="Fastest lap" value={r.fastestLap.time} sub={`${driversById[r.fastestLap.driverId].lastName} · Lap ${r.fastestLap.lap}`} />
            )}
            {r.fastestPit && (
              <MiniStat label="Fastest pit" value={`${r.fastestPit.seconds.toFixed(2)}s`} sub={teamOf(data, r.fastestPit.team).name} icon={<Wrench className="h-3 w-3" />} />)}
          </div>
        </section>
      )}

      {!isUpcoming && (
        <section className="mt-8 space-y-6">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
            <Timer className="h-3 w-3" /> Race analysis
          </h2>

          {detail.isLoading ? (
            <RaceControlTimelineSkeleton />
          ) : (
            <>
              {detail.data?.stints?.length ? (
                <TyreTracker
                  stints={detail.data.stints}
                  totalLaps={c.laps}
                  driversByNumber={driversByNumber}
                  teamFor={teamFor}
                />
              ) : null}

              {detail.data?.pitStops?.length ? (
                <PitStopDashboard
                  pitStops={detail.data.pitStops}
                  driversById={driversById}
                  teamFor={teamFor}
                />
              ) : null}

              <RaceControlTimeline
                events={detail.data?.events ?? []}
                source={detail.data?.eventsSource ?? "none"}
                driversById={driversById}
                driversByNumber={driversByNumber}
                teamFor={teamFor}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-accent/50 bg-accent/10 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-accent-glow">
      {children}
    </span>
  );
}

function MiniStat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">{icon}{label}</div>
      <div className="mt-1 font-timing tabular-nums text-2xl leading-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

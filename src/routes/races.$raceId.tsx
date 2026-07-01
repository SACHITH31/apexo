import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { circuits, driversById, racesById, teams } from "@/lib/mock-data";
import { ChevronLeft, Flag, Timer, Trophy, Wrench } from "lucide-react";
import { LightsOutCountdown } from "@/components/LightsOutCountdown";

export const Route = createFileRoute("/races/$raceId")({
  head: ({ params }) => {
    const r = racesById[params.raceId];
    return { meta: [
      { title: r ? `${r.name} · Apexo` : "Race · Apexo" },
      { name: "description", content: r ? `${r.officialName} — schedule, results, and race weekend info.` : "F1 race weekend." },
    ] };
  },
  loader: ({ params }) => {
    const r = racesById[params.raceId];
    if (!r) throw notFound();
    return { race: r };
  },
  component: RacePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Race not found</h1>
      <Link to="/calendar" className="mt-4 inline-block text-accent uppercase tracking-widest text-xs">Full calendar</Link>
    </div>
  ),
});

function fmt(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function RacePage() {
  const { race: r } = Route.useLoaderData();
  const c = circuits[r.circuitId];
  const isUpcoming = r.status === "upcoming";

  const sessions: [string, string | undefined][] = [
    ["FP1", r.sessions.fp1],
    ["FP2", r.sessions.fp2],
    ["FP3", r.sessions.fp3],
    ["Sprint Quali", r.sessions.sprintQuali],
    ["Sprint", r.sessions.sprint],
    ["Qualifying", r.sessions.quali],
    ["Race", r.sessions.race],
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/calendar" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-3 w-3" /> Calendar
      </Link>

      <header className="relative overflow-hidden rounded-2xl carbon-texture border border-border p-6 sm:p-10">
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Round {r.round} · <span aria-hidden>{c.flag}</span> {c.country}
        </div>
        <h1 className="mt-1 font-display text-4xl sm:text-6xl leading-none">{r.name}</h1>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{r.officialName}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {r.hasSprint && <Badge>Sprint weekend</Badge>}
          <Badge>{isUpcoming ? "Upcoming" : "Completed"}</Badge>
        </div>
      </header>

      {isUpcoming && (
        <section className="mt-6">
          <LightsOutCountdown target={r.sessions.race} label="Lights out" sublabel="Race start" />
        </section>
      )}

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Timer className="h-3 w-3" /> Weekend schedule
          </div>
          <ul className="mt-4 divide-y divide-border">
            {sessions.map(([label, iso]) =>
              iso ? (
                <li key={label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <span className="text-sm uppercase tracking-widest text-muted-foreground">{label}</span>
                  <span className={"font-timing tabular-nums text-sm " + (label === "Race" ? "text-gradient-accent text-base" : "text-foreground")}>
                    {fmt(iso)}
                  </span>
                </li>
              ) : null,
            )}
          </ul>
        </div>

        <div className="glass rounded-2xl p-6">
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
          <Link to="/circuits/$circuitId" params={{ circuitId: c.id }} className="mt-4 inline-block text-xs uppercase tracking-widest text-accent hover:underline">
            Full circuit info →
          </Link>
        </div>
      </section>

      {r.podium && (
        <section className="mt-8">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy className="h-3 w-3" /> Podium
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {r.podium.map((did: string, i: number) => {
              const d = driversById[did];
              const t = teams[d.team];
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
            {r.poleId && (
              <MiniStat label="Pole position" value={`${driversById[r.poleId].firstName} ${driversById[r.poleId].lastName}`} sub={teams[driversById[r.poleId].team].name} />
            )}
            {r.fastestLap && (
              <MiniStat label="Fastest lap" value={r.fastestLap.time} sub={`${driversById[r.fastestLap.driverId].lastName} · Lap ${r.fastestLap.lap}`} />
            )}
            {r.fastestPit && (
              <MiniStat label="Fastest pit" value={`${r.fastestPit.seconds.toFixed(2)}s`} sub={teams[r.fastestPit.team as keyof typeof teams].name} icon={<Wrench className="h-3 w-3" />} />)}
          </div>
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

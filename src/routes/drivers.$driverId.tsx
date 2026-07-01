import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { driversById, races, teams } from "@/lib/mock-data";
import { ChevronLeft, Award } from "lucide-react";

export const Route = createFileRoute("/drivers/$driverId")({
  head: ({ params }) => {
    const d = driversById[params.driverId];
    const title = d ? `${d.firstName} ${d.lastName} · Apexo` : "Driver · Apexo";
    return { meta: [
      { title },
      { name: "description", content: d ? `${d.firstName} ${d.lastName} — ${teams[d.team].name} — 2025 season stats and career record.` : "F1 driver profile." },
    ] };
  },
  loader: ({ params }) => {
    const d = driversById[params.driverId];
    if (!d) throw notFound();
    return { driver: d };
  },
  component: DriverProfile,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Driver not found</h1>
      <Link to="/drivers" className="mt-4 inline-block text-accent uppercase tracking-widest text-xs">Back to grid</Link>
    </div>
  ),
});

function DriverProfile() {
  const { driver: d } = Route.useLoaderData();
  const t = teams[d.team as keyof typeof teams];
  const age = new Date(Date.now() - new Date(d.dob).getTime()).getUTCFullYear() - 1970;

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
          </div>
        </div>
      </header>

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
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">2025 season</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BigStat label="Points" value={d.seasonPoints} />
          <BigStat label="Wins" value={d.seasonWins} />
          <BigStat label="Podiums" value={d.seasonPodiums} />
          <BigStat label="Age" value={age} />
        </div>
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

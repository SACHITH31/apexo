import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { circuits, races } from "@/lib/mock-data";
import { ChevronLeft } from "lucide-react";
import { CircuitSignature } from "@/components/CircuitSignature";
import { DetailSkeleton } from "@/components/Skeletons";

export const Route = createFileRoute("/circuits/$circuitId")({
  head: ({ params }) => {
    const c = circuits[params.circuitId];
    return { meta: [
      { title: c ? `${c.name} · Apexo` : "Circuit · Apexo" },
      { name: "description", content: c ? `${c.name} in ${c.location} — length, lap record, DRS zones, and history.` : "F1 circuit info." },
    ] };
  },
  loader: async ({ params }) => {
    const c = circuits[params.circuitId];
    if (!c) throw notFound();
    return { circuit: c };
  },
  component: CircuitPage,
  pendingComponent: DetailSkeleton,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Circuit not found</h1>
      <Link to="/circuits" className="mt-4 inline-block text-accent uppercase tracking-widest text-xs">All circuits</Link>
    </div>
  ),
});

function CircuitPage() {
  const { circuit: c } = Route.useLoaderData();
  const race = races.find((r) => r.circuitId === c.id);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/circuits" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-3 w-3" /> All circuits
      </Link>

      <header className="relative overflow-hidden rounded-2xl carbon-texture team-aura border border-border p-6 sm:p-10 animate-slide-up">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 text-accent opacity-30">
          <CircuitSignature id={c.id} className="h-full w-full" strokeWidth={1.6} />
        </div>
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span aria-hidden>{c.flag}</span> {c.country}
          </div>
          <h1 className="mt-1 font-display text-4xl sm:text-6xl leading-none">{c.name}</h1>
          <p className="mt-2 text-muted-foreground">{c.location}</p>
          <p className="mt-4 max-w-2xl">{c.notes}</p>
        </div>
      </header>


      <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Length" value={`${c.lengthKm} km`} />
        <Stat label="Race laps" value={c.laps} />
        <Stat label="DRS zones" value={c.drsZones} />
        <Stat label="First GP" value={c.firstGp} />
      </section>

      <section className="mt-6 glass rounded-2xl p-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Lap record</div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <div className="font-timing text-4xl tabular-nums text-gradient-accent">{c.lapRecord.time}</div>
          <div className="text-foreground">{c.lapRecord.driver}</div>
          <div className="text-muted-foreground">({c.lapRecord.year})</div>
        </div>
      </section>

      {race && (
        <section className="mt-6">
          <Link to="/races/$raceId" params={{ raceId: race.id }} className="glass rounded-2xl p-6 flex items-center justify-between hover:border-accent/50 border border-transparent">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">2025 event</div>
              <div className="font-display text-2xl mt-1">{race.name}</div>
              <div className="text-xs text-muted-foreground">Round {race.round}</div>
            </div>
            <div className="text-xs uppercase tracking-widest text-accent">View race →</div>
          </Link>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-timing tabular-nums text-2xl">{value}</div>
    </div>
  );
}

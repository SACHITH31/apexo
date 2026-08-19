import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { seasonQueryOptions, useSeason } from "@/lib/f1-data";
import { ChevronLeft } from "lucide-react";
import { CircuitSignature } from "@/components/CircuitSignature";
import { DetailSkeleton } from "@/components/Skeletons";
import { ShareCard } from "@/components/ShareCard";
import { OVERTAKE_LABEL, WEAR_LABEL, profileFor } from "@/lib/circuit-profiles";
import { DnaPanel } from "@/components/DnaRadar";
import { circuitDna } from "@/lib/f1-dna";
import { CircuitExplorer } from "@/components/CircuitExplorer";
import { CircuitHistory } from "@/components/CircuitHistory";


export const Route = createFileRoute("/circuits/$circuitId")({
  head: ({ params }) => {
    const name = params.circuitId
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return { meta: [
      { title: `${name} · Apexo` },
      { name: "description", content: `${name} — circuit length, lap record, DRS zones, and history.` },
    ] };
  },
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(seasonQueryOptions());
    if (!data.circuits[params.circuitId]) throw notFound();
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
  const { circuitId } = Route.useParams();
  const { circuits, races, season } = useSeason();
  const c = circuits[circuitId];
  const race = races.find((r) => r.circuitId === c.id);
  const profile = profileFor(c.id, { lengthKm: c.lengthKm, drsZones: c.drsZones });
  const dna = circuitDna(c.id, profile, c.drsZones);

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
        <Stat label="Corners" value={profile.corners} />
        <Stat label="Elevation" value={`${profile.elevationM} m`} />
        <Stat label="Top speed" value={`${profile.topSpeedKph} kph`} />
        <Stat label="Full distance" value={`${(c.lengthKm * c.laps).toFixed(1)} km`} />
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden glass rounded-2xl p-6 hover-lift">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Track demands</div>
          <div className="mt-4 space-y-4">
            <Meter label="Tyre wear" value={profile.tyreWear} caption={WEAR_LABEL[profile.tyreWear]} />
            <Meter label="Brake wear" value={profile.brakeWear} caption={WEAR_LABEL[profile.brakeWear]} />
            <Meter
              label="Overtaking"
              value={profile.overtaking}
              caption={OVERTAKE_LABEL[profile.overtaking]}
            />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 hover-lift">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Lap record</div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div className="font-timing text-4xl tabular-nums text-gradient-accent">{c.lapRecord.time}</div>
            <div className="text-foreground">{c.lapRecord.driver}</div>
            <div className="text-muted-foreground">({c.lapRecord.year})</div>
          </div>
          {profile.history && (
            <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">{profile.history}</p>
          )}
          <ShareCard
            className="mt-5"
            eyebrow={`${c.country} · Circuit`}
            title={c.name}
            subtitle={c.location}
            fileName={`apexo-${c.id}`}
            stats={[
              { label: "Length", value: `${c.lengthKm} km` },
              { label: "Corners", value: String(profile.corners) },
              { label: "Race laps", value: String(c.laps) },
              { label: "Lap record", value: c.lapRecord.time },
            ]}
          />
        </div>
      </section>

      <section className="mt-8">
        <DnaPanel
          title={c.name}
          subtitle="Circuit character across ten track traits"
          profile={dna}
          accent="var(--accent)"
        />
      </section>

      <CircuitExplorer
        circuitId={c.id}
        profile={profile}
        lengthKm={c.lengthKm}
        drsZones={c.drsZones}
      />

      <CircuitHistory circuitId={c.id} />




      {race && (
        <section className="mt-6">
          <Link to="/races/$raceId" params={{ raceId: race.id }} className="glass rounded-2xl p-6 flex items-center justify-between hover:border-accent/50 border border-transparent">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{season} event</div>
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

function Meter({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold uppercase tracking-widest">{caption}</span>
      </div>
      <div className="mt-1.5 flex gap-1.5" role="img" aria-label={`${label}: ${caption}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={
              "h-2 flex-1 rounded-full transition-colors " +
              (i <= value ? "accent-line" : "bg-surface/70 border border-border")
            }
          />
        ))}
      </div>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { circuits, races, type Race } from "@/lib/mock-data";
import { Calendar as CalIcon, MapPin, Timer } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "2025 F1 Calendar · Apexo" },
      { name: "description", content: "The full 24-round Formula 1 2025 season schedule with session times in your local timezone." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const now = Date.now();
  const nextIdx = races.findIndex((r) => new Date(r.sessions.race).getTime() > now);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
          <CalIcon className="h-3 w-3" /> 2025 Season
        </div>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">
          Race <span className="text-gradient-accent">calendar</span>
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          24 rounds. All times shown in your local timezone. Sprint weekends flagged in red.
        </p>
      </header>

      <ol className="space-y-3">
        {races.map((r, i) => (
          <RaceCard key={r.id} race={r} isNext={i === nextIdx} />
        ))}
      </ol>
    </div>
  );
}

function RaceCard({ race, isNext }: { race: Race; isNext: boolean }) {
  const c = circuits[race.circuitId];
  const raceDate = new Date(race.sessions.race);
  const isPast = raceDate.getTime() < Date.now();
  const dateStr = raceDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeStr = raceDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <li>
      <Link
        to="/races/$raceId"
        params={{ raceId: race.id }}
        className={
          "relative flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-all group " +
          (isNext
            ? "border-accent/60 bg-surface/70 shadow-broadcast"
            : "border-border bg-surface/40 hover:border-accent/40 hover:bg-surface/60") +
          (isPast ? " opacity-70" : "")
        }
      >
        {isNext && <div className="absolute inset-y-3 left-0 w-1 accent-line rounded-r-full" />}

        <div className="w-16 text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Round</div>
          <div className="font-display text-4xl leading-none">{String(race.round).padStart(2, "0")}</div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden className="text-xl">{c.flag}</span>
            <h2 className="font-display text-2xl leading-tight">{race.name}</h2>
            {race.hasSprint && (
              <span className="rounded-full border border-accent/60 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-accent-glow">
                Sprint
              </span>
            )}
            {isNext && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase tracking-widest text-accent-foreground">
                Next
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.name}, {c.location}</span>
            <span className="inline-flex items-center gap-1"><Timer className="h-3 w-3" /> {c.lengthKm} km · {race.round <= (races.findIndex((rr) => rr.status === "upcoming")) ? "Completed" : `${c.laps} laps`}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="font-timing text-2xl">{dateStr}</div>
          <div className="text-xs text-muted-foreground">{timeStr}</div>
        </div>
      </Link>
    </li>
  );
}

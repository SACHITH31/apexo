import { createFileRoute, Link } from "@tanstack/react-router";
import { type Race } from "@/lib/mock-data";
import { seasonQueryOptions, useSeason } from "@/lib/f1-data";
import { Calendar as CalIcon, MapPin, Timer, Zap } from "lucide-react";
import { CircuitSignature } from "@/components/CircuitSignature";
import { FormattedDate } from "@/components/ClientOnly";
import { CalendarSkeleton } from "@/components/Skeletons";
import { SeasonSelector } from "@/components/SeasonSelector";
import { useSeasonSelection } from "@/lib/season";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "F1 Race Calendar · Apexo" },
      { name: "description", content: "The full Formula 1 season schedule with session times in your local timezone." },
    ],
  }),
  component: CalendarPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(seasonQueryOptions()),

  pendingComponent: CalendarSkeleton,
});

function CalendarPage() {
  const { isCurrent } = useSeasonSelection();
  const { season, races } = useSeason();
  const now = Date.now();
  const nextIdx = races.findIndex((r) => new Date(r.sessions.race).getTime() > now);
  const completedCount = races.filter((r) => r.status === "completed").length;
  const upcomingCount = races.length - completedCount;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-10 relative">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
            <CalIcon className="h-3 w-3" /> {season} Season
          </div>
          <SeasonSelector className="ml-auto" />
        </div>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">
          Race <span className="text-gradient-accent">calendar</span>
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          {races.length} rounds. {isCurrent
            ? "All times shown in your local timezone. Sprint weekends flagged in red."
            : "Historical season — every round with its winner, pole and fastest lap."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Chip>{completedCount} completed</Chip>
          <Chip highlight>{upcomingCount} remaining</Chip>
          <Chip>{races.filter((r) => r.hasSprint).length} sprint weekends</Chip>
        </div>
      </header>

      <ol className="space-y-3">
        {races.map((r, i) => (
          <RaceCard key={r.id} race={r} isNext={i === nextIdx} index={i} />
        ))}
      </ol>
    </div>
  );
}

function Chip({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span className={
      "rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-medium " +
      (highlight
        ? "bg-accent/15 border border-accent/60 text-accent-glow"
        : "border border-border bg-surface/50 text-muted-foreground")
    }>
      {children}
    </span>
  );
}

function RaceCard({ race, isNext, index }: { race: Race; isNext: boolean; index: number }) {
  const { circuits, driversById } = useSeason();
  const c = circuits[race.circuitId];
  const raceDate = new Date(race.sessions.race);
  const isPast = raceDate.getTime() < Date.now();

  return (
    <li className="animate-slide-up" style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
      <Link
        to="/races/$raceId"
        params={{ raceId: race.id }}
        className={
          "relative overflow-hidden flex flex-wrap items-center gap-4 rounded-xl border p-4 sm:p-5 transition-all group hover-lift " +
          (isNext
            ? "border-accent/60 bg-surface/70 shadow-broadcast"
            : "border-border bg-surface/40 hover:border-accent/40 hover:bg-surface/60") +
          (isPast ? " opacity-70" : "")
        }
      >
        {isNext && <div className="absolute inset-y-3 left-0 w-1 accent-line rounded-r-full" />}
        <div className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 h-24 w-40 text-accent opacity-10 group-hover:opacity-25 transition-opacity">
          <CircuitSignature id={c.id} className="h-full w-full" strokeWidth={1.6} />
        </div>

        <div className="w-16 text-center relative">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Round</div>
          <div className="font-display text-4xl leading-none">{String(race.round).padStart(2, "0")}</div>
        </div>

        <div className="min-w-0 flex-1 relative">
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden className="text-xl">{c.flag}</span>
            <h2 className="font-display text-2xl leading-tight">{race.name}</h2>
            {race.hasSprint && (
              <span className="rounded-full border border-accent/60 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-accent-glow inline-flex items-center gap-1">
                <Zap className="h-3 w-3" /> Sprint
              </span>
            )}
            {isNext && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase tracking-widest text-accent-foreground inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" /> Next
              </span>
            )}
            {isPast && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Done</span>
            )}
          </div>
          <div className="mt-1 text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.name}, {c.location}</span>
            <span className="inline-flex items-center gap-1"><Timer className="h-3 w-3" /> {c.lengthKm} km · {c.laps} laps</span>
          </div>
        </div>

        <div className="text-right relative">
          <div className="font-timing text-2xl"><FormattedDate iso={race.sessions.race} mode="date" /></div>
          <div className="text-xs text-muted-foreground"><FormattedDate iso={race.sessions.race} mode="time" /></div>
        </div>

        {isPast && (race.podium?.[0] || race.poleId || race.fastestLap) && (
          <dl className="relative w-full min-w-0 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-border pt-3">
            {race.podium?.[0] && driversById[race.podium[0]] && (
              <Result label="Winner" value={driversById[race.podium[0]].lastName} />
            )}
            {race.poleId && driversById[race.poleId] && (
              <Result label="Pole" value={driversById[race.poleId].lastName} />
            )}
            {race.fastestLap && (
              <Result
                label="Fastest lap"
                value={race.fastestLap.time}
                sub={driversById[race.fastestLap.driverId]?.lastName}
              />
            )}
          </dl>
        )}
      </Link>
    </li>
  );
}

function Result({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="truncate font-timing tabular-nums text-sm">{value}{sub ? ` · ${sub}` : ""}</dd>
    </div>
  );
}

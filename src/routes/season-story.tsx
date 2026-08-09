import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarRange, ChevronDown, Flag, Gauge, Timer, Trophy, Zap } from "lucide-react";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { seasonStatsQueryOptions, useSeasonStats } from "@/lib/f1-extra-data";
import { PageSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { ProShareCard } from "@/components/ProShareCard";
import { PageTransition } from "@/components/PageTransition";

export const Route = createFileRoute("/season-story")({
  head: () => ({
    meta: [
      { title: "Season Story · Apexo" },
      {
        name: "description",
        content:
          "The current Formula 1 season told round by round: winners, poles, fastest laps, podiums and every championship swing on one animated timeline.",
      },
      { property: "og:title", content: "Season Story · Apexo" },
      {
        property: "og:description",
        content: "An interactive round-by-round timeline of the Formula 1 season, with championship leaders after every race.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(seasonQueryOptions());
    context.queryClient.prefetchQuery(seasonStatsQueryOptions());
  },
  component: SeasonStoryPage,
  pendingComponent: PageSkeleton,
});

type Filter = "all" | "sprint" | "swings" | "upcoming";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All rounds" },
  { id: "sprint", label: "Sprint" },
  { id: "swings", label: "Title swings" },
  { id: "upcoming", label: "Upcoming" },
];

function SeasonStoryPage() {
  const season = useSeason();
  const stats = useSeasonStats();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);

  /** Running championship state after each completed round. */
  const chapters = useMemo(() => {
    const driverPts: Record<string, number> = {};
    const teamPts: Record<string, number> = {};
    let prevLeader: string | undefined;

    const byRound = new Map(stats.perRace.map((r) => [r.round, r]));

    return season.races.map((race) => {
      const result = byRound.get(race.round);
      let leader: string | undefined;
      let teamLeader: string | undefined;
      let leaderChange = false;
      let gap = 0;

      if (result) {
        for (const e of result.entries) {
          driverPts[e.driverId] = (driverPts[e.driverId] ?? 0) + e.points;
          teamPts[e.constructorId] = (teamPts[e.constructorId] ?? 0) + e.points;
        }
        const ranked = Object.entries(driverPts).sort((a, b) => b[1] - a[1]);
        leader = ranked[0]?.[0];
        gap = Math.round((ranked[0]?.[1] ?? 0) - (ranked[1]?.[1] ?? 0));
        teamLeader = Object.entries(teamPts).sort((a, b) => b[1] - a[1])[0]?.[0];
        leaderChange = Boolean(leader && prevLeader && leader !== prevLeader);
        if (leader) prevLeader = leader;
      }

      const circuit = season.circuits[race.circuitId];
      return {
        race,
        circuit,
        completed: Boolean(result?.entries.length),
        leader,
        teamLeader,
        leaderChange,
        gap,
        entries: result?.entries ?? [],
      };
    });
  }, [season, stats]);

  const filtered = useMemo(
    () =>
      chapters.filter((c) => {
        if (filter === "sprint") return c.race.hasSprint;
        if (filter === "swings") return c.leaderChange;
        if (filter === "upcoming") return !c.completed;
        return true;
      }),
    [chapters, filter],
  );

  const driverName = (id?: string) => (id ? (season.driversById[id]?.name ?? id) : "—");

  if (!season.races.length) {
    return (
      <EmptyState
        icon={<CalendarRange className="h-6 w-6" />}
        title="No season data yet"
        description="The championship calendar hasn't been published for this season."
        actionLabel="Back to home"
        actionTo="/"
      />
    );
  }

  const completedCount = chapters.filter((c) => c.completed).length;
  const swings = chapters.filter((c) => c.leaderChange).length;

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="relative overflow-hidden rounded-2xl carbon-texture border border-border p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 accent-line" />
          <div className="pointer-events-none absolute inset-0 checker-flag opacity-[0.04]" />
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {season.season} World Championship
          </div>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-6xl">Season Story</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Every round of the {season.season} season as a living timeline — winners, poles, fastest laps
            and the exact moments the championship changed hands.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Chip label="Rounds" value={String(season.races.length)} />
            <Chip label="Raced" value={String(completedCount)} />
            <Chip label="Lead changes" value={String(swings)} />
            <ProShareCard
              className="ml-auto"
              label="Share season"
              data={{
                eyebrow: `${season.season} Season Story`,
                title: "Season so far",
                subtitle: `${completedCount} of ${season.races.length} rounds complete`,
                fileName: `apexo-season-${season.season}`,
                stats: [
                  { label: "Championship leader", value: driverName(chapters.filter((c) => c.completed).at(-1)?.leader) },
                  { label: "Rounds complete", value: `${completedCount}/${season.races.length}` },
                  { label: "Lead changes", value: String(swings) },
                  { label: "Sprint weekends", value: String(season.races.filter((r) => r.hasSprint).length) },
                ],
              }}
            />
          </div>
        </header>

        <div
          role="tablist"
          aria-label="Filter rounds"
          className="sticky top-16 z-20 -mx-4 mt-6 flex gap-1.5 overflow-x-auto px-4 py-3 backdrop-blur-md sm:mx-0 sm:px-0"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              type="button"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={
                "shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors " +
                (filter === f.id
                  ? "border-accent/60 bg-accent/10 text-foreground"
                  : "border-border bg-surface/50 text-muted-foreground hover:text-foreground")
              }
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="ml-auto hidden shrink-0 rounded-full border border-border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground sm:block"
          >
            Collapse all
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<Flag className="h-6 w-6" />}
              title="No rounds match this filter"
              description="Try another filter to keep reading the season story."
            />
          </div>
        ) : (
          <ol className="relative mt-2 space-y-3 pl-6 sm:pl-8">
            <span
              aria-hidden
              className="absolute inset-y-2 left-[7px] w-px bg-gradient-to-b from-accent/60 via-border to-transparent sm:left-[11px]"
            />
            {filtered.map((c, i) => (
              <Chapter
                key={c.race.id}
                index={i}
                chapter={c}
                season={season}
                expanded={open === c.race.round}
                onToggle={() => setOpen(open === c.race.round ? null : c.race.round)}
              />
            ))}
          </ol>
        )}
      </div>
    </PageTransition>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/50 px-3 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="font-timing text-base tabular-nums">{value}</div>
    </div>
  );
}

type Chapter = ReturnType<typeof useChapterType>;
// helper only for typing convenience
function useChapterType() {
  return {} as {
    race: ReturnType<typeof useSeason>["races"][number];
    circuit: ReturnType<typeof useSeason>["circuits"][string] | undefined;
    completed: boolean;
    leader?: string;
    teamLeader?: string;
    leaderChange: boolean;
    gap: number;
    entries: { driverId: string; constructorId: string; position: number; points: number; fastestLap: boolean; grid: number }[];
  };
}

function Chapter({
  chapter,
  season,
  expanded,
  index,
  onToggle,
}: {
  chapter: Chapter;
  season: ReturnType<typeof useSeason>;
  expanded: boolean;
  index: number;
  onToggle: () => void;
}) {
  const { race, circuit, entries, completed } = chapter;
  const podium = useMemo(
    () => [...entries].filter((e) => e.position >= 1 && e.position <= 3).sort((a, b) => a.position - b.position),
    [entries],
  );
  const winner = podium[0];
  const pole = useMemo(() => entries.find((e) => e.grid === 1), [entries]);
  const fastest = useMemo(() => entries.find((e) => e.fastestLap), [entries]);
  const accent = winner ? teamOf(season, winner.constructorId).color : "var(--accent)";
  const name = (id?: string) => (id ? (season.driversById[id]?.name ?? id) : "—");
  const code = (id?: string) => (id ? (season.driversById[id]?.code ?? id.slice(0, 3).toUpperCase()) : "—");

  return (
    <li className="relative motion-safe:animate-slide-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <span
        aria-hidden
        className="absolute -left-6 top-6 grid h-3.5 w-3.5 place-items-center rounded-full border-2 sm:-left-8"
        style={{ borderColor: accent, background: completed ? accent : "var(--background)" }}
      />
      <div
        className="relative overflow-hidden rounded-xl glass border border-border transition-colors hover-lift"
        style={{ borderColor: expanded ? `color-mix(in oklch, ${accent} 45%, transparent)` : undefined }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-0.5" style={{ background: accent }} />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <span className="font-timing text-xl tabular-nums text-muted-foreground">
            {String(race.round).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="font-display text-xl leading-none truncate">{race.name}</span>
              {race.hasSprint && (
                <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-accent">
                  Sprint
                </span>
              )}
              {chapter.leaderChange && (
                <span className="rounded-sm border border-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  New leader
                </span>
              )}
            </span>
            <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">
                {circuit ? `${circuit.flag} ${circuit.name}` : race.circuitId}
              </span>
              <span aria-hidden>·</span>
              <span className="font-timing tabular-nums">
                {new Date(race.sessions.race).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
              </span>
            </span>
          </span>
          {completed ? (
            <span className="hidden text-right sm:block">
              <span className="block text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Winner</span>
              <span className="font-display text-lg leading-none" style={{ color: accent }}>
                {code(winner?.driverId)}
              </span>
            </span>
          ) : (
            <span className="hidden rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground sm:block">
              Upcoming
            </span>
          )}
          <ChevronDown
            className={"h-4 w-4 shrink-0 text-muted-foreground transition-transform " + (expanded ? "rotate-180" : "")}
            aria-hidden
          />
        </button>

        {expanded && (
          <div className="border-t border-border/60 p-4 motion-safe:animate-slide-up">
            {completed ? (
              <>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Fact icon={<Trophy className="h-3.5 w-3.5" />} label="Winner" value={name(winner?.driverId)} accent={accent} />
                  <Fact icon={<Zap className="h-3.5 w-3.5" />} label="Pole position" value={name(pole?.driverId)} />
                  <Fact icon={<Timer className="h-3.5 w-3.5" />} label="Fastest lap" value={name(fastest?.driverId)} />
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {podium.map((p) => (
                    <div key={p.driverId} className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2">
                      <span className="font-display text-lg" style={{ color: teamOf(season, p.constructorId).color }}>
                        P{p.position}
                      </span>
                      <span className="min-w-0 truncate text-sm">{name(p.driverId)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Fact
                    icon={<Trophy className="h-3.5 w-3.5" />}
                    label="Championship leader after round"
                    value={`${name(chapter.leader)}${chapter.gap ? ` · +${chapter.gap} pts` : ""}`}
                  />
                  <Fact
                    icon={<Gauge className="h-3.5 w-3.5" />}
                    label="Constructor leader"
                    value={chapter.teamLeader ? teamOf(season, chapter.teamLeader).name : "—"}
                  />
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {summarise(name(winner?.driverId), race.name, chapter.leaderChange, name(chapter.leader), chapter.gap)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                This chapter hasn't been written yet — {race.name} runs on{" "}
                {new Date(race.sessions.race).toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                .
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/races/$raceId"
                params={{ raceId: race.id }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
              >
                Race weekend
              </Link>
              {completed && (
                <ProShareCard
                  label="Share round"
                  data={{
                    eyebrow: `Round ${race.round} · ${season.season}`,
                    title: race.name,
                    subtitle: circuit ? `${circuit.name}, ${circuit.country}` : undefined,
                    accent,
                    fileName: `apexo-${race.id}`,
                    rows: podium.map((p) => ({
                      rank: `P${p.position}`,
                      name: name(p.driverId),
                      detail: teamOf(season, p.constructorId).name,
                    })),
                    stats: [
                      { label: "Winner", value: code(winner?.driverId) },
                      { label: "Pole", value: code(pole?.driverId) },
                      { label: "Fastest lap", value: code(fastest?.driverId) },
                      { label: "Leader after", value: code(chapter.leader) },
                    ],
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function Fact({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 truncate font-display text-lg leading-tight" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}

function summarise(winner: string, raceName: string, change: boolean, leader: string, gap: number) {
  if (change) return `${winner} took victory at the ${raceName} and the championship changed hands — ${leader} now leads by ${gap} points.`;
  if (gap <= 10) return `${winner} won the ${raceName} with the title fight still on a knife edge: ${leader} leads by just ${gap} points.`;
  return `${winner} controlled the ${raceName}, leaving ${leader} on top of the standings with a ${gap}-point cushion.`;
}

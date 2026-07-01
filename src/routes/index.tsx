import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Trophy, Clock, Flag, Sparkles } from "lucide-react";
import { LightsOutCountdown } from "@/components/LightsOutCountdown";
import {
  constructorStandings, driverStandings, driversById, getNextRace, circuits,
  pickOnThisDay, racesById, teams,
} from "@/lib/mock-data";
import { useTeamTheme } from "@/lib/theme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apexo — Your F1 command center" },
      { name: "description", content: "Countdown to the next Grand Prix, live standings, and race weekend at a glance." },
    ],
  }),
  component: Home,
});

function Home() {
  const nextRace = getNextRace();
  const circuit = circuits[nextRace.circuitId];
  const otd = pickOnThisDay();
  const { favoriteTeam } = useTeamTheme();
  const team = teams[favoriteTeam];
  const favDriver = Object.values(driversById).find((d) => d.team === favoriteTeam);

  const top3D = driverStandings.slice(0, 3);
  const top3C = constructorStandings.slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Hero */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl carbon-texture border border-border p-6 sm:p-10">
          <div className="absolute inset-y-0 left-0 w-1 accent-line" />
          <div className="absolute top-6 right-6 h-px w-24 accent-line opacity-70" />
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Round {nextRace.round} · 2025 Season</div>
          <h1 className="mt-2 font-display text-4xl sm:text-6xl leading-none">
            <span className="text-gradient-accent">{nextRace.name.replace(/ GP$/, "")}</span>
            <br />
            <span className="text-foreground">Grand Prix</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span aria-hidden className="text-lg">{circuit.flag}</span>
            <span className="font-medium text-foreground">{circuit.name}</span>
            <span>·</span>
            <span>{circuit.location}, {circuit.country}</span>
            {nextRace.hasSprint && (
              <span className="ml-1 rounded-full border border-accent/60 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-accent-glow">Sprint weekend</span>
            )}
          </div>

          <div className="mt-8">
            <LightsOutCountdown
              target={nextRace.sessions.race}
              label="Race start"
              sublabel={`Lights out · ${new Date(nextRace.sessions.race).toLocaleString(undefined, { weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })}`}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/races/$raceId"
              params={{ raceId: nextRace.id }}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-accent-foreground shadow-broadcast transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundImage: "var(--gradient-accent)" }}
            >
              Race weekend <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/calendar"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm font-semibold uppercase tracking-widest hover:border-accent/50"
            >
              Full calendar
            </Link>
          </div>
        </div>

        {/* Personalized module */}
        <div className="glass rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> For you
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-10 w-1 rounded-full" style={{ background: team.color }} />
            <div>
              <div className="font-display text-2xl">{team.name}</div>
              <div className="text-xs text-muted-foreground">{team.fullName}</div>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Season pts" value={constructorStandings.find((c) => c.team.id === favoriteTeam)?.points ?? 0} />
            <Stat label="Championships" value={team.championships} />
            <Stat label="Principal" value={team.principal} small />
            <Stat label="Base" value={team.base} small />
          </dl>
          {favDriver && (
            <Link
              to="/drivers/$driverId"
              params={{ driverId: favDriver.id }}
              className="mt-auto pt-6 flex items-center gap-3 group"
            >
              <div
                className="h-12 w-12 rounded-full border-2 flex items-center justify-center font-display"
                style={{ borderColor: team.color, background: `${team.color}20` }}
              >
                {favDriver.code}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Lead driver</div>
                <div className="font-display text-lg truncate">{favDriver.firstName} {favDriver.lastName}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </Link>
          )}
        </div>
      </section>

      {/* Standings snapshot */}
      <section className="grid gap-6 md:grid-cols-2">
        <SnapshotCard
          title="Drivers' championship"
          icon={<Trophy className="h-4 w-4" />}
          href="/standings"
        >
          <ol className="divide-y divide-border">
            {top3D.map((s) => {
              const t = teams[s.driver.team];
              return (
                <li key={s.driver.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="font-display text-3xl w-8 text-center" style={{ color: s.position === 1 ? "var(--accent)" : undefined }}>
                    {s.position}
                  </div>
                  <div className="w-1 h-8 rounded-full" style={{ background: t.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg leading-none truncate">
                      {s.driver.firstName} <span className="font-timing">{s.driver.lastName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{t.name}</div>
                  </div>
                  <div className="font-timing text-2xl tabular-nums">{s.driver.seasonPoints}</div>
                </li>
              );
            })}
          </ol>
        </SnapshotCard>

        <SnapshotCard
          title="Constructors' championship"
          icon={<Flag className="h-4 w-4" />}
          href="/standings"
        >
          <ol className="divide-y divide-border">
            {top3C.map((s) => (
              <li key={s.team.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="font-display text-3xl w-8 text-center" style={{ color: s.position === 1 ? "var(--accent)" : undefined }}>
                  {s.position}
                </div>
                <div className="w-1 h-8 rounded-full" style={{ background: s.team.color }} />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg leading-none truncate">{s.team.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.team.base}</div>
                </div>
                <div className="font-timing text-2xl tabular-nums">{s.points}</div>
              </li>
            ))}
          </ol>
        </SnapshotCard>
      </section>

      {/* On this day + last race */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
            <Clock className="h-3 w-3" /> On this day in F1
          </div>
          <div className="mt-4 flex items-start gap-4">
            <div className="font-display text-5xl text-gradient-accent tabular-nums leading-none">{otd.year}</div>
            <p className="text-base text-foreground/90 leading-relaxed">{otd.text}</p>
          </div>
        </div>
        <LastRaceCard />
      </section>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={"font-timing tabular-nums " + (small ? "text-sm text-foreground mt-0.5" : "text-2xl mt-1")}>{value}</div>
    </div>
  );
}

function SnapshotCard({ title, icon, href, children }: { title: string; icon: React.ReactNode; href: "/standings"; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
          {icon} {title}
        </div>
        <Link to={href} className="text-xs uppercase tracking-widest text-accent hover:underline">See all</Link>
      </div>
      {children}
    </div>
  );
}

function LastRaceCard() {
  const last = [...racesById].map(() => 0); // placeholder to satisfy TS unused
  void last;
  const completed = Object.values(racesById).filter((r) => r.status === "completed");
  const last2 = completed[completed.length - 1];
  if (!last2 || !last2.podium) return null;
  const c = circuits[last2.circuitId];
  return (
    <Link
      to="/races/$raceId"
      params={{ raceId: last2.id }}
      className="glass rounded-2xl p-6 group hover:border-accent/50 transition-colors block"
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Last race</div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Round {last2.round}</div>
      </div>
      <div className="mt-2 font-display text-2xl">{last2.name}</div>
      <div className="text-xs text-muted-foreground">{c.flag} {c.name}</div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {last2.podium.map((did, i) => {
          const d = driversById[did];
          const t = teams[d.team];
          return (
            <div key={did} className="rounded-lg border border-border bg-surface/40 p-3">
              <div className="font-display text-xl" style={{ color: i === 0 ? "var(--accent)" : undefined }}>P{i + 1}</div>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-1 h-6 rounded-full" style={{ background: t.color }} />
                <div className="font-timing font-semibold truncate">{d.lastName.toUpperCase()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Link>
  );
}

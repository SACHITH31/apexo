import { createFileRoute } from "@tanstack/react-router";
import { constructorStandings, driverStandings, teams } from "@/lib/mock-data";
import { DriverRow } from "@/components/DriverRow";
import { useState } from "react";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/standings")({
  head: () => ({
    meta: [
      { title: "F1 Standings 2025 · Apexo" },
      { name: "description", content: "Live 2025 Formula 1 Drivers' and Constructors' championship standings." },
    ],
  }),
  component: StandingsPage,
});

function StandingsPage() {
  const [tab, setTab] = useState<"drivers" | "constructors">("drivers");
  const leader = driverStandings[0]?.driver.seasonPoints ?? 1;
  const leadTeam = constructorStandings[0];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">2025 season</div>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">Championship <span className="text-gradient-accent">standings</span></h1>
      </header>

      {/* Podium highlight (drivers tab) */}
      {tab === "drivers" && (
        <div className="mb-8 grid grid-cols-3 gap-3 items-end animate-slide-up">
          {[driverStandings[1], driverStandings[0], driverStandings[2]].map((s, ix) => {
            if (!s) return <div key={ix} />;
            const rank = ix === 1 ? 1 : ix === 0 ? 2 : 3;
            const t = teams[s.driver.team];
            const h = rank === 1 ? "h-40" : rank === 2 ? "h-32" : "h-28";
            return (
              <div key={s.driver.id} className={"relative overflow-hidden rounded-xl border p-4 flex flex-col justify-end " + h + " " + (rank === 1 ? "border-accent/60 carbon-texture shadow-broadcast" : "border-border bg-surface/40")}>
                <div className="absolute inset-y-0 left-0 w-1" style={{ background: t.color }} />
                {rank === 1 && <div className="absolute top-2 right-2 text-accent"><Trophy className="h-4 w-4" /></div>}
                <div className="font-display text-4xl leading-none" style={{ color: rank === 1 ? "var(--accent)" : undefined }}>P{rank}</div>
                <div className="mt-2 font-display text-lg leading-tight truncate">{s.driver.lastName}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{t.name}</div>
                <div className="mt-1 font-timing tabular-nums text-xl">{s.driver.seasonPoints} <span className="text-[10px] uppercase tracking-widest text-muted-foreground">pts</span></div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "constructors" && leadTeam && (
        <div className="mb-8 rounded-2xl border border-accent/60 carbon-texture shadow-broadcast p-6 animate-slide-up relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: leadTeam.team.color }} />
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Championship leader</div>
          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <div className="font-display text-4xl sm:text-5xl" style={{ color: leadTeam.team.color }}>{leadTeam.team.name}</div>
              <div className="text-sm text-muted-foreground">{leadTeam.team.fullName}</div>
            </div>
            <div className="text-right">
              <div className="font-timing tabular-nums text-5xl text-gradient-accent">{leadTeam.points}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">points</div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 inline-flex rounded-full border border-border bg-surface/60 p-1">
        {(["drivers", "constructors"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer " +
              (tab === t ? "bg-accent text-accent-foreground shadow-broadcast" : "text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "drivers" ? (
        <ul className="space-y-2">
          {driverStandings.map((s, i) => {
            const pct = (s.driver.seasonPoints / leader) * 100;
            return (
              <li key={s.driver.id} className="relative animate-slide-up" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
                <div className="absolute inset-y-0 left-0 pointer-events-none rounded-lg" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${teams[s.driver.team].color}22, transparent)` }} />
                <div className="relative">
                  <DriverRow
                    driver={s.driver}
                    position={s.position}
                    right={
                      <div className="text-right shrink-0">
                        <div className="font-timing text-3xl tabular-nums leading-none">{s.driver.seasonPoints}</div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                          {s.position === 1 ? "Leader" : `-${leader - s.driver.seasonPoints}`}
                        </div>
                      </div>
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="space-y-2">
          {constructorStandings.map((s, i) => {
            const leadPts = constructorStandings[0].points;
            const pct = (s.points / leadPts) * 100;
            return (
              <li
                key={s.team.id}
                className="relative overflow-hidden flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 hover:border-accent/50 transition-colors hover-lift animate-slide-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="absolute inset-y-0 left-0 pointer-events-none" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${s.team.color}22, transparent)` }} />
                <div className="relative font-timing text-2xl w-8 text-center text-muted-foreground">
                  {String(s.position).padStart(2, "0")}
                </div>
                <div className="relative w-1 h-10 rounded-full" style={{ background: s.team.color }} />
                <div className="relative min-w-0 flex-1">
                  <div className="font-display text-lg leading-tight truncate">{s.team.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.team.fullName}</div>
                </div>
                <div className="relative text-right shrink-0">
                  <div className="font-timing text-3xl tabular-nums leading-none">{s.points}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {s.position === 1 ? "Leader" : `-${leadPts - s.points}`}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Teams:</span>
        {Object.values(teams).map((t) => (
          <span key={t.id} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: t.color }} /> {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}

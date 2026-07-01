import { createFileRoute } from "@tanstack/react-router";
import { constructorStandings, driverStandings, teams } from "@/lib/mock-data";
import { DriverRow } from "@/components/DriverRow";
import { useState } from "react";

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

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">2025 season</div>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">Championship <span className="text-gradient-accent">standings</span></h1>
      </header>

      <div className="mb-6 inline-flex rounded-full border border-border bg-surface/60 p-1">
        {(["drivers", "constructors"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-all " +
              (tab === t ? "bg-accent text-accent-foreground shadow-broadcast" : "text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "drivers" ? (
        <ul className="space-y-2">
          {driverStandings.map((s) => (
            <DriverRow
              key={s.driver.id}
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
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {constructorStandings.map((s) => {
            const leadPts = constructorStandings[0].points;
            return (
              <li
                key={s.team.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 hover:border-accent/50 transition-colors"
              >
                <div className="font-timing text-2xl w-8 text-center text-muted-foreground">
                  {String(s.position).padStart(2, "0")}
                </div>
                <div className="w-1 h-10 rounded-full" style={{ background: s.team.color }} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg leading-tight truncate">{s.team.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.team.fullName}</div>
                </div>
                <div className="text-right shrink-0">
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

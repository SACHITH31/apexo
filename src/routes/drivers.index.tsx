import { createFileRoute } from "@tanstack/react-router";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { DriverRow } from "@/components/DriverRow";
import { DriversPageSkeleton } from "@/components/Skeletons";

export const Route = createFileRoute("/drivers/")({
  head: () => ({
    meta: [
      { title: "F1 Drivers · Apexo" },
      { name: "description", content: "Every driver on the current Formula 1 grid, with season stats and career records." },
    ],
  }),
  component: DriversPage,
  pendingComponent: DriversPageSkeleton,
});

function DriversPage() {
  const data = useSeason();
  const { drivers, season } = data;
  const sorted = [...drivers].sort((a, b) => b.seasonPoints - a.seasonPoints);
  const totalWins = drivers.reduce((s, d) => s + d.seasonWins, 0);
  const totalPodiums = drivers.reduce((s, d) => s + d.seasonPodiums, 0);
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-8 animate-slide-up">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{season} grid</div>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">The <span className="text-gradient-accent">drivers</span></h1>
        <div className="mt-5 grid grid-cols-3 gap-3 max-w-md">
          <Stat label="Drivers" value={drivers.length} />
          <Stat label="Season wins" value={totalWins} />
          <Stat label="Podiums" value={totalPodiums} />
        </div>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2">
        {sorted.map((d, i) => (
          <li key={d.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
            <DriverRow
              driver={d}
              right={
                <div className="text-right shrink-0">
                  <div className="font-timing text-2xl tabular-nums leading-none">{d.seasonPoints}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5" style={{ color: teamOf(data, d.team).color }}>
                    {teamOf(data, d.team).name}
                  </div>
                </div>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-timing tabular-nums text-2xl">{value}</div>
    </div>
  );
}

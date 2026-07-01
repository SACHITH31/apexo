import { createFileRoute } from "@tanstack/react-router";
import { drivers } from "@/lib/mock-data";
import { DriverRow } from "@/components/DriverRow";

export const Route = createFileRoute("/drivers/")({
  head: () => ({
    meta: [
      { title: "F1 Drivers 2025 · Apexo" },
      { name: "description", content: "Every driver on the 2025 Formula 1 grid, with season stats and career records." },
    ],
  }),
  component: DriversPage,
});

function DriversPage() {
  const sorted = [...drivers].sort((a, b) => b.seasonPoints - a.seasonPoints);
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">2025 grid</div>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">The <span className="text-gradient-accent">drivers</span></h1>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2">
        {sorted.map((d) => (
          <DriverRow
            key={d.id}
            driver={d}
            right={<div className="font-timing text-2xl tabular-nums">{d.seasonPoints}</div>}
          />
        ))}
      </ul>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { circuits } from "@/lib/mock-data";

export const Route = createFileRoute("/circuits/")({
  head: () => ({
    meta: [
      { title: "F1 Circuits · Apexo" },
      { name: "description", content: "Every Formula 1 circuit on the 2025 calendar — lap records, DRS zones, and history." },
    ],
  }),
  component: CircuitsIndex,
});

function CircuitsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The tracks</div>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">Every <span className="text-gradient-accent">circuit</span></h1>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(circuits).map((c) => (
          <li key={c.id}>
            <Link
              to="/circuits/$circuitId"
              params={{ circuitId: c.id }}
              className="group block rounded-xl border border-border bg-surface/40 p-5 hover:border-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>{c.flag}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.country}</span>
              </div>
              <h2 className="mt-3 font-display text-2xl leading-tight">{c.name}</h2>
              <p className="text-xs text-muted-foreground">{c.location}</p>
              <dl className="mt-4 grid grid-cols-3 gap-1 text-center">
                <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Length</dt><dd className="font-timing text-sm">{c.lengthKm} km</dd></div>
                <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Laps</dt><dd className="font-timing text-sm">{c.laps}</dd></div>
                <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">DRS</dt><dd className="font-timing text-sm">{c.drsZones}</dd></div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

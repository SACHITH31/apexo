import { createFileRoute, Link } from "@tanstack/react-router";
import { circuits } from "@/lib/mock-data";
import { CircuitSignature } from "@/components/CircuitSignature";
import { Zap } from "lucide-react";

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
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The tracks</div>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">Every <span className="text-gradient-accent">circuit</span></h1>
        <p className="mt-2 text-muted-foreground max-w-xl">24 circuits, five continents. Signatures shown are stylized — swipe through for lap records and history.</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(circuits).map((c, i) => (
          <li key={c.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
            <Link
              to="/circuits/$circuitId"
              params={{ circuitId: c.id }}
              className="relative overflow-hidden group block rounded-xl border border-border bg-surface/40 p-5 hover:border-accent/50 transition-colors hover-lift"
            >
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-accent opacity-15 group-hover:opacity-30 transition-opacity">
                <CircuitSignature id={c.id} className="h-full w-full" strokeWidth={1.8} />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden>{c.flag}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.country}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl leading-tight">{c.name}</h2>
                <p className="text-xs text-muted-foreground">{c.location}</p>
                <dl className="mt-4 grid grid-cols-3 gap-1 text-center">
                  <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Length</dt><dd className="font-timing text-sm">{c.lengthKm} km</dd></div>
                  <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Laps</dt><dd className="font-timing text-sm">{c.laps}</dd></div>
                  <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">DRS</dt><dd className="font-timing text-sm inline-flex items-center gap-0.5"><Zap className="h-3 w-3 text-accent" />{c.drsZones}</dd></div>
                </dl>
                <div className="mt-3 pt-3 border-t border-border/60 text-[10px] text-muted-foreground">
                  <span className="uppercase tracking-widest">Lap record</span> · <span className="font-timing text-foreground">{c.lapRecord.time}</span> · {c.lapRecord.driver.split(" ").pop()}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

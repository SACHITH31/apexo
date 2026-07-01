import { createFileRoute } from "@tanstack/react-router";
import { glossary } from "@/lib/mock-data";

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "F1 Glossary · Apexo" },
      { name: "description", content: "Plain-language explainers of DRS, tyre compounds, parc fermé, points system, and other F1 terms." },
    ],
  }),
  component: GlossaryPage,
});

function GlossaryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Learn the sport</div>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">F1 <span className="text-gradient-accent">glossary</span></h1>
        <p className="mt-2 text-muted-foreground max-w-xl">The jargon, translated. Everything the broadcast doesn't stop to explain.</p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {glossary.map((g) => (
          <li key={g.term} className="rounded-xl border border-border bg-surface/40 p-5 hover:border-accent/40 transition-colors">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-2xl">{g.term}</h2>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{g.full}</span>
            </div>
            <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{g.def}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

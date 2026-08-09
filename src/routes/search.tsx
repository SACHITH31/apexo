import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { seasonQueryOptions, useSeason } from "@/lib/f1-data";
import { Search as SearchIcon } from "lucide-react";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · Apexo" },
      { name: "description", content: "Search across F1 drivers, teams, circuits, and races." },
    ],
  }),
  component: SearchPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(seasonQueryOptions()),

});

function SearchPage() {
  const { drivers, teams, circuits, races } = useSeason();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (query.length < 1) return null;
    const d = drivers.filter((x) =>
      `${x.firstName} ${x.lastName} ${x.code} ${x.nationality}`.toLowerCase().includes(query),
    );
    const t = Object.values(teams).filter((x) => x.name.toLowerCase().includes(query) || x.fullName.toLowerCase().includes(query));
    const c = Object.values(circuits).filter((x) => `${x.name} ${x.country} ${x.location}`.toLowerCase().includes(query));
    const r = races.filter((x) => `${x.name} ${x.officialName}`.toLowerCase().includes(query));
    return { d, t, c, r };
  }, [query, drivers, teams, circuits, races]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="font-display text-4xl sm:text-6xl">Search</h1>
      </header>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Drivers, teams, circuits, races…"
          className="w-full rounded-full border border-border bg-surface/60 py-3.5 pl-11 pr-4 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/40 transition"
        />
      </div>

      {!results && (
        <p className="mt-6 text-sm text-muted-foreground">Try a driver name (e.g. "Verstappen"), a team ("McLaren"), or a circuit ("Monaco").</p>
      )}

      {results && (
        <div className="mt-8 space-y-8">
          <Section title="Drivers" empty={results.d.length === 0}>
            {results.d.map((d) => {
              const t = teams[d.team];
              return (
                <Link key={d.id} to="/drivers/$driverId" params={{ driverId: d.id }} className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 hover:border-accent/50">
                  <div className="w-1 h-8 rounded-full" style={{ background: t.color }} />
                  <div className="min-w-0 flex-1"><div className="font-display text-lg truncate">{d.firstName} {d.lastName}</div><div className="text-xs text-muted-foreground">{d.flag} {t.name}</div></div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{d.code}</div>
                </Link>
              );
            })}
          </Section>
          <Section title="Teams" empty={results.t.length === 0}>
            {results.t.map((t) => (
              <Link key={t.id} to="/constructors/$teamId" params={{ teamId: t.id }} className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 hover:border-accent/50">
                <div className="w-1 h-8 rounded-full" style={{ background: t.color }} />
                <div className="min-w-0 flex-1"><div className="font-display text-lg truncate">{t.name}</div><div className="text-xs text-muted-foreground truncate">{t.fullName}</div></div>
              </Link>
            ))}
          </Section>
          <Section title="Circuits" empty={results.c.length === 0}>
            {results.c.map((c) => (
              <Link key={c.id} to="/circuits/$circuitId" params={{ circuitId: c.id }} className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 hover:border-accent/50">
                <span className="text-xl" aria-hidden>{c.flag}</span>
                <div className="min-w-0 flex-1"><div className="font-display text-lg truncate">{c.name}</div><div className="text-xs text-muted-foreground truncate">{c.location}, {c.country}</div></div>
              </Link>
            ))}
          </Section>
          <Section title="Races" empty={results.r.length === 0}>
            {results.r.map((r) => (
              <Link key={r.id} to="/races/$raceId" params={{ raceId: r.id }} className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 hover:border-accent/50">
                <div className="font-timing text-2xl w-8 text-center text-muted-foreground">{String(r.round).padStart(2, "0")}</div>
                <div className="min-w-0 flex-1"><div className="font-display text-lg truncate">{r.name}</div><div className="text-xs text-muted-foreground">{new Date(r.sessions.race).toLocaleDateString()}</div></div>
              </Link>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">{title}</h2>
      {empty ? <p className="text-sm text-muted-foreground">No matches.</p> : <ul className="grid gap-2">{children}</ul>}
    </section>
  );
}

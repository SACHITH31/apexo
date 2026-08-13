import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { seasonStatsQueryOptions } from "@/lib/f1-extra-data";
import { computeRecords } from "@/lib/records";
import { useAvailableSeasons, useSeasonSelection } from "@/lib/season";
import { Search as SearchIcon } from "lucide-react";

const PAGES = [
  { to: "/championship", label: "Championship Playback", hint: "Replay the season round-by-round" },
  { to: "/seasons", label: "Season Comparison", hint: "Compare any two seasons" },
  { to: "/records", label: "Records & Achievements", hint: "Season record book" },
  { to: "/season-story", label: "Season Story", hint: "Interactive season timeline" },
  { to: "/statistics", label: "Statistics", hint: "Championship analytics" },
  { to: "/compare", label: "Compare", hint: "Driver and team head-to-head" },
  { to: "/strategy", label: "Strategy Simulator", hint: "Pit stop strategy modelling" },
  { to: "/simulator", label: "Championship Simulator", hint: "Title permutations" },
  { to: "/circuits", label: "Circuits", hint: "Circuit explorer" },
  { to: "/glossary", label: "Glossary", hint: "F1 terminology" },
] as const;

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · Apexo" },
      { name: "description", content: "Search across F1 drivers, teams, circuits, and races." },
    ],
  }),
  component: SearchPage,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(seasonQueryOptions());
    context.queryClient.prefetchQuery(seasonStatsQueryOptions());
  },

});

function SearchPage() {
  const data = useSeason();
  const allSeasons = useAvailableSeasons();
  const { setSeason } = useSeasonSelection();
  const stats = useQuery(seasonStatsQueryOptions()).data;
  const { drivers, teams, circuits, races } = data;
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
    const y = allSeasons.filter((s) => s.includes(query)).slice(0, 24);
    const rec = stats
      ? computeRecords(stats)
          .flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })))
          .filter((i) => `${i.label} ${i.holderId} ${i.detail ?? ""}`.toLowerCase().includes(query))
          .slice(0, 12)
      : [];
    const p = PAGES.filter((x) => `${x.label} ${x.hint}`.toLowerCase().includes(query));
    return { d, t, c, r, y, rec, p };
  }, [query, drivers, teams, circuits, races, allSeasons, stats]);

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
          placeholder="Drivers, teams, circuits, races, records, seasons…"
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
              const t = teamOf(data, d.team);
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
          <Section title="Records" empty={results.rec.length === 0}>
            {results.rec.map((item) => (
              <Link key={item.id} to="/records" className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 hover:border-accent/50">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg truncate">{item.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{item.group}{item.detail ? ` · ${item.detail}` : ""}</div>
                </div>
                <span className="font-timing tabular-nums text-accent-glow">{item.value}</span>
              </Link>
            ))}
          </Section>
          <Section title="Seasons" empty={results.y.length === 0}>
            <li className="flex flex-wrap gap-1">
              {results.y.map((y) => (
                <Link
                  key={y}
                  to="/standings"
                  onClick={() => setSeason(y)}
                  className="rounded-full border border-border px-3 py-1.5 font-timing tabular-nums text-xs text-muted-foreground hover:text-foreground hover:border-accent/50"
                >
                  {y}
                </Link>
              ))}
            </li>
          </Section>
          <Section title="Explore" empty={results.p.length === 0}>
            {results.p.map((p) => (
              <Link key={p.to} to={p.to} className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 hover:border-accent/50">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg truncate">{p.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.hint}</div>
                </div>
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

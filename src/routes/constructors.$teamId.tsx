import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { seasonQueryOptions, useSeason } from "@/lib/f1-data";
import { DriverRow } from "@/components/DriverRow";
import { ChevronLeft } from "lucide-react";
import { DetailSkeleton } from "@/components/Skeletons";

export const Route = createFileRoute("/constructors/$teamId")({
  head: ({ params }) => {
    const name = params.teamId
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return { meta: [
      { title: `${name} · Apexo` },
      { name: "description", content: `${name} — current Formula 1 lineup, championships, and season points.` },
    ] };
  },
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(seasonQueryOptions());
    if (!data.teams[params.teamId]) throw notFound();
  },
  component: TeamProfile,
  pendingComponent: DetailSkeleton,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Team not found</h1>
      <Link to="/constructors" className="mt-4 inline-block text-accent uppercase tracking-widest text-xs">All teams</Link>
    </div>
  ),
});

function TeamProfile() {
  const { teamId } = Route.useParams();
  const { teams, drivers, constructorStandings, season } = useSeason();
  const t = teams[teamId];
  const roster = drivers.filter((d) => d.team === t.id);
  const standing = constructorStandings.find((c) => c.team.id === t.id);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/constructors" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-3 w-3" /> All teams
      </Link>

      <header className="relative overflow-hidden rounded-2xl carbon-texture border border-border p-6 sm:p-10">
        <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: t.color }} />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-15 blur-3xl" style={{ background: t.color }} />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Constructor</div>
          <h1 className="mt-1 font-display text-4xl sm:text-6xl" style={{ color: t.color }}>{t.name}</h1>
          <p className="mt-2 text-muted-foreground">{t.fullName}</p>
          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label={`P ${standing?.position ?? "-"}`} value={standing?.points ?? 0} unit={`pts (${season})`} highlight />
            <Stat label="Titles" value={t.championships} />
            <Stat label="Founded" value={t.founded} />
            <Stat label="Principal" value={t.principal} textual />
          </dl>
          <div className="mt-3 text-xs text-muted-foreground">Base: {t.base}</div>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">{season} driver lineup</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {roster.map((d) => (
            <DriverRow key={d.id} driver={d} right={<div className="font-timing text-2xl tabular-nums">{d.seasonPoints}</div>} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, unit, highlight, textual }: { label: string; value: string | number; unit?: string; highlight?: boolean; textual?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={"mt-1 leading-none " + (textual ? "text-base font-medium" : "font-timing tabular-nums text-3xl ") + (highlight ? " text-gradient-accent" : "")}>
        {value}
      </div>
      {unit && <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{unit}</div>}
    </div>
  );
}

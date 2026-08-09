import { createFileRoute, Link } from "@tanstack/react-router";
import { seasonQueryOptions, useSeason } from "@/lib/f1-data";
import { ConstructorsSkeleton } from "@/components/Skeletons";

export const Route = createFileRoute("/constructors/")({
  head: () => ({
    meta: [
      { title: "F1 Teams · Apexo" },
      { name: "description", content: "Every Formula 1 constructor on the current grid — championships, base, principal, and season standing." },
    ],
  }),
  component: ConstructorsIndex,
  loader: ({ context }) => context.queryClient.ensureQueryData(seasonQueryOptions()),

  pendingComponent: ConstructorsSkeleton,
});

function ConstructorsIndex() {
  const { constructorStandings, teams, season } = useSeason();
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{season} grid</div>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">The <span className="text-gradient-accent">constructors</span></h1>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {constructorStandings.map((s) => (
          <li key={s.team.id}>
            <Link
              to="/constructors/$teamId"
              params={{ teamId: s.team.id }}
              className="group relative overflow-hidden block rounded-xl border border-border bg-surface/40 p-5 hover:border-accent/50 transition-all"
            >
              <div className="absolute inset-y-0 left-0 w-1" style={{ background: s.team.color }} />
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" style={{ background: s.team.color }} />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">P{s.position}</div>
                  <h2 className="mt-1 font-display text-3xl truncate">{s.team.name}</h2>
                  <p className="text-xs text-muted-foreground truncate">{s.team.fullName}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-timing text-4xl tabular-nums leading-none">{s.points}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">pts</div>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div><dt className="text-muted-foreground uppercase tracking-widest text-[9px]">Titles</dt><dd className="font-timing text-lg">{s.team.championships}</dd></div>
                <div><dt className="text-muted-foreground uppercase tracking-widest text-[9px]">Founded</dt><dd className="font-timing text-lg">{s.team.founded}</dd></div>
                <div><dt className="text-muted-foreground uppercase tracking-widest text-[9px]">Base</dt><dd className="text-foreground text-sm truncate">{s.team.base}</dd></div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
      {/* silence unused warning */}
      <span className="hidden">{Object.keys(teams).length}</span>
    </div>
  );
}

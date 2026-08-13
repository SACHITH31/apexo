import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Award, Medal, Trophy } from "lucide-react";
import { seasonQueryOptions, teamOf, useSeason } from "@/lib/f1-data";
import { seasonStatsQueryOptions, useSeasonStats } from "@/lib/f1-extra-data";
import { computeRecords, type RecordItem } from "@/lib/records";
import { useSeasonSelection } from "@/lib/season";
import { PageSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Records & Achievements · Apexo" },
      {
        name: "description",
        content:
          "Formula 1 season records: most wins, poles, podiums, fastest laps, winning streaks, perfect weekends and constructor milestones.",
      },
      { property: "og:title", content: "Records & Achievements · Apexo" },
      {
        property: "og:description",
        content: "Driver, constructor, circuit and season records computed from official Formula 1 results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(seasonQueryOptions());
    context.queryClient.prefetchQuery(seasonStatsQueryOptions());
  },
  component: RecordsPage,
  pendingComponent: PageSkeleton,
});

function RecordsPage() {
  const season = useSeason();
  const stats = useSeasonStats();
  const { season: year } = useSeasonSelection();
  const groups = useMemo(() => computeRecords(stats), [stats]);
  const [filter, setFilter] = useState<string>("all");

  const visible = filter === "all" ? groups : groups.filter((g) => g.title === filter);

  const holderName = (item: RecordItem) => {
    if (item.scope === "team") return teamOf(season, item.holderId).name;
    const d = season.driversById[item.holderId];
    return d ? `${d.firstName} ${d.lastName}` : item.holderId || "—";
  };
  const holderColor = (item: RecordItem) => {
    if (item.scope === "team") return teamOf(season, item.holderId).color;
    const d = season.driversById[item.holderId];
    return d ? teamOf(season, d.team).color : "var(--accent)";
  };

  return (
    <div className="mx-auto max-w-6xl min-w-0 px-4 sm:px-6 py-6 sm:py-10">
      <header className="relative overflow-hidden rounded-2xl carbon-texture team-aura border border-border p-6 sm:p-8 animate-slide-up">
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="pointer-events-none absolute inset-0 checker-flag opacity-[0.04]" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Records & Achievements</p>
          <h1 className="font-display text-4xl sm:text-6xl mt-1">{year} Record Book</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every record below is recomputed from classified results, grid slots and fastest laps for the selected
            season.
          </p>
        </div>
      </header>

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Trophy className="h-6 w-6" />}
            title="No records yet"
            description={`${year} has no scored rounds to build a record book from.`}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-1">
            {["all", ...groups.map((g) => g.title)].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={
                  "rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-widest transition-colors " +
                  (filter === t
                    ? "border-accent/60 bg-accent/15 text-accent-glow"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {t === "all" ? "All" : t.replace(" records", "")}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-8">
            {visible.map((group) => (
              <section key={group.title}>
                <h2 className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  <Medal className="h-3.5 w-3.5" /> {group.title}
                </h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {group.items.map((item) => {
                    const body = (
                      <>
                        <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: holderColor(item) }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                            {item.label}
                          </div>
                          <div className="truncate font-display text-lg">{holderName(item)}</div>
                          {item.detail && (
                            <div className="truncate text-xs text-muted-foreground">{item.detail}</div>
                          )}
                        </div>
                        <span className="font-timing tabular-nums text-xl text-accent-glow">{item.value}</span>
                      </>
                    );
                    const className =
                      "flex items-center gap-3 rounded-xl border border-border bg-surface/40 p-3 hover:border-accent/50 transition-colors hover-lift";
                    if (item.scope === "team" && item.holderId) {
                      return (
                        <li key={item.id}>
                          <Link to="/constructors/$teamId" params={{ teamId: item.holderId }} className={className}>
                            {body}
                          </Link>
                        </li>
                      );
                    }
                    if (item.holderId && season.driversById[item.holderId]) {
                      return (
                        <li key={item.id}>
                          <Link to="/drivers/$driverId" params={{ driverId: item.holderId }} className={className}>
                            {body}
                          </Link>
                        </li>
                      );
                    }
                    return (
                      <li key={item.id} className={className}>
                        {body}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="h-3.5 w-3.5" /> Switch season in the header to browse another year's record book.
          </p>
        </>
      )}
    </div>
  );
}

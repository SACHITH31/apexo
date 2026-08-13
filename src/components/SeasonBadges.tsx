import { Link } from "@tanstack/react-router";
import { Award } from "lucide-react";
import type { SeasonStats } from "@/lib/f1-extra-data";
import { driverBadges } from "@/lib/records";

const tones: Record<string, string> = {
  gold: "border-amber-400/50 bg-amber-400/10 text-amber-300",
  silver: "border-slate-300/40 bg-slate-300/10 text-slate-200",
  accent: "border-accent/50 bg-accent/10 text-accent-glow",
};

/** Milestone badges derived from the selected season's classified results. */
export function SeasonBadges({ stats, driverId }: { stats: SeasonStats; driverId: string }) {
  const badges = driverBadges(stats, driverId);
  if (badges.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <Award className="h-3.5 w-3.5" /> Achievements
      </h2>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <span
            key={b.id}
            className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-widest ${tones[b.tone]}`}
          >
            {b.label}
          </span>
        ))}
        <Link
          to="/records"
          className="rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
        >
          Record book
        </Link>
      </div>
    </section>
  );
}

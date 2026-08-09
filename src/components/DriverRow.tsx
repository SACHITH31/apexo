import { Link } from "@tanstack/react-router";
import { type Driver } from "@/lib/mock-data";
import { teamOf, useSeason } from "@/lib/f1-data";

export function DriverBadge({ driver, size = "md" }: { driver: Driver; size?: "sm" | "md" | "lg" }) {
  const team = teamOf(useSeason(), driver.team);
  const px = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  return (
    <div
      className={"relative rounded-full flex items-center justify-center font-display tracking-wider border-2 " + px}
      style={{ background: `linear-gradient(135deg, ${team.color}22, ${team.color}55)`, borderColor: team.color }}
    >
      {driver.code}
    </div>
  );
}

export function DriverRow({ driver, position, right }: { driver: Driver; position?: number; right?: React.ReactNode }) {
  const team = teamOf(useSeason(), driver.team);
  return (
    <Link
      to="/drivers/$driverId"
      params={{ driverId: driver.id }}
      className="group flex items-center gap-3 rounded-lg p-3 border border-border bg-surface/40 hover:bg-surface hover:border-accent/50 transition-all"
    >
      {position !== undefined && (
        <div className="font-timing text-2xl w-8 text-center text-muted-foreground group-hover:text-foreground">
          {String(position).padStart(2, "0")}
        </div>
      )}
      <div className="w-1 h-10 rounded-full" style={{ background: team.color }} />
      <DriverBadge driver={driver} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg leading-tight truncate">
          <span className="text-muted-foreground">{driver.firstName}</span>{" "}
          <span className="text-foreground">{driver.lastName}</span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          <span aria-hidden>{driver.flag}</span> {driver.nationality} · {team.name}
        </div>
      </div>
      {right}
    </Link>
  );
}

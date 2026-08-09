import { useEffect, useMemo, useState } from "react";
import { Activity, Droplets, Eye, Gauge, Thermometer, Wind } from "lucide-react";
import { EVENT_STYLE, type RaceEvent, type RaceEventKind } from "@/lib/race-events";
import { useRaceWeather, weatherSessionsOf } from "@/lib/weather-data";
import type { Race } from "@/lib/mock-data";

const SESSION_MINUTES: Record<string, number> = {
  fp1: 60,
  fp2: 60,
  fp3: 60,
  sq: 45,
  sprint: 60,
  quali: 60,
  race: 150,
};

const STATUS_KINDS: RaceEventKind[] = ["red", "sc", "vsc", "double-yellow", "yellow", "green", "start", "chequered"];

function activeSessionOf(race: Race, now: number) {
  for (const s of weatherSessionsOf(race)) {
    const start = new Date(s.iso).getTime();
    const end = start + (SESSION_MINUTES[s.key] ?? 60) * 60_000;
    if (now >= start && now <= end) return s;
  }
  return undefined;
}

function gripOf(trackTempC?: number, rainChance?: number) {
  if ((rainChance ?? 0) >= 60) return { label: "Low", pct: 30 };
  if ((rainChance ?? 0) >= 25) return { label: "Variable", pct: 55 };
  if (trackTempC === undefined) return { label: "Unknown", pct: 50 };
  if (trackTempC >= 40) return { label: "High", pct: 88 };
  if (trackTempC >= 25) return { label: "Good", pct: 74 };
  return { label: "Green track", pct: 58 };
}

/**
 * Live Track Status — only mounts while a session is actually running.
 * Flag state comes from the race-control feed; conditions from the weather layer.
 */
export function LiveTrackStatus({
  race,
  circuitId,
  events,
}: {
  race: Race;
  circuitId: string;
  events: RaceEvent[];
}) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const session = now ? activeSessionOf(race, now) : undefined;
  const weather = useRaceWeather(circuitId, weatherSessionsOf(race));

  const status = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (STATUS_KINDS.includes(e.kind)) return e;
    }
    return undefined;
  }, [events]);

  if (!session) return null;

  const kind: RaceEventKind = status?.kind ?? "green";
  const style = EVENT_STYLE[kind];
  const w = weather.data?.sessions.find((s) => s.key === session.key) ?? weather.data?.current;
  const grip = gripOf(w?.trackTempC, w?.rainChance);

  return (
    <section
      aria-label="Live track status"
      aria-live="polite"
      className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6 animate-slide-up"
      style={{ borderLeft: `2px solid ${style.color}` }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <Activity className="h-3 w-3" /> Live track status
        <span className="ml-auto normal-case tracking-normal text-[11px] text-foreground">{session.label}</span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-full animate-pulse-dot"
          style={{ background: style.color, boxShadow: `0 0 16px ${style.color}` }}
        />
        <span className="font-display text-3xl leading-none" style={{ color: style.color }}>
          {style.label}
        </span>
      </div>
      {status?.message && <p className="mt-1 text-sm text-muted-foreground">{status.message}</p>}

      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Cell icon={<Thermometer className="h-3 w-3" />} label="Track" value={w ? `${w.trackTempC}°C` : "—"} />
        <Cell icon={<Wind className="h-3 w-3" />} label="Wind" value={w ? `${w.windKph} km/h` : "—"} />
        <Cell icon={<Droplets className="h-3 w-3" />} label="Rain" value={w ? `${w.rainChance}%` : "—"} />
        <Cell
          icon={<Eye className="h-3 w-3" />}
          label="Visibility"
          value={w ? ((w.rainChance ?? 0) >= 60 ? "Poor" : w.cloudCover > 80 ? "Fair" : "Clear") : "—"}
        />
      </dl>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-3 w-3" /> Grip level
          </span>
          <span>{grip.label}</span>
        </div>
        <div
          className="mt-1.5 h-2 rounded-full bg-surface/70 border border-border overflow-hidden"
          role="meter"
          aria-valuenow={grip.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Grip level ${grip.label}`}
        >
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${grip.pct}%`, background: `linear-gradient(90deg, ${style.color}, var(--accent))` }}
          />
        </div>
      </div>
    </section>
  );
}

function Cell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-3">
      <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-timing tabular-nums text-lg leading-tight">{value}</dd>
    </div>
  );
}

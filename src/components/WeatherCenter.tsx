import { CloudRain, Droplets, Gauge, Sunrise, Sunset, Thermometer, Wind } from "lucide-react";
import { WEATHER_CODE, useRaceWeather, weatherSessionsOf } from "@/lib/weather-data";
import type { Race } from "@/lib/mock-data";
import { Skeleton } from "./Skeletons";
import { FormattedDate } from "./ClientOnly";

function WeatherSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
      <Skeleton className="h-3 w-40" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-3.5 transition-colors hover:border-accent/40">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-timing tabular-nums text-xl leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

/**
 * Race Weather Center — live conditions when available, scheduled session
 * forecast otherwise. Hides itself rather than showing an error.
 */
export function WeatherCenter({ race, circuitId }: { race: Race; circuitId: string }) {
  const sessions = weatherSessionsOf(race);
  const q = useRaceWeather(circuitId, sessions);

  if (q.isLoading) return <WeatherSkeleton />;
  const w = q.data;
  if (!w?.available) return null;

  const raceForecast = w.sessions.find((s) => s.key === "race");
  const head = raceForecast ?? w.current;
  if (!head) return null;

  return (
    <section
      className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6 hover-lift animate-slide-up"
      aria-label="Race weather center"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <CloudRain className="h-3 w-3" /> Weather center
        <span className="rounded-full border border-border px-2 py-0.5 tracking-widest">
          {raceForecast ? "Race forecast" : "Live now"}
        </span>
        <span className="ml-auto normal-case tracking-normal text-[11px]">
          {WEATHER_CODE[head.code] ?? "—"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Metric icon={<Thermometer className="h-3 w-3" />} label="Air" value={`${head.airTempC}°C`} />
        <Metric
          icon={<Gauge className="h-3 w-3" />}
          label="Track"
          value={`${head.trackTempC}°C`}
          sub="Estimated"
        />
        <Metric icon={<Droplets className="h-3 w-3" />} label="Humidity" value={`${head.humidity}%`} />
        <Metric icon={<Wind className="h-3 w-3" />} label="Wind" value={`${head.windKph} km/h`} />
        <Metric icon={<CloudRain className="h-3 w-3" />} label="Rain" value={`${head.rainChance}%`} />
        <Metric icon={<Gauge className="h-3 w-3" />} label="Cloud" value={`${head.cloudCover}%`} />
      </div>

      {w.sessions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {w.sessions.map((s) => (
            <li
              key={s.key}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-surface/30 p-3 transition-colors hover:border-accent/40"
            >
              <span className="font-display text-base leading-none">{s.label}</span>
              <span className="text-[11px] text-muted-foreground">
                <FormattedDate iso={s.iso ?? s.time} mode="weekday-datetime" />
              </span>
              <span className="ml-auto flex items-center gap-3 font-timing tabular-nums text-xs text-muted-foreground">
                <span className="text-foreground">{s.airTempC}°</span>
                <span>{s.trackTempC}° track</span>
                <span
                  className={s.rainChance >= 40 ? "text-tyre-wet" : undefined}
                  title="Rain probability"
                >
                  {s.rainChance}% rain
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {(w.sunrise || w.sunset) && (
        <div className="mt-4 flex flex-wrap gap-4 text-[11px] uppercase tracking-widest text-muted-foreground">
          {w.sunrise && (
            <span className="inline-flex items-center gap-1.5">
              <Sunrise className="h-3 w-3" /> {w.sunrise.slice(11, 16)} UTC
            </span>
          )}
          {w.sunset && (
            <span className="inline-flex items-center gap-1.5">
              <Sunset className="h-3 w-3" /> {w.sunset.slice(11, 16)} UTC
            </span>
          )}
        </div>
      )}
    </section>
  );
}

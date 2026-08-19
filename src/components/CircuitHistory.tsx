import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCircuitHistory } from "@/lib/circuit-history.functions";
import { geoFor } from "@/lib/circuit-geo";

/**
 * Historical winners, lap-record progression (track evolution) and archived
 * race-day weather for a circuit. Loaded client-side so the circuit page keeps
 * its instant render.
 */
export function CircuitHistory({ circuitId }: { circuitId: string }) {
  const fetchHistory = useServerFn(getCircuitHistory);
  const geo = geoFor(circuitId);

  const { data, isLoading } = useQuery({
    queryKey: ["circuit-history", circuitId],
    staleTime: 6 * 60 * 60 * 1000,
    queryFn: () => fetchHistory({ data: { circuitId, lat: geo?.lat, lon: geo?.lon } }),
  });

  if (isLoading) {
    return (
      <section className="mt-8 glass rounded-2xl p-6">
        <div className="h-4 w-40 rounded bg-surface/70 broadcast-shimmer" />
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-surface/60 broadcast-shimmer" />
          ))}
        </div>
      </section>
    );
  }

  if (!data?.available) return null;

  const prog = data.lapProgression;
  const best = prog.length ? Math.min(...prog.map((p) => p.seconds)) : 0;
  const worst = prog.length ? Math.max(...prog.map((p) => p.seconds)) : 1;

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="glass rounded-2xl p-6 hover-lift">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Historical winners</div>
        <ul className="mt-4 divide-y divide-border/60">
          {data.winners.slice(0, 12).map((w) => (
            <li key={`${w.season}-${w.round}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
              <span className="font-timing tabular-nums text-muted-foreground w-12">{w.season}</span>
              <span className="font-medium">{w.driver}</span>
              <span className="text-xs text-muted-foreground">{w.constructor}</span>
              <span className="ml-auto text-xs uppercase tracking-widest text-muted-foreground">
                {w.grid ? `P${w.grid} start` : "Pit lane"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          {data.winners.length} grands prix on record
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {prog.length > 1 && (
          <div className="glass rounded-2xl p-6 hover-lift">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Track evolution · fastest race lap
            </div>
            <div className="mt-4 space-y-1.5">
              {prog.slice(-10).map((p) => {
                const pct = worst === best ? 100 : 20 + ((worst - p.seconds) / (worst - best)) * 80;
                return (
                  <div key={p.season} className="flex items-center gap-3">
                    <span className="w-10 font-timing tabular-nums text-xs text-muted-foreground">{p.season}</span>
                    <div className="h-2 flex-1 rounded-full bg-surface/70">
                      <div className="h-full rounded-full accent-line" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-20 text-right font-timing tabular-nums text-xs">{p.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.weather.length > 0 && (
          <div className="glass rounded-2xl p-6 hover-lift">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Race-day weather history</div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.weather.map((w) => (
                <div key={w.season} className="rounded-xl border border-border bg-surface/40 p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{w.season}</div>
                  <div className="mt-1 font-timing tabular-nums text-xl">{w.maxTempC}°C</div>
                  <div className="text-[11px] text-muted-foreground">
                    {w.rainMm > 0 ? `${w.rainMm} mm rain` : "Dry"} · {w.windKph} kph wind
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

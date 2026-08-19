import { useId, useMemo, useState } from "react";
import { buildTrackModel, metresAt, type Corner } from "@/lib/circuit-corners";
import type { CircuitProfile } from "@/lib/circuit-profiles";

/**
 * Corner-by-corner circuit explorer: animated racing line, selectable corners,
 * sector filter, DRS zones, elevation profile and a pit-lane animation. All
 * geometry is derived deterministically from the circuit signature.
 */
export function CircuitExplorer({
  circuitId,
  profile,
  lengthKm,
  drsZones,
}: {
  circuitId: string;
  profile: CircuitProfile;
  lengthKm: number;
  drsZones: number;
}) {
  const model = useMemo(
    () => buildTrackModel(circuitId, profile, { lengthKm, drsZones }),
    [circuitId, profile, lengthKm, drsZones],
  );
  const uid = useId().replace(/[:]/g, "");
  const [selected, setSelected] = useState<number>(model.corners[0]?.number ?? 1);
  const [sector, setSector] = useState<0 | 1 | 2 | 3>(0);
  const [showPit, setShowPit] = useState(false);

  const corner = model.corners.find((c) => c.number === selected) ?? model.corners[0];
  const visible = model.corners.filter((c) => sector === 0 || c.sector === sector);

  const speedSegments = useMemo(() => {
    const pts = model.points;
    const step = Math.max(1, Math.floor(pts.length / 90));
    const segs: { d: string; speed: number }[] = [];
    for (let i = 0; i < pts.length; i += step) {
      const slice = [];
      for (let k = 0; k <= step; k++) slice.push(pts[(i + k) % pts.length]);
      const speed = slice.reduce((s, p) => s + p.speed, 0) / slice.length;
      segs.push({
        d: `M ${slice.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")}`,
        speed,
      });
    }
    return segs;
  }, [model]);

  const elevationPath = useMemo(() => {
    const pts = model.points;
    const w = 600;
    const h = 90;
    const max = Math.max(...pts.map((p) => p.elevation), 1);
    const line = pts
      .filter((_, i) => i % 2 === 0)
      .map((p) => `${(p.t * w).toFixed(1)} ${(h - (p.elevation / max) * (h - 8)).toFixed(1)}`)
      .join(" L ");
    return { line: `M ${line}`, area: `M 0 ${h} L ${line} L ${w} ${h} Z`, w, h, max };
  }, [model]);

  return (
    <section className="mt-8 glass rounded-2xl overflow-hidden border border-border">
      <div className="h-px accent-line opacity-60" />
      <div className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Corner explorer</div>
            <h2 className="mt-1 font-display text-2xl">Every corner, sector and DRS zone</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([0, 1, 2, 3] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSector(s)}
                aria-pressed={sector === s}
                className={
                  "rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest transition-colors " +
                  (sector === s
                    ? "border-accent/60 bg-surface text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {s === 0 ? "Full lap" : `S${s}`}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowPit((v) => !v)}
              aria-pressed={showPit}
              className={
                "rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest transition-colors " +
                (showPit
                  ? "border-accent/60 bg-surface text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              Pit lane
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* ------------------------------- map ------------------------------- */}
          <div className="relative rounded-2xl carbon-texture border border-border p-2">
            <svg viewBox="0 0 200 120" className="w-full" role="img" aria-label={`${circuitId} track map with selectable corners`}>
              <defs>
                <path id={`line-${uid}`} d={model.path} />
                <path id={`pit-${uid}`} d={model.pitPath} />
              </defs>

              {/* track bed */}
              <path d={model.path} className="text-muted-foreground/25" stroke="currentColor" strokeWidth={7} fill="none" strokeLinejoin="round" />

              {/* speed-coloured racing line */}
              {speedSegments.map((s, i) => (
                <path
                  key={i}
                  d={s.d}
                  className="text-accent"
                  stroke="currentColor"
                  strokeWidth={2.6}
                  fill="none"
                  strokeLinecap="round"
                  opacity={0.25 + s.speed * 0.75}
                />
              ))}

              {/* DRS zones */}
              {model.drs.map((z) => {
                const zonePts = model.points.filter((p) =>
                  z.from < z.to ? p.t >= z.from && p.t <= z.to : p.t >= z.from || p.t <= z.to,
                );
                if (zonePts.length < 2) return null;
                return (
                  <path
                    key={z.number}
                    d={`M ${zonePts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")}`}
                    className="text-accent"
                    stroke="currentColor"
                    strokeWidth={6}
                    fill="none"
                    opacity={0.18}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* pit lane */}
              {showPit && (
                <>
                  <path d={model.pitPath} className="text-foreground/60" stroke="currentColor" strokeWidth={2} strokeDasharray="3 3" fill="none" />
                  <circle r={2.6} className="fill-accent">
                    <animateMotion dur="6s" repeatCount="indefinite">
                      <mpath href={`#pit-${uid}`} />
                    </animateMotion>
                  </circle>
                </>
              )}

              {/* animated car on the racing line */}
              <circle r={3} className="fill-foreground">
                <animateMotion dur="9s" repeatCount="indefinite" rotate="auto">
                  <mpath href={`#line-${uid}`} />
                </animateMotion>
              </circle>

              {/* corner markers */}
              {visible.map((c) => (
                <g key={c.number} onClick={() => setSelected(c.number)} className="cursor-pointer">
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={c.number === selected ? 5 : 3.4}
                    className={c.number === selected ? "fill-accent" : "fill-surface"}
                    stroke="currentColor"
                    strokeWidth={0.8}
                  />
                  <text
                    x={c.x}
                    y={c.y + 1.6}
                    textAnchor="middle"
                    className="pointer-events-none fill-foreground font-timing"
                    style={{ fontSize: 4 }}
                  >
                    {c.number}
                  </text>
                </g>
              ))}
            </svg>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>{model.corners.length} corners</span>
              <span>{model.drs.length} DRS zones</span>
              <span>Pit entry {metresAt(model.pitEntryT, model.lengthM)} m</span>
              <span>Elevation {Math.round(model.elevationRange)} m</span>
            </div>
          </div>

          {/* ---------------------------- corner panel --------------------------- */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              {visible.map((c) => (
                <button
                  key={c.number}
                  type="button"
                  onClick={() => setSelected(c.number)}
                  aria-pressed={c.number === selected}
                  className={
                    "h-8 min-w-8 rounded-md border px-2 font-timing text-xs tabular-nums transition-colors " +
                    (c.number === selected
                      ? "border-accent/70 bg-surface text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-accent/40")
                  }
                >
                  {c.number}
                </button>
              ))}
            </div>

            {corner && <CornerDetail corner={corner} lengthM={model.lengthM} />}
          </div>
        </div>

        {/* --------------------------- elevation profile -------------------------- */}
        <div className="mt-6 rounded-2xl border border-border bg-surface/40 p-4">
          <div className="flex items-baseline justify-between">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Elevation profile</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {Math.round(elevationPath.max)} m range
            </div>
          </div>
          <svg viewBox={`0 0 ${elevationPath.w} ${elevationPath.h}`} className="mt-2 w-full" role="img" aria-label="Elevation across the lap">
            <path d={elevationPath.area} className="fill-accent" opacity={0.15} />
            <path d={elevationPath.line} className="text-accent" stroke="currentColor" strokeWidth={2} fill="none" />
            {model.corners.map((c) => (
              <g key={c.number} onClick={() => setSelected(c.number)} className="cursor-pointer">
                <line
                  x1={c.t * elevationPath.w}
                  x2={c.t * elevationPath.w}
                  y1={0}
                  y2={elevationPath.h}
                  stroke="currentColor"
                  className={c.number === selected ? "text-accent" : "text-muted-foreground/30"}
                  strokeWidth={c.number === selected ? 2 : 1}
                />
              </g>
            ))}
          </svg>
          <div className="mt-1 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Start / finish</span>
            <span>{lengthKm} km</span>
          </div>
        </div>

        {/* ------------------------------- sectors ------------------------------- */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {model.sectors.map((s) => (
            <button
              key={s.number}
              type="button"
              onClick={() => setSector(sector === s.number ? 0 : s.number)}
              className={
                "rounded-xl border p-4 text-left transition-colors " +
                (sector === s.number ? "border-accent/60 bg-surface" : "border-border bg-surface/40 hover:border-accent/40")
              }
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sector {s.number}</div>
              <div className="mt-1 font-display text-xl">{s.character}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {s.corners} corners · {s.fullThrottlePct}% full throttle
              </div>
            </button>
          ))}
        </div>

        {/* --------------------------------- DRS --------------------------------- */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {model.drs.map((z) => (
            <div key={z.number} className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">DRS zone {z.number}</div>
              <div className="mt-1 font-timing text-2xl tabular-nums">{z.lengthM} m</div>
              <div className="text-xs text-muted-foreground">
                Detection {metresAt(z.detectionT, model.lengthM)} m · activation {metresAt(z.from, model.lengthM)} m
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CornerDetail({ corner, lengthM }: { corner: Corner; lengthM: number }) {
  return (
    <div key={corner.number} className="rounded-2xl border border-border bg-surface/40 p-5 animate-slide-up">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Sector {corner.sector} · {metresAt(corner.t, lengthM)} m
          </div>
          <div className="font-display text-3xl">{corner.name}</div>
        </div>
        <div className="rounded-full border border-accent/50 px-3 py-1 text-[10px] uppercase tracking-widest text-accent">
          {corner.type}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Mini label="Apex speed" value={`${corner.apexSpeedKph} kph`} />
        <Mini label="Entry speed" value={`${corner.entrySpeedKph} kph`} />
        <Mini label="Braking" value={corner.brakingM ? `${corner.brakingM} m` : "None"} />
        <Mini label="Gear" value={`${corner.gear}`} />
        <Mini label="Lateral load" value={`${corner.lateralG} g`} />
        <Mini label="Direction" value={corner.direction} />
      </div>

      <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">{corner.note}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-timing tabular-nums text-lg">{value}</div>
    </div>
  );
}

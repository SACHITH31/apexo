import { useEffect, useMemo, useRef, useState } from "react";
import { buildCircuitPath } from "./CircuitSignature";
import { EVENT_STYLE } from "@/lib/race-events";
import type { RaceEventKind } from "@/lib/race-events";

export interface TrackCar {
  driverId: string;
  code: string;
  color: string;
  /** 0..1 position around the lap. */
  frac: number;
  position: number;
  retired: boolean;
  pitting: boolean;
}

interface Props {
  circuitId: string;
  /** 0..1 progress around the current lap for the leader. */
  lapProgress: number;
  lap: number;
  totalLaps: number;
  trackStatus: RaceEventKind;
  drsZones: number;
  cars: TrackCar[];
  selectedId?: string | null;
  onSelect?: (driverId: string | null) => void;
  /** Floating info card rendered over the map for the selected driver. */
  info?: React.ReactNode;
  wet?: boolean;
  dryLine?: boolean;
}

/**
 * Animated track map — the circuit signature split into three sectors with DRS
 * zones, pit entry/exit and every car on track moving continuously. Markers are
 * positioned imperatively so playback never triggers a React update storm.
 */
export function ReplayTrackMap({
  circuitId,
  lapProgress,
  lap,
  totalLaps,
  trackStatus,
  drsZones,
  cars,
  selectedId,
  onSelect,
  info,
  wet,
  dryLine,
}: Props) {
  const d = useMemo(() => buildCircuitPath(circuitId), [circuitId]);
  const pathRef = useRef<SVGPathElement | null>(null);
  const layerRef = useRef<SVGGElement | null>(null);
  const [len, setLen] = useState(0);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const total = el.getTotalLength();
    setLen((prev) => (Math.abs(prev - total) < 0.5 ? prev : total));
  }, [d]);

  // Move every marker imperatively each frame.
  useEffect(() => {
    const el = pathRef.current;
    const layer = layerRef.current;
    if (!el || !layer || !len) return;
    for (const car of cars) {
      const g = layer.querySelector<SVGGElement>(`[data-car="${car.driverId}"]`);
      if (!g) continue;
      const f = (((car.frac % 1) + 1) % 1) * len;
      const p = el.getPointAtLength(f);
      g.setAttribute("transform", `translate(${p.x} ${p.y})`);
    }
  }, [cars, len]);

  const statusColor = EVENT_STYLE[trackStatus]?.color ?? "var(--track-green)";
  const sector = lapProgress < 1 / 3 ? 1 : lapProgress < 2 / 3 ? 2 : 3;
  const zones = Math.max(1, drsZones);
  const drsPoints = Array.from({ length: zones }, (_, i) => (i + 0.5) / zones);
  const flashing = trackStatus === "yellow" || trackStatus === "double-yellow" || trackStatus === "sc" || trackStatus === "vsc";

  return (
    <div className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Track map
        <span className="rounded-full border border-border px-2 py-0.5">Sector {sector}</span>
        {wet && <span className="rounded-full border border-border px-2 py-0.5 text-[var(--tyre-wet)]">Wet</span>}
        {dryLine && <span className="rounded-full border border-border px-2 py-0.5 text-accent">Dry line</span>}
        <span className="ml-auto font-timing tabular-nums text-foreground">
          Lap {lap}/{totalLaps}
        </span>
      </div>

      <svg viewBox="0 0 200 120" className="mt-3 w-full touch-manipulation" role="img" aria-label="Animated circuit map with every car">
        {len > 0 && (
          <>
            <path
              d={d}
              stroke={wet ? "var(--tyre-wet)" : "var(--track-green)"}
              strokeWidth={7}
              fill="none"
              opacity={wet ? 0.16 : 0.08}
              strokeLinecap="round"
            />
            {dryLine && (
              <path d={d} stroke="var(--foreground)" strokeWidth={2.4} fill="none" opacity={0.18} strokeLinecap="round" />
            )}
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={sector === i + 1 ? statusColor : "currentColor"}
                strokeWidth={sector === i + 1 ? 3 : 2}
                className={
                  (sector === i + 1 ? "text-accent" : "text-muted-foreground") +
                  (flashing && sector === i + 1 ? " pulse" : "")
                }
                opacity={sector === i + 1 ? 0.95 : 0.35}
                strokeDasharray={`${len / 3} ${len}`}
                strokeDashoffset={-(len / 3) * i}
                strokeLinecap="round"
              />
            ))}
          </>
        )}
        <path ref={pathRef} d={d} fill="none" stroke="transparent" strokeWidth={2} />

        {/* DRS zones */}
        {len > 0 &&
          drsPoints.map((f, i) => {
            const p = pathRef.current?.getPointAtLength(f * len);
            if (!p) return null;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={3.4} fill="var(--track-green)" opacity={wet ? 0.3 : 0.75} />
                <text x={p.x + 5} y={p.y + 2} fontSize="6" fill="currentColor" className="text-muted-foreground">DRS</text>
              </g>
            );
          })}

        {/* Pit entry / exit */}
        {len > 0 &&
          [
            { f: 0.92, label: "Pit in" },
            { f: 0.06, label: "Pit out" },
          ].map((m) => {
            const p = pathRef.current?.getPointAtLength(m.f * len);
            if (!p) return null;
            return (
              <g key={m.label}>
                <rect x={p.x - 2} y={p.y - 2} width={4} height={4} fill="var(--accent)" opacity={0.8} />
                <text x={p.x + 5} y={p.y + 2} fontSize="5.5" fill="currentColor" className="text-muted-foreground">
                  {m.label}
                </text>
              </g>
            );
          })}

        {/* Every car on track */}
        <g ref={layerRef}>
          {cars.map((car) => {
            const active = selectedId === car.driverId;
            return (
              <g
                key={car.driverId}
                data-car={car.driverId}
                className="cursor-pointer"
                onClick={() => onSelect?.(active ? null : car.driverId)}
                onMouseEnter={() => onSelect?.(car.driverId)}
              >
                <circle r={active ? 7.5 : 5} fill={car.color} opacity={active ? 0.3 : 0.16} />
                <circle
                  r={active ? 3.6 : 2.6}
                  fill={car.color}
                  stroke={active ? "var(--foreground)" : "none"}
                  strokeWidth={active ? 0.7 : 0}
                />
                {car.pitting && <circle r={5.6} fill="none" stroke="var(--accent)" strokeWidth={0.7} />}
                <text
                  x={0}
                  y={-5.2}
                  fontSize={active ? "5.4" : "4.4"}
                  textAnchor="middle"
                  fill={active ? "currentColor" : car.color}
                  className={active ? "text-foreground" : ""}
                  opacity={active ? 1 : 0.85}
                >
                  {car.code}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {info && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-[16rem] animate-scale-in">
          <div className="pointer-events-auto glass rounded-xl border border-accent/30 p-3">{info}</div>
        </div>
      )}

      <div className="mt-1 flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>S1</span>
        <span>S2</span>
        <span>S3</span>
        <span className="ml-auto" style={{ color: statusColor }}>
          {EVENT_STYLE[trackStatus]?.label ?? "Green flag"}
        </span>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { buildCircuitPath } from "./CircuitSignature";
import { EVENT_STYLE } from "@/lib/race-events";
import type { RaceEventKind } from "@/lib/race-events";

interface Props {
  circuitId: string;
  /** 0..1 progress around the current lap. */
  lapProgress: number;
  lap: number;
  totalLaps: number;
  trackStatus: RaceEventKind;
  drsZones: number;
  leaderColor?: string;
}

/**
 * Animated track map — the existing circuit signature, split into three
 * sectors with DRS zones, pit entry/exit and a glowing car marker that
 * follows replay progress around the lap.
 */
export function ReplayTrackMap({
  circuitId,
  lapProgress,
  lap,
  totalLaps,
  trackStatus,
  drsZones,
  leaderColor,
}: Props) {
  const d = useMemo(() => buildCircuitPath(circuitId), [circuitId]);
  const pathRef = useRef<SVGPathElement | null>(null);
  const markerRef = useRef<SVGGElement | null>(null);
  const [len, setLen] = useState(0);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const total = el.getTotalLength();
    setLen((prev) => (Math.abs(prev - total) < 0.5 ? prev : total));
  }, [d]);

  // Move the marker imperatively so playback never triggers a React update.
  useEffect(() => {
    const el = pathRef.current;
    const marker = markerRef.current;
    if (!el || !marker || !len) return;
    const f = (((lapProgress % 1) + 1) % 1) * len;
    const p = el.getPointAtLength(f);
    marker.setAttribute("transform", `translate(${p.x} ${p.y})`);
  }, [lapProgress, len]);

  const statusColor = EVENT_STYLE[trackStatus]?.color ?? "var(--track-green)";
  const sector = lapProgress < 1 / 3 ? 1 : lapProgress < 2 / 3 ? 2 : 3;
  const drsPoints = Array.from({ length: Math.max(1, drsZones) }, (_, i) => (i + 0.5) / Math.max(1, drsZones));

  return (
    <div className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Track map
        <span className="rounded-full border border-border px-2 py-0.5">Sector {sector}</span>
        <span className="ml-auto font-timing tabular-nums text-foreground">
          Lap {lap}/{totalLaps}
        </span>
      </div>

      <svg viewBox="0 0 200 120" className="mt-3 w-full" role="img" aria-label="Animated circuit map">
        {len > 0 && (
          <>
            <path d={d} stroke="var(--track-green)" strokeWidth={7} fill="none" opacity={0.08} strokeLinecap="round" />
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={sector === i + 1 ? statusColor : "currentColor"}
                strokeWidth={sector === i + 1 ? 3 : 2}
                className={sector === i + 1 ? "text-accent" : "text-muted-foreground"}
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
                <circle cx={p.x} cy={p.y} r={3.4} fill="var(--track-green)" opacity={0.75} />
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

        {/* Car marker */}
        <g ref={markerRef}>
          <circle r={7} fill={leaderColor ?? "var(--accent)"} opacity={0.22} />
          <circle r={3.2} fill={leaderColor ?? "var(--accent)"} />
        </g>
      </svg>

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

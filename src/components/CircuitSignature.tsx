import { useMemo } from "react";

/**
 * Stylized abstract circuit signature — a deterministic looping SVG path
 * seeded by the circuit id. Not to scale; used as decorative broadcast
 * graphic behind hero/cards. Renders with currentColor.
 */
export function CircuitSignature({ id, className, strokeWidth = 2.2 }: { id: string; className?: string; strokeWidth?: number }) {
  const d = useMemo(() => buildPath(id), [id]);
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true" fill="none">
      <path d={d} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d={d} stroke="currentColor" strokeWidth={strokeWidth + 6} strokeLinecap="round" strokeLinejoin="round" opacity="0.15" />
    </svg>
  );
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
}

/** Exported so the replay track map can animate along the same signature. */
export function buildCircuitPath(id: string) {
  return buildPath(id);
}

function buildPath(id: string) {
  const rnd = hash(id);
  const pts: [number, number][] = [];
  const n = 7 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rx = 60 + rnd() * 35;
    const ry = 28 + rnd() * 22;
    const jitter = (rnd() - 0.5) * 20;
    pts.push([100 + Math.cos(t) * rx + jitter, 60 + Math.sin(t) * ry + (rnd() - 0.5) * 10]);
  }
  // Catmull-Rom -> cubic bezier smoothing, closed loop
  let out = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    out += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return out + " Z";
}

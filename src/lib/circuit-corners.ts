// Circuit Corner Explorer geometry.
//
// The timing APIs expose no per-corner geometry, so Apexo derives a consistent
// model from the circuit's deterministic signature path: sampled points give
// curvature, curvature gives corners, sectors, apex speeds and DRS straights.
// Everything is seeded by circuitId, so a given track always renders the same.

import { buildCircuitPath } from "@/components/CircuitSignature";
import type { CircuitProfile } from "./circuit-profiles";

export interface TrackPoint {
  x: number;
  y: number;
  /** Cumulative distance along the lap, 0..1. */
  t: number;
  /** Signed turn rate (rad per sample). */
  curve: number;
  /** Estimated speed 0..1 (1 = top speed). */
  speed: number;
  /** Metres above the lowest point of the lap. */
  elevation: number;
}

export type CornerType = "Hairpin" | "Slow" | "Medium" | "Fast" | "Flat-out";

export interface Corner {
  number: number;
  name: string;
  /** Index into points[] at the apex. */
  index: number;
  x: number;
  y: number;
  t: number;
  sector: 1 | 2 | 3;
  type: CornerType;
  direction: "Left" | "Right";
  apexSpeedKph: number;
  entrySpeedKph: number;
  brakingM: number;
  gear: number;
  lateralG: number;
  elevationM: number;
  note: string;
}

export interface SectorInfo {
  number: 1 | 2 | 3;
  from: number;
  to: number;
  corners: number;
  /** Percentage of the lap spent at full throttle. */
  fullThrottlePct: number;
  character: string;
}

export interface DrsZone {
  number: number;
  from: number;
  to: number;
  lengthM: number;
  detectionT: number;
}

export interface TrackModel {
  path: string;
  points: TrackPoint[];
  corners: Corner[];
  sectors: SectorInfo[];
  drs: DrsZone[];
  /** Pit lane path drawn parallel to the start/finish straight. */
  pitPath: string;
  pitEntryT: number;
  pitExitT: number;
  elevationRange: number;
  lengthM: number;
}

const SAMPLES_PER_SEG = 24;

function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

function parseCubics(d: string) {
  const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  // Path shape: M x y (C c1x c1y c2x c2y x y)* Z
  const start: [number, number] = [nums[0], nums[1]];
  const segs: [number, number][][] = [];
  let cur = start;
  for (let i = 2; i + 5 < nums.length; i += 6) {
    const seg: [number, number][] = [
      cur,
      [nums[i], nums[i + 1]],
      [nums[i + 2], nums[i + 3]],
      [nums[i + 4], nums[i + 5]],
    ];
    segs.push(seg);
    cur = seg[3];
  }
  return segs;
}

function bez(p: [number, number][], u: number): [number, number] {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const c = 3 * v * u * u;
  const e = u * u * u;
  return [
    a * p[0][0] + b * p[1][0] + c * p[2][0] + e * p[3][0],
    a * p[0][1] + b * p[1][1] + c * p[2][1] + e * p[3][1],
  ];
}

const CORNER_NAMES = [
  "Turn", "Apex", "Sweep", "Complex", "Kink", "Chicane", "Curve", "Bend",
];

export function buildTrackModel(
  circuitId: string,
  profile: CircuitProfile,
  opts: { lengthKm: number; drsZones: number },
): TrackModel {
  const path = buildCircuitPath(circuitId);
  const segs = parseCubics(path);
  const rnd = seeded(circuitId + "|corners");

  // --- sample the lap -------------------------------------------------
  const raw: { x: number; y: number }[] = [];
  for (const s of segs) {
    for (let i = 0; i < SAMPLES_PER_SEG; i++) raw.push({ x: bez(s, i / SAMPLES_PER_SEG)[0], y: bez(s, i / SAMPLES_PER_SEG)[1] });
  }
  const n = raw.length;

  // cumulative arc length
  const dist: number[] = [0];
  for (let i = 1; i <= n; i++) {
    const a = raw[i - 1];
    const b = raw[i % n];
    dist.push(dist[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const total = dist[n];

  // curvature via tangent angle change, smoothed
  const curveRaw: number[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = raw[(i - 2 + n) % n];
    const p1 = raw[i];
    const p2 = raw[(i + 2) % n];
    const a1 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const a2 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    let d = a2 - a1;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    curveRaw.push(d);
  }
  const curve = curveRaw.map((_, i) => {
    let s = 0;
    for (let k = -2; k <= 2; k++) s += curveRaw[(i + k + n) % n];
    return s / 5;
  });

  const maxAbs = Math.max(...curve.map(Math.abs), 0.0001);

  // elevation: two seeded harmonics scaled to the profile's elevation range
  const ph1 = rnd() * Math.PI * 2;
  const ph2 = rnd() * Math.PI * 2;
  const points: TrackPoint[] = raw.map((p, i) => {
    const t = dist[i] / total;
    const rel = Math.abs(curve[i]) / maxAbs;
    const e =
      (Math.sin(t * Math.PI * 2 + ph1) * 0.65 + Math.sin(t * Math.PI * 4 + ph2) * 0.35 + 1) / 2;
    return {
      x: p.x,
      y: p.y,
      t,
      curve: curve[i],
      speed: Math.max(0.18, 1 - Math.pow(rel, 0.75)),
      elevation: e * profile.elevationM,
    };
  });

  // --- corners: local curvature maxima, spaced out ---------------------
  const threshold = maxAbs * 0.12;
  const candidates: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.abs(curve[i]);
    if (a < threshold) continue;
    if (a >= Math.abs(curve[(i - 1 + n) % n]) && a > Math.abs(curve[(i + 1) % n])) candidates.push(i);
  }
  const minGap = Math.max(2, Math.floor(n / (profile.corners * 2.4)));
  const picked: number[] = [];
  for (const c of candidates.sort((a, b) => Math.abs(curve[b]) - Math.abs(curve[a]))) {
    if (picked.every((p) => Math.min(Math.abs(p - c), n - Math.abs(p - c)) >= minGap)) picked.push(c);
    if (picked.length >= profile.corners) break;
  }
  // top up with the most curved remaining samples if the shape is too smooth
  const ranked = [...Array(n).keys()].sort((a, b) => Math.abs(curve[b]) - Math.abs(curve[a]));
  for (const c of ranked) {
    if (picked.length >= profile.corners) break;
    if (picked.every((p) => Math.min(Math.abs(p - c), n - Math.abs(p - c)) >= minGap)) picked.push(c);
  }
  picked.sort((a, b) => a - b);

  const lengthM = opts.lengthKm * 1000;
  const sectorOf = (t: number): 1 | 2 | 3 => (t < 1 / 3 ? 1 : t < 2 / 3 ? 2 : 3);

  const corners: Corner[] = picked.map((idx, i) => {
    const p = points[idx];
    const rel = Math.abs(curve[idx]) / maxAbs;
    const apex = Math.round(profile.topSpeedKph * (0.24 + (1 - rel) * 0.62));
    const entryIdx = (idx - Math.max(2, Math.round(n * 0.012)) + n) % n;
    const entry = Math.round(profile.topSpeedKph * (0.5 + points[entryIdx].speed * 0.5));
    const type: CornerType =
      apex < profile.topSpeedKph * 0.3
        ? "Hairpin"
        : apex < profile.topSpeedKph * 0.42
          ? "Slow"
          : apex < profile.topSpeedKph * 0.62
            ? "Medium"
            : apex < profile.topSpeedKph * 0.82
              ? "Fast"
              : "Flat-out";
    const gear = Math.max(1, Math.min(8, Math.round(1 + (apex / profile.topSpeedKph) * 7)));
    return {
      number: i + 1,
      name: `${CORNER_NAMES[i % CORNER_NAMES.length]} ${i + 1}`,
      index: idx,
      x: p.x,
      y: p.y,
      t: p.t,
      sector: sectorOf(p.t),
      type,
      direction: curve[idx] > 0 ? "Right" : "Left",
      apexSpeedKph: apex,
      entrySpeedKph: Math.max(apex + 8, entry),
      brakingM: Math.round(Math.max(0, entry - apex) * 1.35),
      gear,
      lateralG: Math.round((1.5 + rel * 3.6) * 10) / 10,
      elevationM: Math.round(p.elevation),
      note:
        type === "Hairpin"
          ? "Heavy braking zone — traction on exit decides the run to the next straight."
          : type === "Slow"
            ? "Slow-speed change of direction; kerb usage buys lap time but costs the floor."
            : type === "Medium"
              ? "Balance corner — understeer here is felt for the rest of the lap."
              : type === "Fast"
                ? "High-commitment sweep taken with a lift rather than a brake."
                : "Barely a corner in a modern car — flat with a stable rear.",
    };
  });

  const sectors: SectorInfo[] = ([1, 2, 3] as const).map((num) => {
    const from = (num - 1) / 3;
    const to = num / 3;
    const inSector = points.filter((p) => p.t >= from && p.t < to);
    const full = inSector.filter((p) => p.speed > 0.85).length / Math.max(1, inSector.length);
    const cs = corners.filter((c) => c.sector === num).length;
    return {
      number: num,
      from,
      to,
      corners: cs,
      fullThrottlePct: Math.round(full * 100),
      character:
        full > 0.55 ? "Power sector" : cs >= 5 ? "Technical sector" : "Balance sector",
    };
  });

  // --- DRS: longest low-curvature runs ---------------------------------
  const fast = points.map((p) => p.speed > 0.82);
  const runs: { from: number; to: number; len: number }[] = [];
  let start = -1;
  for (let i = 0; i < n * 2; i++) {
    const idx = i % n;
    if (fast[idx] && start === -1) start = i;
    if ((!fast[idx] || i === n * 2 - 1) && start !== -1) {
      if (start < n) runs.push({ from: start % n, to: idx % n, len: i - start });
      start = -1;
    }
  }
  const drs: DrsZone[] = runs
    .sort((a, b) => b.len - a.len)
    .slice(0, Math.max(1, opts.drsZones))
    .sort((a, b) => a.from - b.from)
    .map((r, i) => ({
      number: i + 1,
      from: points[r.from].t,
      to: points[r.to].t,
      lengthM: Math.round((r.len / n) * lengthM),
      detectionT: points[(r.from - Math.round(n * 0.03) + n) % n].t,
    }));

  // --- pit lane: offset copy of the start/finish run --------------------
  const pitLen = Math.round(n * 0.11);
  const pitPts: string[] = [];
  for (let i = -pitLen; i <= pitLen; i++) {
    const idx = (i + n) % n;
    const prev = points[(idx - 1 + n) % n];
    const p = points[idx];
    const nx = -(p.y - prev.y);
    const ny = p.x - prev.x;
    const m = Math.hypot(nx, ny) || 1;
    const taper = 1 - Math.pow(Math.abs(i) / pitLen, 3);
    pitPts.push(`${(p.x + (nx / m) * 6 * taper).toFixed(1)} ${(p.y + (ny / m) * 6 * taper).toFixed(1)}`);
  }

  return {
    path,
    points,
    corners,
    sectors,
    drs,
    pitPath: `M ${pitPts.join(" L ")}`,
    pitEntryT: points[(n - pitLen) % n].t,
    pitExitT: points[pitLen].t,
    elevationRange: profile.elevationM,
    lengthM,
  };
}

/** Distance in metres from the start/finish line for a normalised position. */
export function metresAt(t: number, lengthM: number) {
  return Math.round(t * lengthM);
}

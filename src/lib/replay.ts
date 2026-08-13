// Interactive race replay engine.
//
// Builds a lap-by-lap reconstruction of a completed race purely from the data
// Apexo already loads (results, pit stops, tyre stints, race-control events).
// No video, no telemetry streams — just a deterministic model that can be
// scrubbed, played and paused.

import type { RaceDetail, PitStopRecord } from "./f1-extra.server";
import type { RaceEvent, RaceEventKind } from "./race-events";
import type { Driver } from "./mock-data";

export const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const COMPOUND_LIFE: Record<string, number> = {
  SOFT: 18,
  MEDIUM: 28,
  HARD: 40,
  INTERMEDIATE: 30,
  WET: 32,
  UNKNOWN: 30,
};

const FALLBACK_COMPOUNDS = ["SOFT", "MEDIUM", "HARD"];

function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export interface ReplayDriverState {
  driverId: string;
  constructorId: string;
  position: number;
  gapSec: number;
  interval: number;
  compound: string;
  tyreAge: number;
  tyreLifePct: number;
  gripPct: number;
  pitting: boolean;
  retired: boolean;
  positionsGained: number;
  points: number;
}

export interface ReplayLap {
  lap: number;
  order: ReplayDriverState[];
  leaderId?: string;
  events: RaceEvent[];
  trackStatus: RaceEventKind;
  safetyCars: number;
  redFlags: number;
  fastestLap?: { driverId: string; time: string; lap: number };
  driverPoints: Record<string, number>;
  teamPoints: Record<string, number>;
}

export interface ReplayModel {
  totalLaps: number;
  laps: ReplayLap[];
  events: RaceEvent[];
  pitStops: PitStopRecord[];
  available: boolean;
}

const STATUS_KINDS: RaceEventKind[] = [
  "red",
  "sc",
  "vsc",
  "double-yellow",
  "yellow",
  "green",
  "start",
  "chequered",
];

function compoundAt(
  lap: number,
  stints: { compound: string; lapStart: number; lapEnd: number }[],
  pitLaps: number[],
): { compound: string; age: number } {
  const stint = stints.find((s) => lap >= s.lapStart && lap <= s.lapEnd);
  if (stint) return { compound: stint.compound.toUpperCase(), age: lap - stint.lapStart + 1 };
  let index = 0;
  let start = 1;
  for (const p of pitLaps) {
    if (lap > p) {
      index += 1;
      start = p + 1;
    }
  }
  return { compound: FALLBACK_COMPOUNDS[index % FALLBACK_COMPOUNDS.length], age: lap - start + 1 };
}

/** Build the full replay model for a completed race. */
export function buildReplay(
  detail: RaceDetail | undefined,
  opts: { circuitLaps: number; driversByNumber: Record<number, Driver> },
): ReplayModel {
  const results = detail?.results ?? [];
  if (!detail || !results.length) {
    return { totalLaps: 0, laps: [], events: [], pitStops: [], available: false };
  }

  const totalLaps = Math.max(
    ...results.map((r) => r.laps || 0),
    opts.circuitLaps || 0,
    1,
  );

  const numberOf: Record<string, number> = {};
  for (const [num, d] of Object.entries(opts.driversByNumber)) numberOf[d.id] = Number(num);

  const pitsBy: Record<string, PitStopRecord[]> = {};
  for (const p of detail.pitStops) (pitsBy[p.driverId] ??= []).push(p);

  const entrants = results.map((r) => {
    const number = numberOf[r.driverId];
    const stints = detail.stints
      .filter((s) => s.driverNumber === number)
      .sort((a, b) => a.lapStart - b.lapStart);
    const pitLaps = (pitsBy[r.driverId] ?? []).map((p) => p.lap).sort((a, b) => a - b);
    const grid = r.grid > 0 ? r.grid : r.position;
    const dnf = r.laps < totalLaps && !/^\+|finished/i.test(r.status || "");
    return {
      driverId: r.driverId,
      constructorId: r.constructorId,
      grid,
      finish: r.position || results.length,
      laps: r.laps || 0,
      dnf,
      status: r.status,
      stints,
      pitLaps,
      noise: seeded(r.driverId),
    };
  });

  const rawEvents = (detail.events ?? []).slice().sort((a, b) => (a.lap ?? 0) - (b.lap ?? 0));
  const events: RaceEvent[] = [];
  if (!rawEvents.some((e) => e.kind === "start")) {
    events.push({ id: "r-start", kind: "start", lap: 1, title: "Lights out", message: "Formation lap complete — the race is underway." });
  }
  events.push(
    { id: "r-drs", kind: "drs", lap: Math.min(3, totalLaps), title: "DRS enabled", message: "DRS is now enabled for the race." },
    ...rawEvents,
  );
  if (!rawEvents.some((e) => e.kind === "chequered")) {
    events.push({ id: "r-flag", kind: "chequered", lap: totalLaps, title: "Chequered flag", message: "Race complete." });
  }
  events.sort((a, b) => (a.lap ?? 0) - (b.lap ?? 0));

  const eventsByLap: Record<number, RaceEvent[]> = {};
  for (const e of events) {
    const lap = Math.max(1, Math.min(totalLaps, e.lap ?? 1));
    (eventsByLap[lap] ??= []).push(e);
  }

  const fastest = detail.results.find((r) => r.position === 1);
  const laps: ReplayLap[] = [];
  let trackStatus: RaceEventKind = "green";
  let safetyCars = 0;
  let redFlags = 0;

  for (let lap = 1; lap <= totalLaps; lap++) {
    const t = lap / totalLaps;
    const lapEvents = eventsByLap[lap] ?? [];
    for (const e of lapEvents) {
      if (STATUS_KINDS.includes(e.kind)) trackStatus = e.kind === "start" ? "green" : e.kind;
      if (e.kind === "sc" || e.kind === "vsc") safetyCars += 1;
      if (e.kind === "red") redFlags += 1;
    }

    const active = entrants.filter((e) => !(e.dnf && lap > e.laps));
    const retiredNow = entrants.filter((e) => e.dnf && lap > e.laps);

    const scored = active.map((e) => {
      const pitPenalty = e.pitLaps.reduce((acc, p) => {
        if (lap === p) return acc + 5;
        if (lap === p + 1) return acc + 2.2;
        return acc;
      }, 0);
      const wobble = Math.sin((lap + e.noise * 12) / 4) * (1 - t) * 1.1;
      return {
        e,
        score: e.grid + (e.finish - e.grid) * ease(t) + pitPenalty + wobble,
        pitting: e.pitLaps.includes(lap),
      };
    });
    scored.sort((a, b) => a.score - b.score);

    const order: ReplayDriverState[] = [];
    let gap = 0;
    scored.forEach((s, i) => {
      const interval = i === 0 ? 0 : 0.35 + s.e.noise * 1.6 + (1 - t) * 0.6 + (s.pitting ? 20 : 0);
      gap += interval;
      const { compound, age } = compoundAt(lap, s.e.stints, s.e.pitLaps);
      const life = COMPOUND_LIFE[compound] ?? 30;
      const lifePct = Math.max(0, Math.round(100 - (age / life) * 100));
      order.push({
        driverId: s.e.driverId,
        constructorId: s.e.constructorId,
        position: i + 1,
        gapSec: i === 0 ? 0 : gap,
        interval,
        compound,
        tyreAge: age,
        tyreLifePct: lifePct,
        gripPct: Math.max(20, Math.round(40 + lifePct * 0.6)),
        pitting: s.pitting,
        retired: false,
        positionsGained: s.e.grid - (i + 1),
        points: POINTS[i] ?? 0,
      });
    });

    retiredNow
      .sort((a, b) => b.laps - a.laps)
      .forEach((e, i) => {
        order.push({
          driverId: e.driverId,
          constructorId: e.constructorId,
          position: order.length + 1 + i - i,
          gapSec: 0,
          interval: 0,
          compound: "—",
          tyreAge: 0,
          tyreLifePct: 0,
          gripPct: 0,
          pitting: false,
          retired: true,
          positionsGained: 0,
          points: 0,
        });
      });

    const driverPoints: Record<string, number> = {};
    const teamPoints: Record<string, number> = {};
    order.forEach((o) => {
      const pts = o.retired ? 0 : POINTS[o.position - 1] ?? 0;
      driverPoints[o.driverId] = pts;
      teamPoints[o.constructorId] = (teamPoints[o.constructorId] ?? 0) + pts;
    });

    laps.push({
      lap,
      order,
      leaderId: order[0]?.driverId,
      events: lapEvents,
      trackStatus,
      safetyCars,
      redFlags,
      fastestLap:
        fastest && detail.events.some((e) => e.kind === "fastest-lap" && (e.lap ?? 0) <= lap)
          ? {
              driverId:
                detail.events.find((e) => e.kind === "fastest-lap")?.driverId ?? fastest.driverId,
              time: detail.events.find((e) => e.kind === "fastest-lap")?.message ?? "",
              lap: detail.events.find((e) => e.kind === "fastest-lap")?.lap ?? 0,
            }
          : undefined,
      driverPoints,
      teamPoints,
    });
  }

  return { totalLaps, laps, events, pitStops: detail.pitStops, available: true };
}

export interface ReplayWeather {
  label: string;
  airTempC: number;
  trackTempC: number;
  humidity: number;
  rainChance: number;
  windKph: number;
  dryLine: boolean;
}

/** Weather evolution across the race, anchored on the real race forecast. */
export function weatherAtLap(
  lap: number,
  totalLaps: number,
  base?: {
    airTempC: number;
    trackTempC: number;
    humidity: number;
    rainChance: number;
    windKph: number;
    code: number;
  },
): ReplayWeather | undefined {
  if (!base) return undefined;
  const t = totalLaps > 0 ? lap / totalLaps : 0;
  const swing = Math.sin(t * Math.PI);
  const rain = Math.max(0, Math.min(100, Math.round(base.rainChance * (0.6 + swing * 0.9))));
  const label =
    rain >= 65 ? "Heavy rain" : rain >= 40 ? "Light rain" : base.code >= 3 ? "Cloudy" : "Sunny";
  return {
    label,
    airTempC: Math.round(base.airTempC + swing * 1.5 - t * 1.5),
    trackTempC: Math.round(base.trackTempC + swing * 3 - t * 4 - (rain >= 40 ? 6 : 0)),
    humidity: Math.max(5, Math.min(100, Math.round(base.humidity + rain * 0.2))),
    rainChance: rain,
    windKph: Math.round(base.windKph + swing * 3),
    dryLine: rain > 0 && rain < 40,
  };
}

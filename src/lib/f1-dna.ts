// F1 DNA — Apexo's signature performance fingerprint.
// Metrics are derived from live season statistics where the data supports it,
// and blended with a deterministic per-entity trait seed so every profile is
// stable across renders and sessions (never random).

import type { DriverSeasonStat, TeamSeasonStat } from "./f1-extra.server";
import type { CircuitProfile } from "./circuit-profiles";

export interface DnaMetric {
  key: string;
  label: string;
  value: number; // 0–100
}

export interface DnaProfile {
  metrics: DnaMetric[];
  /** True when live season statistics contributed to the profile. */
  derived: boolean;
}

const clamp = (n: number) => Math.max(5, Math.min(99, Math.round(n)));

/** Stable 0–1 hash so "feel" traits never flicker between renders. */
function seed(id: string, salt: string): number {
  let h = 2166136261;
  const s = `${id}::${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/** Blend a measured signal with the trait seed so unmeasured axes stay plausible. */
const blend = (measured: number, id: string, salt: string, spread = 18) =>
  clamp(measured + (seed(id, salt) - 0.5) * spread);

/* --------------------------------- driver -------------------------------- */

export function driverDna(driverId: string, stat?: DriverSeasonStat): DnaProfile {
  const entries = stat?.entries ?? 0;
  const derived = entries > 0;

  const paceScore = derived ? 100 - (stat!.avgFinish - 1) * 4.2 : 55;
  const qualiScore = derived ? 100 - (stat!.avgGrid - 1) * 4.2 : 55;
  const consistency = derived ? 45 + stat!.finishRate * 45 + (stat!.podiums / Math.max(1, entries)) * 12 : 55;
  const winRate = derived ? stat!.wins / Math.max(1, entries) : 0;
  const poleRate = derived ? stat!.poles / Math.max(1, entries) : 0;
  const gridGain = derived ? stat!.avgGrid - stat!.avgFinish : 0;

  return {
    derived,
    metrics: [
      { key: "pace", label: "Race pace", value: clamp(paceScore) },
      { key: "quali", label: "Qualifying", value: clamp(qualiScore + poleRate * 20) },
      { key: "consistency", label: "Consistency", value: clamp(consistency) },
      { key: "aggression", label: "Aggression", value: blend(58 + gridGain * 6, driverId, "aggression", 26) },
      { key: "tyres", label: "Tyre management", value: blend(52 + (derived ? stat!.finishRate * 22 : 8), driverId, "tyres", 22) },
      { key: "wet", label: "Wet weather", value: blend(55 + winRate * 60, driverId, "wet", 28) },
      { key: "starts", label: "Starts", value: blend(56 + gridGain * 8, driverId, "starts", 22) },
      { key: "overtaking", label: "Overtaking", value: clamp(52 + gridGain * 9 + seed(driverId, "ovt") * 14) },
      { key: "racecraft", label: "Racecraft", value: clamp((paceScore + (52 + gridGain * 9)) / 2) },
      { key: "pressure", label: "Pressure handling", value: blend(54 + winRate * 55 + (derived ? stat!.finishRate * 12 : 0), driverId, "pressure", 20) },
    ],
  };
}

/* ------------------------------- constructor ------------------------------ */

export function teamDna(constructorId: string, stat?: TeamSeasonStat, championships = 0): DnaProfile {
  const entries = stat?.entries ?? 0;
  const derived = entries > 0;

  const pace = derived ? 100 - (stat!.avgFinish - 1) * 4.0 : 55;
  const quali = derived ? 100 - (stat!.avgGrid - 1) * 4.0 : 55;
  const reliability = derived ? 40 + stat!.finishRate * 58 : 60;
  const heritage = Math.min(18, championships * 2);

  return {
    derived,
    metrics: [
      { key: "strategy", label: "Strategy", value: blend(pace * 0.6 + 30, constructorId, "strategy", 20) },
      { key: "reliability", label: "Reliability", value: clamp(reliability) },
      { key: "pitstops", label: "Pit stops", value: blend(58 + heritage, constructorId, "pit", 24) },
      { key: "development", label: "Development", value: blend(52 + heritage, constructorId, "dev", 26) },
      { key: "aero", label: "Aerodynamics", value: blend(pace * 0.7 + 22, constructorId, "aero", 18) },
      { key: "power", label: "Power unit", value: blend(quali * 0.65 + 26, constructorId, "power", 20) },
      { key: "racePace", label: "Race pace", value: clamp(pace) },
      { key: "qualiPace", label: "Qualifying pace", value: clamp(quali) },
      { key: "tyres", label: "Tyre usage", value: blend(pace * 0.5 + 32, constructorId, "tyres", 22) },
      { key: "consistency", label: "Consistency", value: clamp((reliability + pace) / 2) },
    ],
  };
}

/* --------------------------------- circuit -------------------------------- */

const WET_TRACKS = new Set(["spa", "interlagos", "suzuka", "silverstone", "marina_bay", "shanghai", "hungaroring", "zandvoort", "imola"]);
const STREET_TRACKS = new Set(["monaco", "baku", "jeddah", "marina_bay", "vegas", "miami", "albert_park"]);

export function circuitDna(circuitId: string, profile: CircuitProfile, drsZones: number): DnaProfile {
  const to100 = (v: number) => clamp(v * 19 + 5);
  const downforce = 6 - Math.min(5, Math.max(1, Math.round((profile.topSpeedKph - 285) / 15)));

  return {
    derived: true,
    metrics: [
      { key: "topSpeed", label: "Top speed", value: clamp(((profile.topSpeedKph - 280) / 85) * 100) },
      { key: "difficulty", label: "Technical difficulty", value: clamp(profile.corners * 3.4 + (STREET_TRACKS.has(circuitId) ? 22 : 6)) },
      { key: "downforce", label: "Downforce", value: to100(downforce) },
      { key: "tyreWear", label: "Tyre wear", value: to100(profile.tyreWear) },
      { key: "brakeWear", label: "Brake wear", value: to100(profile.brakeWear) },
      { key: "overtaking", label: "Overtaking", value: clamp(profile.overtaking * 17 + drsZones * 5) },
      { key: "elevation", label: "Elevation", value: clamp(Math.min(100, (profile.elevationM / 105) * 90) + 6) },
      { key: "grip", label: "Grip", value: clamp(STREET_TRACKS.has(circuitId) ? 46 : 72 + seed(circuitId, "grip") * 14) },
      { key: "safetyCar", label: "Safety car chance", value: clamp(STREET_TRACKS.has(circuitId) ? 74 : 34 + seed(circuitId, "sc") * 26) },
      { key: "rain", label: "Rain chance", value: clamp(WET_TRACKS.has(circuitId) ? 58 + seed(circuitId, "rain") * 24 : 18 + seed(circuitId, "rain") * 22) },
    ],
  };
}

export function dnaBand(value: number) {
  if (value >= 82) return "Elite";
  if (value >= 68) return "Strong";
  if (value >= 52) return "Solid";
  if (value >= 36) return "Developing";
  return "Limited";
}

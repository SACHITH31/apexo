// Deterministic race insights — every value is derived from the replay model
// and the race detail payload (results, pit stops, stints, race control).
// No AI, no invented numbers.

import type { RaceDetail } from "./f1-extra.server";
import type { ReplayModel } from "./replay";

export interface RaceInsight {
  key: string;
  label: string;
  value: string;
  detail: string;
}

export interface BattleGap {
  lap: number;
  gap: number; // positive => A ahead of B, in seconds
  aPos: number;
  bPos: number;
}

/** Count position changes (net gains) per driver across the replay laps. */
export function overtakeCounts(model: ReplayModel): Record<string, number> {
  const counts: Record<string, number> = {};
  for (let i = 1; i < model.laps.length; i++) {
    const prev = new Map(model.laps[i - 1].order.map((o) => [o.driverId, o.position]));
    for (const o of model.laps[i].order) {
      const before = prev.get(o.driverId);
      if (before !== undefined && before > o.position && !o.retired) {
        counts[o.driverId] = (counts[o.driverId] ?? 0) + (before - o.position);
      }
    }
  }
  return counts;
}

/** Gap evolution between two drivers, lap by lap. */
export function battleGaps(model: ReplayModel, a: string, b: string): BattleGap[] {
  const rows: BattleGap[] = [];
  for (const lap of model.laps) {
    const ra = lap.order.find((o) => o.driverId === a);
    const rb = lap.order.find((o) => o.driverId === b);
    if (!ra || !rb) continue;
    rows.push({ lap: lap.lap, gap: rb.gapSec - ra.gapSec, aPos: ra.position, bPos: rb.position });
  }
  return rows;
}

export function computeInsights(
  model: ReplayModel,
  detail: RaceDetail | undefined,
  nameOf: (driverId: string) => string,
  teamNameOf: (constructorId: string) => string,
): RaceInsight[] {
  if (!detail || !model.available) return [];
  const out: RaceInsight[] = [];
  const results = detail.results;

  // Biggest comeback — grid vs classified finish.
  const comeback = results
    .filter((r) => r.grid > 0 && r.position > 0)
    .map((r) => ({ r, gain: r.grid - r.position }))
    .sort((x, y) => y.gain - x.gain)[0];
  if (comeback && comeback.gain > 0) {
    out.push({
      key: "comeback",
      label: "Biggest comeback",
      value: nameOf(comeback.r.driverId),
      detail: `P${comeback.r.grid} → P${comeback.r.position} (+${comeback.gain})`,
    });
  }

  // Most overtakes — net positions gained lap over lap.
  const ot = overtakeCounts(model);
  const topOt = Object.entries(ot).sort((a, b) => b[1] - a[1])[0];
  if (topOt) {
    out.push({
      key: "overtakes",
      label: "Most positions gained",
      value: nameOf(topOt[0]),
      detail: `${topOt[1]} places on track`,
    });
  }

  // Longest stint from tyre data.
  const numberToDriver = new Map<number, string>();
  for (const ev of model.events) if (ev.driverNumber && ev.driverId) numberToDriver.set(ev.driverNumber, ev.driverId);
  const longest = detail.stints
    .map((s) => ({ s, len: s.lapEnd - s.lapStart + 1 }))
    .sort((a, b) => b.len - a.len)[0];
  if (longest) {
    const who = numberToDriver.get(longest.s.driverNumber);
    out.push({
      key: "stint",
      label: "Longest stint",
      value: `${longest.len} laps`,
      detail: `${longest.s.compound.toUpperCase()} · ${who ? nameOf(who) : `#${longest.s.driverNumber}`}`,
    });
  }

  // Pit stops.
  if (detail.pitStops.length) {
    const perDriver: Record<string, number> = {};
    for (const p of detail.pitStops) perDriver[p.driverId] = (perDriver[p.driverId] ?? 0) + 1;
    const most = Object.entries(perDriver).sort((a, b) => b[1] - a[1])[0];
    out.push({
      key: "pits",
      label: "Most pit stops",
      value: `${most[1]} stops`,
      detail: nameOf(most[0]),
    });

    const best = detail.pitStops.slice().sort((a, b) => a.duration - b.duration)[0];
    const bestTeam = results.find((r) => r.driverId === best.driverId)?.constructorId;
    out.push({
      key: "crew",
      label: "Best pit crew",
      value: `${best.duration.toFixed(2)}s`,
      detail: `${bestTeam ? teamNameOf(bestTeam) : nameOf(best.driverId)} · Lap ${best.lap}`,
    });
  }

  // Driver of the race — points + positions gained + laps led, all measured.
  const lapsLed: Record<string, number> = {};
  for (const lap of model.laps) if (lap.leaderId) lapsLed[lap.leaderId] = (lapsLed[lap.leaderId] ?? 0) + 1;
  const rated = results
    .filter((r) => r.position > 0)
    .map((r) => ({
      r,
      score:
        r.points * 2 +
        Math.max(0, (r.grid || r.position) - r.position) * 3 +
        (lapsLed[r.driverId] ?? 0) * 0.5 +
        (ot[r.driverId] ?? 0),
    }))
    .sort((a, b) => b.score - a.score);
  if (rated[0]) {
    out.push({
      key: "dotr",
      label: "Driver of the race",
      value: nameOf(rated[0].r.driverId),
      detail: `Apexo rating ${rated[0].score.toFixed(1)}`,
    });
  }

  // Team of the race — combined points of both cars.
  const teamPoints: Record<string, number> = {};
  for (const r of results) teamPoints[r.constructorId] = (teamPoints[r.constructorId] ?? 0) + r.points;
  const topTeam = Object.entries(teamPoints).sort((a, b) => b[1] - a[1])[0];
  if (topTeam && topTeam[1] > 0) {
    out.push({
      key: "totr",
      label: "Team of the race",
      value: teamNameOf(topTeam[0]),
      detail: `${topTeam[1]} points scored`,
    });
  }

  // Laps led.
  const topLed = Object.entries(lapsLed).sort((a, b) => b[1] - a[1])[0];
  if (topLed) {
    out.push({
      key: "led",
      label: "Most laps led",
      value: `${topLed[1]} laps`,
      detail: nameOf(topLed[0]),
    });
  }

  // Cleanest race — classified, no penalty events, fewest stops.
  const penalised = new Set(
    model.events.filter((e) => e.kind === "penalty" && e.driverId).map((e) => e.driverId as string),
  );
  const clean = results
    .filter((r) => r.position > 0 && !penalised.has(r.driverId))
    .map((r) => ({ r, stops: detail.pitStops.filter((p) => p.driverId === r.driverId).length }))
    .sort((a, b) => a.stops - b.stops || a.r.position - b.r.position)[0];
  if (clean) {
    out.push({
      key: "clean",
      label: "Cleanest race",
      value: nameOf(clean.r.driverId),
      detail: `P${clean.r.position} · ${clean.stops} stop${clean.stops === 1 ? "" : "s"} · no penalties`,
    });
  }

  // Race interruptions — measured from race control.
  const last = model.laps[model.laps.length - 1];
  if (last) {
    out.push({
      key: "interruptions",
      label: "Interruptions",
      value: `${last.safetyCars} SC/VSC`,
      detail: `${last.redFlags} red flag${last.redFlags === 1 ? "" : "s"} · ${model.events.length} race control calls`,
    });
  }

  return out;
}

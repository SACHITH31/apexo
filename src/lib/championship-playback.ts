// Championship Playback model. Rebuilds the title fight round-by-round from
// the same per-race results the Statistics page already loads — no extra
// requests, no hardcoded Formula 1 data.

import type { SeasonStats } from "./f1-extra.server";

export interface PlaybackRow {
  id: string;
  constructorId: string;
  points: number;
  gained: number;
  wins: number;
  position: number;
  /** Positive = moved up the table on this round. */
  posDelta: number;
}

export interface PlaybackRound {
  round: number;
  label: string;
  name: string;
  date: string;
  drivers: PlaybackRow[];
  teams: PlaybackRow[];
  leaderId?: string;
  leaderChanged: boolean;
  /** Points between P1 and P2 in the drivers' championship. */
  margin: number;
  remaining: number;
  /** Maximum points still available to a driver over the remaining rounds. */
  maxAvailable: number;
  titleSwing: boolean;
}

interface Acc {
  points: number;
  wins: number;
  constructorId: string;
}

function rank(map: Map<string, Acc>): PlaybackRow[] {
  return [...map.entries()]
    .map(([id, a]) => ({ id, ...a }))
    .sort((x, y) => y.points - x.points || y.wins - x.wins || x.id.localeCompare(y.id))
    .map((r, i) => ({
      id: r.id,
      constructorId: r.constructorId,
      points: Math.round(r.points * 100) / 100,
      wins: r.wins,
      position: i + 1,
      gained: 0,
      posDelta: 0,
    }));
}

function applyDeltas(rows: PlaybackRow[], prev: PlaybackRow[] | undefined) {
  const prevByIdPoints = new Map(prev?.map((p) => [p.id, p.points]));
  const prevByIdPos = new Map(prev?.map((p) => [p.id, p.position]));
  for (const row of rows) {
    row.gained = Math.round((row.points - (prevByIdPoints.get(row.id) ?? 0)) * 100) / 100;
    const before = prevByIdPos.get(row.id);
    row.posDelta = before === undefined ? 0 : before - row.position;
  }
  return rows;
}

/** Cumulative standings after every completed round of a season. */
export function buildChampionshipPlayback(stats: SeasonStats): PlaybackRound[] {
  const driverAcc = new Map<string, Acc>();
  const teamAcc = new Map<string, Acc>();
  const out: PlaybackRound[] = [];

  const races = [...stats.perRace].sort((a, b) => a.round - b.round);
  const total = races.length;

  // Highest points haul observed in a single round — derived, not assumed.
  let maxPerRound = 0;
  for (const race of races) {
    for (const e of race.entries) maxPerRound = Math.max(maxPerRound, e.points);
  }

  let prevDrivers: PlaybackRow[] | undefined;
  let prevTeams: PlaybackRow[] | undefined;
  let prevLeader: string | undefined;

  races.forEach((race, index) => {
    for (const e of race.entries) {
      const d = driverAcc.get(e.driverId) ?? { points: 0, wins: 0, constructorId: e.constructorId };
      d.points += e.points;
      d.constructorId = e.constructorId;
      if (e.position === 1) d.wins += 1;
      driverAcc.set(e.driverId, d);

      const t = teamAcc.get(e.constructorId) ?? { points: 0, wins: 0, constructorId: e.constructorId };
      t.points += e.points;
      if (e.position === 1) t.wins += 1;
      teamAcc.set(e.constructorId, t);
    }

    const drivers = applyDeltas(rank(driverAcc), prevDrivers);
    const teams = applyDeltas(rank(teamAcc), prevTeams);
    const info = stats.rounds.find((r) => r.round === race.round);
    const leaderId = drivers[0]?.id;
    const margin = Math.round(((drivers[0]?.points ?? 0) - (drivers[1]?.points ?? 0)) * 100) / 100;
    const remaining = total - index - 1;

    out.push({
      round: race.round,
      label: race.label,
      name: info?.name ?? race.label,
      date: info?.date ?? "",
      drivers,
      teams,
      leaderId,
      leaderChanged: Boolean(prevLeader) && leaderId !== prevLeader,
      margin,
      remaining,
      maxAvailable: remaining * maxPerRound,
      titleSwing: remaining > 0 && margin <= remaining * maxPerRound && margin > 0,
    });

    prevDrivers = drivers;
    prevTeams = teams;
    prevLeader = leaderId;
  });

  return out;
}

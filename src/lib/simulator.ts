// Championship Simulator engine — pure functions so results memoize cleanly.

export const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

export type RoundOrder = {
  /** driverIds in finishing order, index 0 = P1. Empty slots are ignored. */
  race: (string | null)[];
  sprint: (string | null)[];
};

export type SimulationState = Record<number, RoundOrder>;

export interface StandingRow {
  id: string;
  points: number;
  base: number;
  gained: number;
}

export function pointsFor(order: (string | null)[], table: number[]) {
  const out: Record<string, number> = {};
  order.slice(0, table.length).forEach((id, i) => {
    if (!id) return;
    out[id] = (out[id] ?? 0) + table[i];
  });
  return out;
}

export function emptyOrder(): RoundOrder {
  return { race: Array(10).fill(null), sprint: Array(8).fill(null) };
}

export interface SimInput {
  /** Current championship points per driver id. */
  driverBase: Record<string, number>;
  /** driverId -> constructorId */
  driverTeam: Record<string, string>;
  teamBase: Record<string, number>;
  rounds: { round: number; hasSprint: boolean }[];
  state: SimulationState;
}

export interface RoundProjection {
  round: number;
  drivers: StandingRow[];
  teams: StandingRow[];
  leaderChanged: boolean;
  leader: string;
  /** A round where the leader's gap exceeds every remaining points haul. */
  decider: boolean;
}

function rank(map: Record<string, number>, base: Record<string, number>): StandingRow[] {
  return Object.keys(map)
    .map((id) => ({ id, points: map[id], base: base[id] ?? 0, gained: map[id] - (base[id] ?? 0) }))
    .sort((a, b) => b.points - a.points || a.id.localeCompare(b.id));
}

/** Runs every remaining round and returns the standings after each one. */
export function simulate(input: SimInput): RoundProjection[] {
  const drivers = { ...input.driverBase };
  const teams = { ...input.teamBase };
  let prevLeader = rank(drivers, input.driverBase)[0]?.id ?? "";
  const out: RoundProjection[] = [];

  const remainingAfter = (index: number) =>
    input.rounds.slice(index + 1).reduce((sum, r) => sum + 25 + (r.hasSprint ? 8 : 0), 0);

  input.rounds.forEach((r, index) => {
    const order = input.state[r.round] ?? emptyOrder();
    const awarded: Record<string, number> = {};
    for (const [id, pts] of Object.entries(pointsFor(order.race, RACE_POINTS))) {
      awarded[id] = (awarded[id] ?? 0) + pts;
    }
    if (r.hasSprint) {
      for (const [id, pts] of Object.entries(pointsFor(order.sprint, SPRINT_POINTS))) {
        awarded[id] = (awarded[id] ?? 0) + pts;
      }
    }
    for (const [id, pts] of Object.entries(awarded)) {
      drivers[id] = (drivers[id] ?? 0) + pts;
      const team = input.driverTeam[id];
      if (team) teams[team] = (teams[team] ?? 0) + pts;
    }

    const driverRows = rank(drivers, input.driverBase);
    const teamRows = rank(teams, input.teamBase);
    const leader = driverRows[0]?.id ?? "";
    const gap = (driverRows[0]?.points ?? 0) - (driverRows[1]?.points ?? 0);
    const projection: RoundProjection = {
      round: r.round,
      drivers: driverRows,
      teams: teamRows,
      leader,
      leaderChanged: Boolean(leader) && leader !== prevLeader,
      decider: gap > remainingAfter(index) && remainingAfter(index) >= 0,
    };
    prevLeader = leader;
    out.push(projection);
  });

  return out;
}

const KEY = "apexo.simulator.v1";

export function loadSimulation(): SimulationState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as SimulationState;
  } catch {
    return {};
  }
}

export function saveSimulation(state: SimulationState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — simulation stays in memory */
  }
}

export function clearSimulation() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

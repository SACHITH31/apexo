// Season comparison metrics. Everything is aggregated from the classified
// results of each season — no hardcoded Formula 1 data.

import type { SeasonStats } from "./f1-extra.server";

export interface SeasonSummary {
  season: string;
  rounds: number;
  raceWinners: number;
  poleSitters: number;
  fastestLapSetters: number;
  podiumFinishers: number;
  dnfs: number;
  dnfRate: number;
  /** Mean positions gained from grid to flag, per classified finisher. */
  avgPositionsGained: number;
  championshipMargin: number;
  driverDominance: number;
  constructorDominance: number;
  topDriverId?: string;
  topTeamId?: string;
  topDriverWins: number;
  topTeamWins: number;
}

export function summarizeSeason(stats: SeasonStats): SeasonSummary {
  const drivers = Object.values(stats.drivers).sort((a, b) => b.points - a.points);
  const teams = Object.values(stats.teams).sort((a, b) => b.points - a.points);
  const rounds = stats.perRace.length;

  const winners = new Set<string>();
  const poles = new Set<string>();
  const fls = new Set<string>();
  const podiums = new Set<string>();
  let dnfs = 0;
  let entries = 0;
  let gains = 0;
  let gainSamples = 0;

  for (const race of stats.perRace) {
    for (const e of race.entries) {
      entries += 1;
      if (e.dnf) dnfs += 1;
      if (e.position === 1) winners.add(e.driverId);
      if (e.grid === 1) poles.add(e.driverId);
      if (e.fastestLap) fls.add(e.driverId);
      if (e.position > 0 && e.position <= 3) podiums.add(e.driverId);
      if (!e.dnf && e.grid > 0 && e.position > 0) {
        gains += e.grid - e.position;
        gainSamples += 1;
      }
    }
  }

  const driverTotal = drivers.reduce((a, d) => a + d.points, 0);
  const teamTotal = teams.reduce((a, t) => a + t.points, 0);

  return {
    season: stats.season,
    rounds,
    raceWinners: winners.size,
    poleSitters: poles.size,
    fastestLapSetters: fls.size,
    podiumFinishers: podiums.size,
    dnfs,
    dnfRate: entries ? Math.round((dnfs / entries) * 1000) / 10 : 0,
    avgPositionsGained: gainSamples ? Math.round((gains / gainSamples) * 100) / 100 : 0,
    championshipMargin: Math.round(((drivers[0]?.points ?? 0) - (drivers[1]?.points ?? 0)) * 10) / 10,
    driverDominance: driverTotal ? Math.round(((drivers[0]?.points ?? 0) / driverTotal) * 1000) / 10 : 0,
    constructorDominance: teamTotal ? Math.round(((teams[0]?.points ?? 0) / teamTotal) * 1000) / 10 : 0,
    topDriverId: drivers[0]?.driverId,
    topTeamId: teams[0]?.constructorId,
    topDriverWins: drivers[0]?.wins ?? 0,
    topTeamWins: teams[0]?.wins ?? 0,
  };
}

export interface CompareMetric {
  key: string;
  label: string;
  a: number;
  b: number;
  suffix?: string;
  /** Lower is "better" for these — used only for tinting. */
  invert?: boolean;
}

export function compareMetrics(a: SeasonSummary, b: SeasonSummary): CompareMetric[] {
  return [
    { key: "rounds", label: "Rounds scored", a: a.rounds, b: b.rounds },
    { key: "winners", label: "Different race winners", a: a.raceWinners, b: b.raceWinners },
    { key: "poles", label: "Different pole sitters", a: a.poleSitters, b: b.poleSitters },
    { key: "fl", label: "Fastest-lap setters", a: a.fastestLapSetters, b: b.fastestLapSetters },
    { key: "podium", label: "Drivers on the podium", a: a.podiumFinishers, b: b.podiumFinishers },
    { key: "dnf", label: "Retirements", a: a.dnfs, b: b.dnfs, invert: true },
    { key: "dnfrate", label: "Retirement rate", a: a.dnfRate, b: b.dnfRate, suffix: "%", invert: true },
    { key: "gain", label: "Avg positions gained", a: a.avgPositionsGained, b: b.avgPositionsGained },
    { key: "margin", label: "Championship margin", a: a.championshipMargin, b: b.championshipMargin, suffix: " pts" },
    { key: "ddom", label: "Driver dominance", a: a.driverDominance, b: b.driverDominance, suffix: "%" },
    { key: "cdom", label: "Constructor dominance", a: a.constructorDominance, b: b.constructorDominance, suffix: "%" },
    { key: "topwins", label: "Wins by the champion-elect", a: a.topDriverWins, b: b.topDriverWins },
  ];
}

// Records & Achievements engine. Every record is derived from classified
// results returned by the timing API for the selected season — nothing here is
// hardcoded Formula 1 knowledge.

import type { SeasonStats } from "./f1-extra.server";

export interface RecordItem {
  id: string;
  label: string;
  holderId: string;
  /** "driver" | "team" | "circuit" */
  scope: "driver" | "team" | "circuit" | "season";
  value: string;
  detail?: string;
}

export interface RecordGroup {
  title: string;
  items: RecordItem[];
}

export interface Badge {
  id: string;
  label: string;
  tone: "gold" | "silver" | "accent";
}

function best<T>(list: T[], score: (x: T) => number): T | undefined {
  let top: T | undefined;
  let topScore = -Infinity;
  for (const item of list) {
    const s = score(item);
    if (s > topScore) {
      topScore = s;
      top = item;
    }
  }
  return topScore > 0 ? top : undefined;
}

/** Longest run of consecutive wins by any driver in the season. */
function longestWinStreak(stats: SeasonStats) {
  const races = [...stats.perRace].sort((a, b) => a.round - b.round);
  let bestId = "";
  let bestLen = 0;
  let currentId = "";
  let currentLen = 0;
  for (const race of races) {
    const winner = race.entries.find((e) => e.position === 1)?.driverId;
    if (!winner) continue;
    if (winner === currentId) currentLen += 1;
    else {
      currentId = winner;
      currentLen = 1;
    }
    if (currentLen > bestLen) {
      bestLen = currentLen;
      bestId = currentId;
    }
  }
  return { driverId: bestId, length: bestLen };
}

/** Pole + win + fastest lap in the same event. */
export function perfectWeekends(stats: SeasonStats) {
  const out: { driverId: string; round: number; label: string }[] = [];
  for (const race of stats.perRace) {
    const winner = race.entries.find((e) => e.position === 1);
    if (!winner) continue;
    const pole = winner.grid === 1;
    const fl = winner.fastestLap;
    if (pole && fl) out.push({ driverId: winner.driverId, round: race.round, label: race.label });
  }
  return out;
}

/** Biggest single-race position gain (grid → finish). */
function biggestComeback(stats: SeasonStats) {
  let bestGain = 0;
  let holder = "";
  let where = "";
  for (const race of stats.perRace) {
    for (const e of race.entries) {
      if (!e.grid || !e.position || e.dnf) continue;
      const gain = e.grid - e.position;
      if (gain > bestGain) {
        bestGain = gain;
        holder = e.driverId;
        where = race.label;
      }
    }
  }
  return { holder, gain: bestGain, where };
}

/** Rounds where a single constructor took both P1 and P2. */
function oneTwos(stats: SeasonStats) {
  const counts: Record<string, number> = {};
  for (const race of stats.perRace) {
    const p1 = race.entries.find((e) => e.position === 1);
    const p2 = race.entries.find((e) => e.position === 2);
    if (p1 && p2 && p1.constructorId === p2.constructorId) {
      counts[p1.constructorId] = (counts[p1.constructorId] ?? 0) + 1;
    }
  }
  return counts;
}

/** Circuit-level records: who won there and from which grid slot. */
export function circuitRecords(stats: SeasonStats): RecordItem[] {
  return stats.perRace
    .map((race) => {
      const winner = race.entries.find((e) => e.position === 1);
      if (!winner) return null;
      return {
        id: `circuit-${race.round}`,
        scope: "circuit" as const,
        label: race.label,
        holderId: winner.driverId,
        value: `P${winner.grid || "—"} → P1`,
        detail: `Round ${race.round}`,
      };
    })
    .filter(Boolean) as RecordItem[];
}

export function computeRecords(stats: SeasonStats): RecordGroup[] {
  const drivers = Object.values(stats.drivers);
  const teams = Object.values(stats.teams);
  const streak = longestWinStreak(stats);
  const perfect = perfectWeekends(stats);
  const comeback = biggestComeback(stats);
  const twos = oneTwos(stats);
  const bestOneTwo = Object.entries(twos).sort((a, b) => b[1] - a[1])[0];

  const driverItems: RecordItem[] = [];
  const push = (
    items: RecordItem[],
    id: string,
    label: string,
    holderId: string | undefined,
    value: string | number,
    scope: RecordItem["scope"],
    detail?: string,
  ) => {
    if (!holderId) return;
    items.push({ id, label, holderId, value: String(value), scope, detail });
  };

  const mostWins = best(drivers, (d) => d.wins);
  const mostPoles = best(drivers, (d) => d.poles);
  const mostPodiums = best(drivers, (d) => d.podiums);
  const mostFL = best(drivers, (d) => d.fastestLaps);
  const bestAvgFinish = drivers
    .filter((d) => d.entries >= Math.max(3, stats.perRace.length / 2))
    .sort((a, b) => a.avgFinish - b.avgFinish)[0];
  const mostReliable = drivers
    .filter((d) => d.entries >= Math.max(3, stats.perRace.length / 2))
    .sort((a, b) => b.finishRate - a.finishRate)[0];

  push(driverItems, "wins", "Most wins", mostWins?.driverId, mostWins?.wins ?? 0, "driver");
  push(driverItems, "poles", "Most poles", mostPoles?.driverId, mostPoles?.poles ?? 0, "driver");
  push(driverItems, "podiums", "Most podiums", mostPodiums?.driverId, mostPodiums?.podiums ?? 0, "driver");
  push(driverItems, "fl", "Most fastest laps", mostFL?.driverId, mostFL?.fastestLaps ?? 0, "driver");
  push(
    driverItems,
    "streak",
    "Longest winning streak",
    streak.length > 1 ? streak.driverId : undefined,
    `${streak.length} races`,
    "driver",
  );
  push(
    driverItems,
    "perfect",
    "Perfect weekends",
    perfect[0]?.driverId,
    `${perfect.length}`,
    "driver",
    perfect.map((p) => p.label).join(", "),
  );
  push(
    driverItems,
    "comeback",
    "Biggest comeback",
    comeback.holder,
    `+${comeback.gain} places`,
    "driver",
    comeback.where,
  );
  push(
    driverItems,
    "avg",
    "Best average finish",
    bestAvgFinish?.driverId,
    bestAvgFinish ? `P${bestAvgFinish.avgFinish.toFixed(1)}` : "",
    "driver",
  );
  push(
    driverItems,
    "reliable",
    "Highest finish rate",
    mostReliable?.driverId,
    mostReliable ? `${Math.round(mostReliable.finishRate)}%` : "",
    "driver",
  );

  const teamItems: RecordItem[] = [];
  const tWins = best(teams, (t) => t.wins);
  const tPoles = best(teams, (t) => t.poles);
  const tPodiums = best(teams, (t) => t.podiums);
  const tPoints = best(teams, (t) => t.points);
  push(teamItems, "t-wins", "Most wins", tWins?.constructorId, tWins?.wins ?? 0, "team");
  push(teamItems, "t-poles", "Most poles", tPoles?.constructorId, tPoles?.poles ?? 0, "team");
  push(teamItems, "t-podiums", "Most podiums", tPodiums?.constructorId, tPodiums?.podiums ?? 0, "team");
  push(teamItems, "t-points", "Most points", tPoints?.constructorId, tPoints?.points ?? 0, "team");
  if (bestOneTwo) {
    push(teamItems, "t-onetwo", "Most 1-2 finishes", bestOneTwo[0], bestOneTwo[1], "team");
  }

  const seasonItems: RecordItem[] = [];
  const totalPoints = drivers.reduce((a, d) => a + d.points, 0);
  const leader = drivers.sort((a, b) => b.points - a.points)[0];
  const runnerUp = drivers[1];
  const winners = new Set(
    stats.perRace.map((r) => r.entries.find((e) => e.position === 1)?.driverId).filter(Boolean),
  );
  if (leader) {
    seasonItems.push({
      id: "s-margin",
      scope: "season",
      label: "Championship margin",
      holderId: leader.driverId,
      value: `${Math.round((leader.points - (runnerUp?.points ?? 0)) * 10) / 10} pts`,
    });
    seasonItems.push({
      id: "s-share",
      scope: "season",
      label: "Points share of the field",
      holderId: leader.driverId,
      value: totalPoints ? `${Math.round((leader.points / totalPoints) * 100)}%` : "—",
    });
  }
  seasonItems.push({
    id: "s-winners",
    scope: "season",
    label: "Different race winners",
    holderId: "",
    value: String(winners.size),
    detail: `${stats.perRace.length} rounds scored`,
  });

  return [
    { title: "Driver records", items: driverItems },
    { title: "Constructor records", items: teamItems },
    { title: "Season records", items: seasonItems },
    { title: "Circuit records", items: circuitRecords(stats) },
  ].filter((g) => g.items.length > 0);
}

/** Milestone badges surfaced on driver pages and elsewhere. */
export function driverBadges(stats: SeasonStats, driverId: string): Badge[] {
  const d = stats.drivers[driverId];
  if (!d) return [];
  const badges: Badge[] = [];
  const drivers = Object.values(stats.drivers).sort((a, b) => b.points - a.points);
  if (drivers[0]?.driverId === driverId && d.points > 0) {
    badges.push({ id: "leader", label: "Championship leader", tone: "gold" });
  }
  if (d.wins > 0) badges.push({ id: "winner", label: `${d.wins} win${d.wins > 1 ? "s" : ""}`, tone: "gold" });
  if (d.poles > 0) badges.push({ id: "pole", label: `${d.poles} pole${d.poles > 1 ? "s" : ""}`, tone: "accent" });
  if (d.podiums > 0) badges.push({ id: "podium", label: `${d.podiums} podiums`, tone: "silver" });
  if (d.fastestLaps > 0) badges.push({ id: "fl", label: `${d.fastestLaps} fastest laps`, tone: "accent" });
  if (perfectWeekends(stats).some((p) => p.driverId === driverId)) {
    badges.push({ id: "perfect", label: "Perfect weekend", tone: "gold" });
  }
  if (d.entries > 0 && d.dnfs === 0) badges.push({ id: "finisher", label: "Every race finished", tone: "silver" });
  return badges;
}

// Extended live data layer: season-wide analytics + per-race weekend detail.
// Built on the same Jolpica (Ergast-compatible) source as f1.server.ts, with a
// best-effort OpenF1 enrichment for race control messages and tyre stints.

import { classifyMessage, type RaceEvent } from "./race-events";

const BASE = "https://api.jolpi.ca/ergast/f1";
const OPENF1 = "https://api.openf1.org/v1";

type AnyJson = Record<string, any>;

async function get<T>(url: string, attempt = 0, timeout = 12_000): Promise<T> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(timeout),
  });
  if (res.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
    return get<T>(url, attempt + 1, timeout);
  }
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return (await res.json()) as T;
}

/** Ergast paginates at 100 rows; merge Races across pages by round. */
async function getAllRaces(path: string, maxPages = 8): Promise<AnyJson[]> {
  const byRound = new Map<string, AnyJson>();
  let offset = 0;
  for (let page = 0; page < maxPages; page++) {
    const d = await get<AnyJson>(`${BASE}/${path}?format=json&limit=100&offset=${offset}`);
    const races: AnyJson[] = d.MRData?.RaceTable?.Races ?? [];
    for (const r of races) {
      const existing = byRound.get(r.round);
      if (!existing) {
        byRound.set(r.round, { ...r });
      } else {
        for (const key of ["Results", "QualifyingResults", "PitStops"]) {
          if (r[key]) existing[key] = [...(existing[key] ?? []), ...r[key]];
        }
      }
    }
    const total = Number(d.MRData?.total ?? 0);
    offset += 100;
    if (offset >= total) break;
  }
  return [...byRound.values()].sort((a, b) => Number(a.round) - Number(b.round));
}

/* ------------------------------ season stats ----------------------------- */

export interface RaceEntryStat {
  driverId: string;
  constructorId: string;
  position: number;
  grid: number;
  points: number;
  status: string;
  dnf: boolean;
  fastestLap: boolean;
  laps: number;
}

export interface DriverSeasonStat {
  driverId: string;
  constructorId: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
  entries: number;
  avgFinish: number;
  avgGrid: number;
  bestFinish: number;
  finishRate: number;
}

export interface TeamSeasonStat {
  constructorId: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
  entries: number;
  avgFinish: number;
  avgGrid: number;
  finishRate: number;
}

export interface RoundInfo {
  round: number;
  label: string;
  name: string;
  date: string;
}

export interface ProgressionPoint {
  round: number;
  label: string;
  values: Record<string, number>;
}

export interface SeasonStats {
  season: string;
  live: boolean;
  rounds: RoundInfo[];
  perRace: { round: number; label: string; entries: RaceEntryStat[] }[];
  drivers: Record<string, DriverSeasonStat>;
  teams: Record<string, TeamSeasonStat>;
  driverPoints: ProgressionPoint[];
  driverPositions: ProgressionPoint[];
  teamPoints: ProgressionPoint[];
}

function shortLabel(raceName: string) {
  return String(raceName)
    .replace(/ Grand Prix$/, "")
    .replace(/Grand Prix/, "")
    .trim()
    .slice(0, 12);
}

function isDnf(status: string) {
  const s = status.toLowerCase();
  if (s === "finished") return false;
  if (s.startsWith("+")) return false; // lapped but classified
  return true;
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export async function fetchSeasonStats(year: string): Promise<SeasonStats> {
  const results = await getAllRaces(`${year}/results/`);
  const qualifying = await getAllRaces(`${year}/qualifying/`).catch(() => [] as AnyJson[]);

  const season: string = String(results[0]?.season ?? year);
  const poleByRound: Record<string, string> = {};
  const gridFallback: Record<string, Record<string, number>> = {};
  for (const q of qualifying) {
    const list: AnyJson[] = q.QualifyingResults ?? [];
    const pole = list.find((x) => Number(x.position) === 1);
    if (pole) poleByRound[q.round] = pole.Driver.driverId;
    gridFallback[q.round] = Object.fromEntries(
      list.map((x) => [x.Driver.driverId, Number(x.position)]),
    );
  }

  const rounds: RoundInfo[] = [];
  const perRace: SeasonStats["perRace"] = [];

  for (const r of results) {
    const round = Number(r.round);
    const label = shortLabel(r.raceName);
    rounds.push({ round, label, name: r.raceName, date: r.date });

    const entries: RaceEntryStat[] = (r.Results ?? []).map((res: AnyJson) => {
      const driverId = res.Driver.driverId as string;
      const status = String(res.status ?? "");
      return {
        driverId,
        constructorId: res.Constructor.constructorId as string,
        position: Number(res.position ?? 0),
        grid: Number(res.grid ?? 0) || gridFallback[r.round]?.[driverId] || 0,
        points: Number(res.points ?? 0),
        status,
        dnf: isDnf(status),
        fastestLap: res.FastestLap?.rank === "1",
        laps: Number(res.laps ?? 0),
      };
    });
    perRace.push({ round, label, entries });
  }

  /* aggregates */
  const drivers: Record<string, DriverSeasonStat> = {};
  const teams: Record<string, TeamSeasonStat> = {};
  const finishes: Record<string, number[]> = {};
  const grids: Record<string, number[]> = {};
  const teamFinishes: Record<string, number[]> = {};
  const teamGrids: Record<string, number[]> = {};

  for (const race of perRace) {
    const poleDriver = poleByRound[String(race.round)];
    for (const e of race.entries) {
      const d = (drivers[e.driverId] ??= {
        driverId: e.driverId,
        constructorId: e.constructorId,
        points: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, dnfs: 0,
        entries: 0, avgFinish: 0, avgGrid: 0, bestFinish: 99, finishRate: 0,
      });
      const t = (teams[e.constructorId] ??= {
        constructorId: e.constructorId,
        points: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, dnfs: 0,
        entries: 0, avgFinish: 0, avgGrid: 0, finishRate: 0,
      });

      d.constructorId = e.constructorId;
      d.points += e.points;
      t.points += e.points;
      d.entries += 1;
      t.entries += 1;
      if (e.position === 1) { d.wins += 1; t.wins += 1; }
      if (e.position >= 1 && e.position <= 3) { d.podiums += 1; t.podiums += 1; }
      if (e.fastestLap) { d.fastestLaps += 1; t.fastestLaps += 1; }
      if (e.dnf) { d.dnfs += 1; t.dnfs += 1; }
      if (poleDriver === e.driverId) { d.poles += 1; t.poles += 1; }
      if (e.position > 0) {
        d.bestFinish = Math.min(d.bestFinish, e.position);
        (finishes[e.driverId] ??= []).push(e.position);
        (teamFinishes[e.constructorId] ??= []).push(e.position);
      }
      if (e.grid > 0) {
        (grids[e.driverId] ??= []).push(e.grid);
        (teamGrids[e.constructorId] ??= []).push(e.grid);
      }
    }
  }

  for (const d of Object.values(drivers)) {
    d.avgFinish = Number(mean(finishes[d.driverId] ?? []).toFixed(2));
    d.avgGrid = Number(mean(grids[d.driverId] ?? []).toFixed(2));
    d.finishRate = d.entries ? Number((((d.entries - d.dnfs) / d.entries) * 100).toFixed(1)) : 0;
    if (d.bestFinish === 99) d.bestFinish = 0;
  }
  for (const t of Object.values(teams)) {
    t.avgFinish = Number(mean(teamFinishes[t.constructorId] ?? []).toFixed(2));
    t.avgGrid = Number(mean(teamGrids[t.constructorId] ?? []).toFixed(2));
    t.finishRate = t.entries ? Number((((t.entries - t.dnfs) / t.entries) * 100).toFixed(1)) : 0;
  }

  /* progressions */
  const driverPoints: ProgressionPoint[] = [];
  const driverPositions: ProgressionPoint[] = [];
  const teamPoints: ProgressionPoint[] = [];
  const runningD: Record<string, number> = {};
  const runningT: Record<string, number> = {};

  for (const race of perRace) {
    for (const e of race.entries) {
      runningD[e.driverId] = (runningD[e.driverId] ?? 0) + e.points;
      runningT[e.constructorId] = (runningT[e.constructorId] ?? 0) + e.points;
    }
    driverPoints.push({ round: race.round, label: race.label, values: { ...runningD } });
    teamPoints.push({ round: race.round, label: race.label, values: { ...runningT } });

    const ordered = Object.entries(runningD).sort((a, b) => b[1] - a[1]);
    driverPositions.push({
      round: race.round,
      label: race.label,
      values: Object.fromEntries(ordered.map(([id], i) => [id, i + 1])),
    });
  }

  return {
    season,
    live: true,
    rounds,
    perRace,
    drivers,
    teams,
    driverPoints,
    driverPositions,
    teamPoints,
  };
}

/* ------------------------------ race detail ------------------------------ */

export interface PitStopRecord {
  driverId: string;
  lap: number;
  stop: number;
  duration: number;
  time: string;
}

export interface StintRecord {
  driverNumber: number;
  compound: string;
  lapStart: number;
  lapEnd: number;
}

export interface RaceResultRow {
  position: number;
  driverId: string;
  constructorId: string;
  grid: number;
  points: number;
  status: string;
  laps: number;
  time?: string;
}

export interface RaceDetail {
  season: string;
  round: number;
  hasData: boolean;
  eventsSource: "live" | "derived" | "none";
  events: RaceEvent[];
  pitStops: PitStopRecord[];
  stints: StintRecord[];
  results: RaceResultRow[];
  qualifying: { position: number; driverId: string; q1?: string; q2?: string; q3?: string }[];
}

async function openF1<T>(path: string): Promise<T | null> {
  try {
    return await get<T>(`${OPENF1}/${path}`, 0, 8_000);
  } catch {
    return null;
  }
}

async function fetchLiveEvents(season: string, raceDate: string): Promise<RaceEvent[]> {
  const sessions = await openF1<AnyJson[]>(`sessions?year=${season}&session_name=Race`);
  if (!sessions?.length) return [];
  const target = sessions.find((s) => String(s.date_start ?? "").slice(0, 10) === raceDate);
  if (!target) return [];
  const msgs = await openF1<AnyJson[]>(`race_control?session_key=${target.session_key}`);
  if (!msgs?.length) return [];
  return msgs
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((m, i) => ({
      id: `rc-${i}`,
      kind: classifyMessage(m),
      lap: m.lap_number ? Number(m.lap_number) : undefined,
      time: m.date,
      driverNumber: m.driver_number ? Number(m.driver_number) : undefined,
      title: String(m.category ?? "Race control"),
      message: String(m.message ?? ""),
    }));
}

async function fetchStints(season: string, raceDate: string): Promise<StintRecord[]> {
  const sessions = await openF1<AnyJson[]>(`sessions?year=${season}&session_name=Race`);
  const target = sessions?.find((s) => String(s.date_start ?? "").slice(0, 10) === raceDate);
  if (!target) return [];
  const stints = await openF1<AnyJson[]>(`stints?session_key=${target.session_key}`);
  if (!stints?.length) return [];
  return stints.map((s) => ({
    driverNumber: Number(s.driver_number),
    compound: String(s.compound ?? "UNKNOWN"),
    lapStart: Number(s.lap_start ?? 0),
    lapEnd: Number(s.lap_end ?? 0),
  }));
}

/** When live race-control isn't available, tell the race story from results. */
function deriveEvents(results: RaceResultRow[], pits: PitStopRecord[], fastest?: { driverId: string; lap: number; time: string }): RaceEvent[] {
  const events: RaceEvent[] = [
    { id: "d-start", kind: "start", lap: 1, title: "Lights out", message: "The race is underway." },
  ];

  for (const r of results) {
    if (r.status && isDnf(r.status)) {
      events.push({
        id: `d-dnf-${r.driverId}`,
        kind: "yellow",
        lap: r.laps,
        driverId: r.driverId,
        title: "Retirement",
        message: `Out of the race — ${r.status}.`,
      });
    }
  }

  for (const p of pits) {
    events.push({
      id: `d-pit-${p.driverId}-${p.stop}`,
      kind: "pit",
      lap: p.lap,
      time: p.time,
      driverId: p.driverId,
      title: `Pit stop ${p.stop}`,
      message: `Stationary ${p.duration.toFixed(2)}s.`,
    });
  }

  if (fastest) {
    events.push({
      id: "d-fl",
      kind: "fastest-lap",
      lap: fastest.lap,
      driverId: fastest.driverId,
      title: "Fastest lap",
      message: `${fastest.time} — fastest lap of the race.`,
    });
  }

  const winner = results.find((r) => r.position === 1);
  events.push({
    id: "d-chequered",
    kind: "chequered",
    lap: winner?.laps,
    driverId: winner?.driverId,
    title: "Chequered flag",
    message: winner ? "Takes the win." : "Race complete.",
  });

  return events.sort((a, b) => (a.lap ?? 0) - (b.lap ?? 0));
}

export async function fetchRaceDetail(year: string, round: number): Promise<RaceDetail> {
  const [resultsPayload, qualiPayload, pitsPayload] = [
    await get<AnyJson>(`${BASE}/${year}/${round}/results/?format=json&limit=100`).catch(() => null),
    await get<AnyJson>(`${BASE}/${year}/${round}/qualifying/?format=json&limit=100`).catch(() => null),
    await get<AnyJson>(`${BASE}/${year}/${round}/pitstops/?format=json&limit=100`).catch(() => null),
  ];

  const raceNode: AnyJson | undefined = resultsPayload?.MRData?.RaceTable?.Races?.[0];
  const season: string = String(
    raceNode?.season ?? resultsPayload?.MRData?.RaceTable?.season ?? new Date().getUTCFullYear(),
  );
  const raceDate: string = String(raceNode?.date ?? "");

  const results: RaceResultRow[] = (raceNode?.Results ?? []).map((r: AnyJson) => ({
    position: Number(r.position ?? 0),
    driverId: r.Driver.driverId,
    constructorId: r.Constructor.constructorId,
    grid: Number(r.grid ?? 0),
    points: Number(r.points ?? 0),
    status: String(r.status ?? ""),
    laps: Number(r.laps ?? 0),
    time: r.Time?.time,
  }));

  const fastestNode = (raceNode?.Results ?? []).find((r: AnyJson) => r.FastestLap?.rank === "1");
  const fastest = fastestNode
    ? {
        driverId: fastestNode.Driver.driverId as string,
        lap: Number(fastestNode.FastestLap.lap ?? 0),
        time: String(fastestNode.FastestLap.Time?.time ?? ""),
      }
    : undefined;

  const qualifying = ((qualiPayload?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults ?? []) as AnyJson[]).map(
    (q) => ({
      position: Number(q.position ?? 0),
      driverId: q.Driver.driverId as string,
      q1: q.Q1,
      q2: q.Q2,
      q3: q.Q3,
    }),
  );

  const pitStops: PitStopRecord[] = (
    (pitsPayload?.MRData?.RaceTable?.Races?.[0]?.PitStops ?? []) as AnyJson[]
  ).map((p) => ({
    driverId: p.driverId,
    lap: Number(p.lap ?? 0),
    stop: Number(p.stop ?? 0),
    duration: Number(p.duration ?? 0),
    time: String(p.time ?? ""),
  }));

  let events: RaceEvent[] = [];
  let eventsSource: RaceDetail["eventsSource"] = "none";
  let stints: StintRecord[] = [];

  if (raceDate) {
    events = await fetchLiveEvents(season, raceDate);
    if (events.length) eventsSource = "live";
    stints = await fetchStints(season, raceDate);
  }
  if (!events.length && results.length) {
    events = deriveEvents(results, pitStops, fastest);
    eventsSource = "derived";
  }

  return {
    season,
    round,
    hasData: results.length > 0 || events.length > 0,
    eventsSource,
    events,
    pitStops,
    stints,
    results,
    qualifying,
  };
}

/* --------------------------------- cache --------------------------------- */

const STATS_TTL = 15 * 60 * 1000;
const statsCache = new Map<string, { at: number; data: SeasonStats }>();

function ttlFor(year: string, live: number) {
  return Number(year) < new Date().getUTCFullYear() ? Infinity : live;
}

export async function getSeasonStatsCached(year: string): Promise<SeasonStats> {
  const hit = statsCache.get(year);
  if (hit && Date.now() - hit.at < ttlFor(year, STATS_TTL)) return hit.data;
  const data = await fetchSeasonStats(year);
  statsCache.set(year, { at: Date.now(), data });
  return data;
}

const RACE_TTL = 5 * 60 * 1000;
const raceCache = new Map<string, { at: number; data: RaceDetail }>();

export async function getRaceDetailCached(year: string, round: number): Promise<RaceDetail> {
  const key = `${year}:${round}`;
  const hit = raceCache.get(key);
  if (hit && Date.now() - hit.at < ttlFor(year, RACE_TTL)) return hit.data;
  const data = await fetchRaceDetail(year, round);
  raceCache.set(key, { at: Date.now(), data });
  return data;
}

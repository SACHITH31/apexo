// Live F1 data layer. Fetches Jolpica (Ergast-compatible) and transforms
// responses into Apexo's existing domain models so the UI is unchanged.

import {
  circuits as circuitMeta,
  type Circuit,
  type Driver,
  type Race,
  type Team,
} from "./mock-data";
import {
  CIRCUIT_ALIAS,
  DEFAULT_TEAM_META,
  DRIVER_CAREER,
  TEAM_META,
  flagForCountry,
  flagForNationality,
} from "./f1-static";

const BASE = "https://api.jolpi.ca/ergast/f1";

export interface SeasonData {
  season: string;
  live: boolean;
  teams: Record<string, Team>;
  drivers: Driver[];
  driversById: Record<string, Driver>;
  circuits: Record<string, Circuit>;
  races: Race[];
  racesById: Record<string, Race>;
  driverStandings: { position: number; driver: Driver }[];
  constructorStandings: { position: number; team: Team; points: number }[];
}

/* ------------------------------- fetching ------------------------------- */

async function get<T>(path: string, attempt = 0): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (res.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    return get<T>(path, attempt + 1);
  }
  if (!res.ok) throw new Error(`Jolpica ${path} -> ${res.status}`);
  return (await res.json()) as T;
}


type AnyJson = Record<string, any>;

/* ------------------------------ transforms ------------------------------ */

function iso(d?: { date?: string; time?: string }): string | undefined {
  if (!d?.date) return undefined;
  return `${d.date}T${d.time ?? "00:00:00Z"}`.replace(/Z?$/, (m) => (m ? m : "Z"));
}

function circuitFrom(api: AnyJson, season: number): Circuit {
  const rawId: string = api.circuitId;
  const metaId = CIRCUIT_ALIAS[rawId] ?? rawId;
  const meta = circuitMeta[metaId];
  const country: string = api.Location?.country ?? meta?.country ?? "";
  return {
    id: rawId,
    name: meta?.name ?? api.circuitName ?? rawId,
    location: api.Location?.locality ?? meta?.location ?? "",
    country,
    flag: flagForCountry(country),
    lengthKm: meta?.lengthKm ?? 5.0,
    laps: meta?.laps ?? 57,
    lapRecord: meta?.lapRecord ?? { time: "—", driver: "—", year: season },
    drsZones: meta?.drsZones ?? 2,
    firstGp: meta?.firstGp ?? season,
    notes: meta?.notes ?? `${api.circuitName ?? rawId} hosts a round of the ${season} Formula 1 World Championship.`,
  };
}

function teamFrom(constructorId: string, name: string): Team {
  const meta = TEAM_META[constructorId] ?? DEFAULT_TEAM_META;
  return {
    id: constructorId,
    name: meta.name ?? name,
    fullName: meta.fullName ?? name,
    base: meta.base,
    principal: meta.principal,
    color: meta.color,
    themeClass: meta.themeClass,
    championships: meta.championships,
    founded: meta.founded,
  };
}

function raceIdOf(season: string, round: string | number) {
  return `${season}-r${round}`;
}

/* --------------------------------- build -------------------------------- */

export async function fetchSeasonData(): Promise<SeasonData> {
  const [schedule, ds, cs] = await Promise.all([
    get<AnyJson>("current/races/?format=json&limit=100"),
    get<AnyJson>("current/driverstandings/?format=json&limit=100"),
    get<AnyJson>("current/constructorstandings/?format=json&limit=100"),
  ]);

  const season: string = schedule.MRData.RaceTable.season;
  const seasonNum = Number(season);
  const apiRaces: AnyJson[] = schedule.MRData.RaceTable.Races ?? [];

  const [p1, p2, p3, poles] = await Promise.all([
    get<AnyJson>("current/results/1/?format=json&limit=100").catch(() => null),
    get<AnyJson>("current/results/2/?format=json&limit=100").catch(() => null),
    get<AnyJson>("current/results/3/?format=json&limit=100").catch(() => null),
    get<AnyJson>("current/qualifying/1/?format=json&limit=100").catch(() => null),
  ]);

  const byRound = (payload: AnyJson | null, key: "Results" | "QualifyingResults") => {
    const map: Record<string, AnyJson> = {};
    for (const r of (payload?.MRData?.RaceTable?.Races ?? []) as AnyJson[]) {
      const entry = r[key]?.[0];
      if (entry) map[r.round] = entry;
    }
    return map;
  };
  const winners = byRound(p1, "Results");
  const seconds = byRound(p2, "Results");
  const thirds = byRound(p3, "Results");
  const poleByRound = byRound(poles, "QualifyingResults");

  /* teams */
  const standingsList = cs.MRData.StandingsTable.StandingsLists?.[0]?.ConstructorStandings ?? [];
  const teams: Record<string, Team> = {};
  for (const s of standingsList as AnyJson[]) {
    teams[s.Constructor.constructorId] = teamFrom(s.Constructor.constructorId, s.Constructor.name);
  }

  /* drivers */
  const driverStandingsApi = (ds.MRData.StandingsTable.StandingsLists?.[0]?.DriverStandings ?? []) as AnyJson[];
  const podiumCount: Record<string, number> = {};
  for (const map of [winners, seconds, thirds]) {
    for (const entry of Object.values(map)) {
      const id = entry.Driver?.driverId;
      if (id) podiumCount[id] = (podiumCount[id] ?? 0) + 1;
    }
  }

  const drivers: Driver[] = driverStandingsApi.map((s) => {
    const d = s.Driver as AnyJson;
    const constructor = (s.Constructors?.[s.Constructors.length - 1] ?? {}) as AnyJson;
    const teamId: string = constructor.constructorId ?? "unknown";
    if (!teams[teamId] && constructor.constructorId) {
      teams[teamId] = teamFrom(teamId, constructor.name);
    }
    const career = DRIVER_CAREER[d.driverId];
    const seasonWins = Number(s.wins ?? 0);
    const seasonPoints = Number(s.points ?? 0);
    return {
      id: d.driverId,
      code: d.code ?? d.familyName.slice(0, 3).toUpperCase(),
      number: Number(d.permanentNumber ?? 0),
      firstName: d.givenName,
      lastName: d.familyName,
      nationality: d.nationality,
      flag: flagForNationality(d.nationality),
      dob: d.dateOfBirth,
      team: teamId,
      championships: career?.championships ?? 0,
      wins: career?.wins ?? seasonWins,
      podiums: career?.podiums ?? (podiumCount[d.driverId] ?? 0),
      poles: career?.poles ?? 0,
      careerPoints: career?.careerPoints ?? seasonPoints,
      seasonPoints,
      seasonWins,
      seasonPodiums: podiumCount[d.driverId] ?? 0,
    };
  });

  const driversById = Object.fromEntries(drivers.map((d) => [d.id, d]));

  /* circuits + races */
  const circuits: Record<string, Circuit> = {};
  const now = Date.now();
  const races: Race[] = apiRaces.map((r) => {
    const circuit = circuitFrom(r.Circuit, seasonNum);
    circuits[circuit.id] = circuit;

    const raceIso = iso({ date: r.date, time: r.time })!;
    const winner = winners[r.round];
    const second = seconds[r.round];
    const third = thirds[r.round];
    const pole = poleByRound[r.round];
    const completed = Boolean(winner) || new Date(raceIso).getTime() + 3 * 3600_000 < now;
    const startedAt = new Date(raceIso).getTime();
    const live = !completed && now >= startedAt && now < startedAt + 3 * 3600_000;

    const podium: [string, string, string] | undefined =
      winner && second && third
        ? [winner.Driver.driverId, second.Driver.driverId, third.Driver.driverId]
        : undefined;

    const fastest = winner?.FastestLap;

    return {
      id: raceIdOf(season, r.round),
      round: Number(r.round),
      name: r.raceName.replace(/ Grand Prix$/, " GP"),
      officialName: `FORMULA 1 ${String(r.raceName).toUpperCase()} ${season}`,
      circuitId: circuit.id,
      hasSprint: Boolean(r.Sprint),
      status: live ? "live" : completed ? "completed" : "upcoming",
      sessions: {
        fp1: iso(r.FirstPractice),
        fp2: iso(r.SecondPractice),
        fp3: iso(r.ThirdPractice),
        sprintQuali: iso(r.SprintQualifying ?? r.SprintShootout),
        sprint: iso(r.Sprint),
        quali: iso(r.Qualifying) ?? raceIso,
        race: raceIso,
      },
      podium,
      poleId: pole?.Driver?.driverId,
      fastestLap: fastest?.Time?.time
        ? { driverId: winner.Driver.driverId, time: fastest.Time.time, lap: Number(fastest.lap ?? 0) }
        : undefined,
    };
  });

  const racesById = Object.fromEntries(races.map((r) => [r.id, r]));

  const driverStandings = drivers.map((d, i) => ({ position: i + 1, driver: d }));

  const constructorStandings = (standingsList as AnyJson[]).map((s, i) => ({
    position: Number(s.position ?? i + 1),
    team: teams[s.Constructor.constructorId]!,
    points: Number(s.points ?? 0),
  }));

  return {
    season,
    live: true,
    teams,
    drivers,
    driversById,
    circuits,
    races,
    racesById,
    driverStandings,
    constructorStandings,
  };
}

/* --------------------------- server-side cache --------------------------- */

const TTL = 10 * 60 * 1000;
let cache: { at: number; data: SeasonData } | null = null;

export async function getSeasonDataCached(): Promise<SeasonData> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  const data = await fetchSeasonData();
  cache = { at: Date.now(), data };
  return data;
}

// Circuit history layer: every grand prix ever held at a circuit (Jolpica /
// Ergast) plus archived race-day weather (Open-Meteo archive, keyless).

const BASE = "https://api.jolpi.ca/ergast/f1";
const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

export interface CircuitWinner {
  season: string;
  round: string;
  raceName: string;
  date: string;
  driver: string;
  driverId: string;
  constructorName: string;
  constructorId: string;
  grid: number;
  time: string | null;
  fastestLap: { time: string; lap: number } | null;
}

export interface RaceDayWeather {
  season: string;
  date: string;
  maxTempC: number;
  minTempC: number;
  rainMm: number;
  windKph: number;
}

export interface CircuitHistory {
  available: boolean;
  winners: CircuitWinner[];
  /** Fastest race lap per season, oldest first — the track's evolution curve. */
  lapProgression: { season: string; seconds: number; time: string; driver: string }[];
  weather: RaceDayWeather[];
  updatedAt: string;
}

const cache = new Map<string, { at: number; data: CircuitHistory }>();
const TTL = 6 * 60 * 60 * 1000;

async function json<T>(url: string, timeout = 12_000): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return (await res.json()) as T;
}

function toSeconds(t: string) {
  const m = t.match(/^(?:(\d+):)?(\d+)\.(\d+)$/);
  if (!m) return NaN;
  return Number(m[1] ?? 0) * 60 + Number(m[2]) + Number(`0.${m[3]}`);
}

export async function fetchCircuitHistory(input: {
  circuitId: string;
  lat?: number;
  lon?: number;
}): Promise<CircuitHistory> {
  const key = `v2|${input.circuitId}|${input.lat ?? ""}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const empty: CircuitHistory = {
    available: false,
    winners: [],
    lapProgression: [],
    weather: [],
    updatedAt: new Date().toISOString(),
  };

  let races: any[] = [];
  try {
    const d = await json<any>(
      `${BASE}/circuits/${encodeURIComponent(input.circuitId)}/results/1/?format=json&limit=100`,
    );
    races = d?.MRData?.RaceTable?.Races ?? [];
  } catch {
    cache.set(key, { at: Date.now(), data: empty });
    return empty;
  }

  const winners: CircuitWinner[] = races
    .map((r) => {
      const res = r.Results?.[0];
      if (!res) return null;
      return {
        season: String(r.season),
        round: String(r.round),
        raceName: String(r.raceName),
        date: String(r.date),
        driver: `${res.Driver?.givenName ?? ""} ${res.Driver?.familyName ?? ""}`.trim(),
        driverId: String(res.Driver?.driverId ?? ""),
        constructorName: String(res.Constructor?.name ?? ""),
        constructorId: String(res.Constructor?.constructorId ?? ""),
        grid: Number(res.grid ?? 0),
        time: res.Time?.time ? String(res.Time.time) : null,
        fastestLap: res.FastestLap?.Time?.time
          ? { time: String(res.FastestLap.Time.time), lap: Number(res.FastestLap.lap ?? 0) }
          : null,
      } as CircuitWinner;
    })
    .filter(Boolean) as CircuitWinner[];

  winners.sort((a, b) => Number(b.season) - Number(a.season));

  const lapProgression = winners
    .filter((w) => w.fastestLap)
    .map((w) => ({
      season: w.season,
      time: w.fastestLap!.time,
      seconds: toSeconds(w.fastestLap!.time),
      driver: w.driver,
    }))
    .filter((p) => Number.isFinite(p.seconds))
    .sort((a, b) => Number(a.season) - Number(b.season));

  // Archived race-day weather for the most recent editions.
  const weather: RaceDayWeather[] = [];
  if (input.lat != null && input.lon != null) {
    const recent = winners.slice(0, 6).filter((w) => w.date < new Date().toISOString().slice(0, 10));
    const results = await Promise.allSettled(
      recent.map((w) =>
        json<any>(
          `${ARCHIVE}?latitude=${input.lat}&longitude=${input.lon}&start_date=${w.date}&end_date=${w.date}` +
            `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=UTC`,
        ),
      ),
    );
    results.forEach((r, i) => {
      if (r.status !== "fulfilled") return;
      const d = r.value?.daily;
      if (!d?.time?.length) return;
      weather.push({
        season: recent[i].season,
        date: recent[i].date,
        maxTempC: Math.round(d.temperature_2m_max?.[0] ?? 0),
        minTempC: Math.round(d.temperature_2m_min?.[0] ?? 0),
        rainMm: Math.round((d.precipitation_sum?.[0] ?? 0) * 10) / 10,
        windKph: Math.round(d.wind_speed_10m_max?.[0] ?? 0),
      });
    });
    weather.sort((a, b) => Number(b.season) - Number(a.season));
  }

  const data: CircuitHistory = {
    available: winners.length > 0,
    winners,
    lapProgression,
    weather,
    updatedAt: new Date().toISOString(),
  };
  cache.set(key, { at: Date.now(), data });
  return data;
}

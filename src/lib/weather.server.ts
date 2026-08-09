// Race Weather Center data layer. Open-Meteo is keyless, CORS-free and
// forecasts ~16 days out, which covers a full grand prix weekend lead-in.

const BASE = "https://api.open-meteo.com/v1/forecast";

export interface WeatherSlice {
  /** ISO hour the reading applies to. */
  time: string;
  airTempC: number;
  /** Estimated from air temperature and solar radiation — no public feed exists. */
  trackTempC: number;
  humidity: number;
  windKph: number;
  rainChance: number;
  cloudCover: number;
  code: number;
}

export interface SessionForecast extends WeatherSlice {
  key: string;
  label: string;
}

export interface RaceWeather {
  available: boolean;
  /** Present only while the weekend is inside the forecast horizon. */
  current?: WeatherSlice;
  sessions: SessionForecast[];
  sunrise?: string;
  sunset?: string;
  updatedAt: string;
}

export const WEATHER_CODE: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Light showers",
  81: "Showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm, hail",
  99: "Thunderstorm, hail",
};

function trackTempFrom(air: number, radiation: number) {
  return Math.round((air + Math.min(24, radiation / 38)) * 10) / 10;
}

const cache = new Map<string, { at: number; data: RaceWeather }>();
const TTL = 20 * 60 * 1000;

export async function fetchRaceWeather(input: {
  lat: number;
  lon: number;
  sessions: { key: string; label: string; iso: string }[];
}): Promise<RaceWeather> {
  const key = `${input.lat},${input.lon},${input.sessions.map((s) => s.iso).join("|")}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const url =
    `${BASE}?latitude=${input.lat}&longitude=${input.lon}` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,weather_code,cloud_cover,shortwave_radiation` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code,cloud_cover` +
    `&daily=sunrise,sunset&timezone=UTC&forecast_days=16`;

  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`open-meteo -> ${res.status}`);
  const json = (await res.json()) as any;

  const times: string[] = json.hourly?.time ?? [];
  const idxOf = (iso: string) => {
    const target = new Date(iso).getTime();
    let best = -1;
    let bestDelta = Infinity;
    for (let i = 0; i < times.length; i++) {
      const delta = Math.abs(new Date(`${times[i]}Z`).getTime() - target);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = i;
      }
    }
    return bestDelta <= 3 * 3600_000 ? best : -1;
  };

  const sliceAt = (i: number, iso: string): WeatherSlice => ({
    time: iso,
    airTempC: Math.round((json.hourly.temperature_2m[i] ?? 0) * 10) / 10,
    trackTempC: trackTempFrom(json.hourly.temperature_2m[i] ?? 0, json.hourly.shortwave_radiation?.[i] ?? 0),
    humidity: Math.round(json.hourly.relative_humidity_2m?.[i] ?? 0),
    windKph: Math.round((json.hourly.wind_speed_10m?.[i] ?? 0) * 10) / 10,
    rainChance: Math.round(json.hourly.precipitation_probability?.[i] ?? 0),
    cloudCover: Math.round(json.hourly.cloud_cover?.[i] ?? 0),
    code: Number(json.hourly.weather_code?.[i] ?? 0),
  });

  const sessions: SessionForecast[] = [];
  for (const s of input.sessions) {
    const i = idxOf(s.iso);
    if (i >= 0) sessions.push({ key: s.key, label: s.label, ...sliceAt(i, s.iso) });
  }

  const raceIso = input.sessions.at(-1)?.iso;
  const day = raceIso ? String(raceIso).slice(0, 10) : undefined;
  const dayIdx = day ? (json.daily?.time ?? []).findIndex((d: string) => d === day) : -1;

  const c = json.current;
  const current: WeatherSlice | undefined = c
    ? {
        time: c.time ? `${c.time}Z` : new Date().toISOString(),
        airTempC: Math.round((c.temperature_2m ?? 0) * 10) / 10,
        trackTempC: trackTempFrom(c.temperature_2m ?? 0, (100 - (c.cloud_cover ?? 0)) * 8),
        humidity: Math.round(c.relative_humidity_2m ?? 0),
        windKph: Math.round((c.wind_speed_10m ?? 0) * 10) / 10,
        rainChance: (c.precipitation ?? 0) > 0 ? 100 : 0,
        cloudCover: Math.round(c.cloud_cover ?? 0),
        code: Number(c.weather_code ?? 0),
      }
    : undefined;

  const data: RaceWeather = {
    available: sessions.length > 0 || Boolean(current),
    current,
    sessions,
    sunrise: dayIdx >= 0 ? json.daily.sunrise?.[dayIdx] : undefined,
    sunset: dayIdx >= 0 ? json.daily.sunset?.[dayIdx] : undefined,
    updatedAt: new Date().toISOString(),
  };

  cache.set(key, { at: Date.now(), data });
  return data;
}

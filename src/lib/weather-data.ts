import { queryOptions, useQuery } from "@tanstack/react-query";
import type { RaceWeather } from "./weather.server";
import { getRaceWeather } from "./weather.functions";
import { geoFor } from "./circuit-geo";
import type { Race } from "./mock-data";

export type { RaceWeather };
export { WEATHER_CODE } from "./weather.server";

const EMPTY: RaceWeather = { available: false, sessions: [], updatedAt: "" };

export function weatherSessionsOf(race: Race) {
  return (
    [
      { key: "fp1", label: "Practice 1", iso: race.sessions.fp1 },
      { key: "fp2", label: "Practice 2", iso: race.sessions.fp2 },
      { key: "fp3", label: "Practice 3", iso: race.sessions.fp3 },
      { key: "sq", label: "Sprint Quali", iso: race.sessions.sprintQuali },
      { key: "sprint", label: "Sprint", iso: race.sessions.sprint },
      { key: "quali", label: "Qualifying", iso: race.sessions.quali },
      { key: "race", label: "Grand Prix", iso: race.sessions.race },
    ].filter((s) => Boolean(s.iso)) as { key: string; label: string; iso: string }[]
  );
}

export const raceWeatherQueryOptions = (
  circuitId: string,
  sessions: { key: string; label: string; iso: string }[],
) => {
  const geo = geoFor(circuitId);
  return queryOptions({
    queryKey: ["f1", "weather", circuitId, sessions.map((s) => s.iso).join("|")],
    enabled: Boolean(geo) && sessions.length > 0,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<RaceWeather> => {
      if (!geo) return EMPTY;
      try {
        return (await getRaceWeather({ data: { lat: geo.lat, lon: geo.lon, sessions } })) as RaceWeather;
      } catch {
        return EMPTY;
      }
    },
  });
};

/** Non-blocking weather read — the race page renders before it resolves. */
export function useRaceWeather(circuitId: string, sessions: { key: string; label: string; iso: string }[]) {
  return useQuery(raceWeatherQueryOptions(circuitId, sessions));
}

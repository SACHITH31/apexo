import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { RaceDetail, SeasonStats } from "./f1-extra.server";
import { getRaceDetail, getSeasonStats } from "./f1-extra.functions";
import { currentSeason, useSeasonSelection } from "./season";

export type { RaceDetail, SeasonStats };

const emptyStats = (season: string): SeasonStats => ({
  season,
  live: false,
  rounds: [],
  perRace: [],
  drivers: {},
  teams: {},
  driverPoints: [],
  driverPositions: [],
  teamPoints: [],
});

/** Season-wide analytics — shared by Statistics and both comparison pages. */
export const seasonStatsQueryOptions = (season: string = currentSeason()) =>
  queryOptions({
    queryKey: ["f1", "season-stats", season],
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<SeasonStats> => {
      try {
        return (await getSeasonStats({ data: { season } })) as SeasonStats;
      } catch {
        return emptyStats(season);
      }
    },
  });

export function useSeasonStats(override?: string): SeasonStats {
  const { season } = useSeasonSelection();
  return useSuspenseQuery(seasonStatsQueryOptions(override ?? season)).data;
}

export const raceDetailQueryOptions = (season: string, round: number) =>
  queryOptions({
    queryKey: ["f1", "race-detail", season, round],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<RaceDetail> => {
      try {
        return (await getRaceDetail({ data: { season, round } })) as RaceDetail;
      } catch {
        return {
          season,
          round,
          hasData: false,
          eventsSource: "none",
          events: [],
          pitStops: [],
          stints: [],
          results: [],
          qualifying: [],
        };
      }
    },
  });

/** Non-blocking: race pages render instantly, detail streams in. */
export function useRaceDetail(round: number, override?: string) {
  const { season } = useSeasonSelection();
  return useQuery(raceDetailQueryOptions(override ?? season, round));
}

import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { RaceDetail, SeasonStats } from "./f1-extra.server";
import { getRaceDetail, getSeasonStats } from "./f1-extra.functions";

export type { RaceDetail, SeasonStats };

const EMPTY_STATS: SeasonStats = {
  season: String(new Date().getUTCFullYear()),
  live: false,
  rounds: [],
  perRace: [],
  drivers: {},
  teams: {},
  driverPoints: [],
  driverPositions: [],
  teamPoints: [],
};

/** Season-wide analytics — shared by Statistics and both comparison pages. */
export const seasonStatsQueryOptions = () =>
  queryOptions({
    queryKey: ["f1", "season-stats"],
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<SeasonStats> => {
      try {
        return (await getSeasonStats()) as SeasonStats;
      } catch {
        return EMPTY_STATS;
      }
    },
  });

export function useSeasonStats(): SeasonStats {
  return useSuspenseQuery(seasonStatsQueryOptions()).data;
}

export const raceDetailQueryOptions = (round: number) =>
  queryOptions({
    queryKey: ["f1", "race-detail", round],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<RaceDetail> => {
      try {
        return (await getRaceDetail({ data: { round } })) as RaceDetail;
      } catch {
        return {
          season: String(new Date().getUTCFullYear()),
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
export function useRaceDetail(round: number) {
  return useQuery(raceDetailQueryOptions(round));
}

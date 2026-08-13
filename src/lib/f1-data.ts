import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { SeasonData } from "./f1.server";
import { getSeasonData } from "./f1.functions";
import { mockSeasonData } from "./f1-fallback";
import { currentSeason, useSeasonSelection } from "./season";

export type { SeasonData };

export const seasonQueryOptions = (season: string = currentSeason()) =>
  queryOptions({
    queryKey: ["f1", "season", season],
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<SeasonData> => {
      try {
        return (await getSeasonData({ data: { season } })) as SeasonData;
      } catch {
        return { ...mockSeasonData(), season };
      }
    },
  });

/**
 * Season data for the globally selected season. Pass `override` to read a
 * specific season (deep-linked race pages) regardless of the selection.
 */
export function useSeason(override?: string): SeasonData {
  const { season } = useSeasonSelection();
  return useSuspenseQuery(seasonQueryOptions(override ?? season)).data;
}

/** Resolve a team by id with a safe fallback for unknown constructors. */
export function teamOf(data: SeasonData, id: string) {
  return (
    data.teams[id] ?? {
      id,
      name: id.replace(/_/g, " "),
      fullName: id.replace(/_/g, " "),
      base: "—",
      principal: "—",
      color: "#8A8F98",
      themeClass: "theme-haas",
      championships: 0,
      founded: new Date().getUTCFullYear(),
    }
  );
}

export function getNextRaceFrom(data: SeasonData) {
  const now = Date.now();
  return (
    data.races.find((r) => r.status === "live") ??
    data.races.find((r) => new Date(r.sessions.race).getTime() > now) ??
    data.races[data.races.length - 1]
  );
}

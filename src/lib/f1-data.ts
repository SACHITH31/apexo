import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { SeasonData } from "./f1.server";
import { getSeasonData } from "./f1.functions";
import { mockSeasonData } from "./f1-fallback";

export type { SeasonData };

export const seasonQueryOptions = () =>
  queryOptions({
    queryKey: ["f1", "season"],
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<SeasonData> => {
      try {
        return (await getSeasonData()) as SeasonData;
      } catch {
        return mockSeasonData();
      }
    },
  });

/** Season data for the current F1 season, live with local fallback. */
export function useSeason(): SeasonData {
  return useSuspenseQuery(seasonQueryOptions()).data;
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

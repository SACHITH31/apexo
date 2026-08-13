import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSeasons } from "./f1.functions";

const STORAGE_KEY = "apexo:season";

/** Always the real calendar year — never hardcode a season anywhere. */
export function currentSeason(): string {
  return String(new Date().getFullYear());
}

interface SeasonCtx {
  season: string;
  setSeason: (s: string) => void;
  isCurrent: boolean;
}

const Ctx = createContext<SeasonCtx | null>(null);

export function SeasonProvider({ children }: { children: ReactNode }) {
  // SSR and first paint always use the current year so hydration matches;
  // a stored preference is applied right after mount.
  const [season, setSeasonState] = useState(currentSeason);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && /^\d{4}$/.test(stored)) setSeasonState(stored);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setSeason = useCallback((s: string) => {
    setSeasonState(s);
    try {
      if (s === currentSeason()) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<SeasonCtx>(
    () => ({ season, setSeason, isCurrent: season === currentSeason() }),
    [season, setSeason],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Globally selected season. Falls back to the current year outside a provider. */
export function useSeasonSelection(): SeasonCtx {
  return (
    useContext(Ctx) ?? {
      season: currentSeason(),
      setSeason: () => {},
      isCurrent: true,
    }
  );
}

export const seasonsQueryOptions = () =>
  queryOptions({
    queryKey: ["f1", "seasons"],
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<string[]> => {
      try {
        const list = (await getSeasons()) as string[];
        return list.length ? list : [];
      } catch {
        return [];
      }
    },
  });

function localSeasons(): string[] {
  const year = new Date().getFullYear();
  return Array.from({ length: year - 1949 }, (_, i) => String(year - i));
}

/** Available seasons, newest first — dynamic with a generated fallback. */
export function useAvailableSeasons(): string[] {
  const q = useQuery(seasonsQueryOptions());
  const { season } = useSeasonSelection();
  return useMemo(() => {
    const base = q.data?.length ? q.data : localSeasons();
    const set = new Set(base);
    set.add(currentSeason());
    set.add(season);
    return [...set].sort((a, b) => Number(b) - Number(a));
  }, [q.data, season]);
}

/** Race ids are `${season}-r${round}` — deep links stay season-correct. */
export function seasonOfRaceId(raceId: string): string | undefined {
  const m = /^(\d{4})-r\d+$/.exec(raceId);
  return m?.[1];
}

import { useCallback, useEffect, useState } from "react";

/**
 * Season Story bookmarks + resume position.
 * Stored locally per season so the timeline can be picked up where it was left.
 */
const KEY = (season: string | number) => `apexo:story-bookmarks:${season}`;
const RESUME_KEY = (season: string | number) => `apexo:story-resume:${season}`;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — bookmarks stay in memory for this session */
  }
}

export function useStoryBookmarks(season: string | number) {
  const [rounds, setRounds] = useState<number[]>([]);
  const [resume, setResumeState] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRounds(read<number[]>(KEY(season), []));
    setResumeState(read<number | null>(RESUME_KEY(season), null));
    setHydrated(true);
  }, [season]);

  const toggle = useCallback(
    (round: number) => {
      setRounds((list) => {
        const next = list.includes(round) ? list.filter((r) => r !== round) : [...list, round].sort((a, b) => a - b);
        write(KEY(season), next);
        return next;
      });
    },
    [season],
  );

  const clear = useCallback(() => {
    setRounds([]);
    write(KEY(season), []);
  }, [season]);

  const setResume = useCallback(
    (round: number | null) => {
      setResumeState(round);
      write(RESUME_KEY(season), round);
    },
    [season],
  );

  return {
    hydrated,
    bookmarks: rounds,
    isBookmarked: (round: number) => rounds.includes(round),
    toggle,
    clear,
    resume,
    setResume,
  };
}

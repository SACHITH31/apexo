import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { teams, type TeamId } from "./mock-data";

const STORAGE_KEY = "apexo.favoriteTeam";

interface Ctx {
  favoriteTeam: TeamId;
  setFavoriteTeam: (t: TeamId) => void;
}

const ThemeCtx = createContext<Ctx>({ favoriteTeam: "ferrari", setFavoriteTeam: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [favoriteTeam, setFavoriteTeamState] = useState<TeamId>("ferrari");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as TeamId | null;
    if (stored && teams[stored]) setFavoriteTeamState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    // remove any prior team class
    Object.values(teams).forEach((t) => root.classList.remove(t.themeClass));
    root.classList.add(teams[favoriteTeam].themeClass);
  }, [favoriteTeam]);

  const setFavoriteTeam = (t: TeamId) => {
    setFavoriteTeamState(t);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, t);
  };

  return <ThemeCtx.Provider value={{ favoriteTeam, setFavoriteTeam }}>{children}</ThemeCtx.Provider>;
}

export const useTeamTheme = () => useContext(ThemeCtx);

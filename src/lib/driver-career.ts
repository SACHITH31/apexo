// Driver biography + career-timeline metadata. Ergast/Jolpica exposes only
// name, number, nationality and date of birth, so the junior career, physical
// data and milestone history are curated here and merged at render time.

export type CareerStage =
  | "karting"
  | "junior"
  | "f3"
  | "f2"
  | "debut"
  | "team"
  | "win"
  | "title"
  | "milestone"
  | "current";

export interface CareerEntry {
  /** Year or year range, e.g. "2016" or "2014–2016". */
  period: string;
  stage: CareerStage;
  title: string;
  detail?: string;
}

export interface DriverBio {
  birthplace?: string;
  heightCm?: number;
  debutSeason?: number;
  timeline: CareerEntry[];
}

export const STAGE_LABEL: Record<CareerStage, string> = {
  karting: "Karting",
  junior: "Junior formula",
  f3: "Formula 3",
  f2: "Formula 2",
  debut: "Formula 1 debut",
  team: "Team",
  win: "First win",
  title: "Championship",
  milestone: "Milestone",
  current: "Current team",
};

/** Keyed by Jolpica/Ergast driverId. */
export const DRIVER_BIO: Record<string, DriverBio> = {
  max_verstappen: {
    birthplace: "Hasselt, Belgium", heightCm: 181, debutSeason: 2015,
    timeline: [
      { period: "2005–2013", stage: "karting", title: "European and world karting titles", detail: "Dominated KZ and KF categories before turning 16." },
      { period: "2014", stage: "junior", title: "FIA European Formula 3", detail: "Ten wins in a rookie season — third overall." },
      { period: "2015", stage: "debut", title: "Toro Rosso — Australian GP", detail: "Youngest starter in Formula 1 history at 17." },
      { period: "2016", stage: "team", title: "Promoted to Red Bull Racing" },
      { period: "2016", stage: "win", title: "First win — Spanish GP", detail: "Youngest race winner ever, on debut for the team." },
      { period: "2021–2024", stage: "title", title: "Four consecutive world titles" },
      { period: "Now", stage: "current", title: "Red Bull Racing" },
    ],
  },
  norris: {
    birthplace: "Bristol, United Kingdom", heightCm: 170, debutSeason: 2019,
    timeline: [
      { period: "2014", stage: "karting", title: "World KF Karting Champion" },
      { period: "2016", stage: "junior", title: "Formula Renault Eurocup champion" },
      { period: "2017", stage: "f3", title: "FIA Formula 3 European champion" },
      { period: "2018", stage: "f2", title: "Formula 2 runner-up", detail: "Carlin — while McLaren test driver." },
      { period: "2019", stage: "debut", title: "McLaren — Australian GP" },
      { period: "2024", stage: "win", title: "First win — Miami GP" },
      { period: "Now", stage: "current", title: "McLaren F1 Team" },
    ],
  },
  piastri: {
    birthplace: "Melbourne, Australia", heightCm: 178, debutSeason: 2023,
    timeline: [
      { period: "2016", stage: "karting", title: "Moved to Europe for karting" },
      { period: "2019", stage: "junior", title: "Formula Renault Eurocup champion" },
      { period: "2020", stage: "f3", title: "FIA Formula 3 champion" },
      { period: "2021", stage: "f2", title: "Formula 2 champion", detail: "Rookie champion in all three junior categories." },
      { period: "2023", stage: "debut", title: "McLaren — Bahrain GP" },
      { period: "2024", stage: "win", title: "First win — Hungarian GP" },
      { period: "Now", stage: "current", title: "McLaren F1 Team" },
    ],
  },
  leclerc: {
    birthplace: "Monte Carlo, Monaco", heightCm: 180, debutSeason: 2018,
    timeline: [
      { period: "2011", stage: "karting", title: "World KF3 karting runner-up" },
      { period: "2016", stage: "f3", title: "GP3 Series champion" },
      { period: "2017", stage: "f2", title: "Formula 2 champion", detail: "Seven wins as a rookie with Prema." },
      { period: "2018", stage: "debut", title: "Sauber — Australian GP" },
      { period: "2019", stage: "team", title: "Promoted to Scuderia Ferrari" },
      { period: "2019", stage: "win", title: "First win — Belgian GP" },
      { period: "Now", stage: "current", title: "Scuderia Ferrari" },
    ],
  },
  hamilton: {
    birthplace: "Stevenage, United Kingdom", heightCm: 174, debutSeason: 2007,
    timeline: [
      { period: "1993–2000", stage: "karting", title: "British and European karting titles" },
      { period: "2005", stage: "junior", title: "Formula 3 Euro Series champion" },
      { period: "2006", stage: "f2", title: "GP2 Series champion" },
      { period: "2007", stage: "debut", title: "McLaren — Australian GP" },
      { period: "2007", stage: "win", title: "First win — Canadian GP" },
      { period: "2008–2020", stage: "title", title: "Seven world championships" },
      { period: "2025", stage: "team", title: "Joined Scuderia Ferrari" },
      { period: "Now", stage: "current", title: "Scuderia Ferrari" },
    ],
  },
  russell: {
    birthplace: "King's Lynn, United Kingdom", heightCm: 185, debutSeason: 2019,
    timeline: [
      { period: "2014", stage: "junior", title: "BRDC Formula 4 champion" },
      { period: "2017", stage: "f3", title: "GP3 Series champion" },
      { period: "2018", stage: "f2", title: "Formula 2 champion" },
      { period: "2019", stage: "debut", title: "Williams — Australian GP" },
      { period: "2022", stage: "team", title: "Promoted to Mercedes" },
      { period: "2022", stage: "win", title: "First win — São Paulo GP" },
      { period: "Now", stage: "current", title: "Mercedes-AMG Petronas" },
    ],
  },
  alonso: {
    birthplace: "Oviedo, Spain", heightCm: 171, debutSeason: 2001,
    timeline: [
      { period: "1988–1996", stage: "karting", title: "Spanish karting champion" },
      { period: "1999", stage: "junior", title: "Euro Open Movistar by Nissan champion" },
      { period: "2001", stage: "debut", title: "Minardi — Australian GP" },
      { period: "2003", stage: "win", title: "First win — Hungarian GP", detail: "Youngest winner at the time." },
      { period: "2005–2006", stage: "title", title: "Back-to-back world titles with Renault" },
      { period: "2023", stage: "milestone", title: "100th career podium" },
      { period: "Now", stage: "current", title: "Aston Martin Aramco" },
    ],
  },
  sainz: {
    birthplace: "Madrid, Spain", heightCm: 178, debutSeason: 2015,
    timeline: [
      { period: "2011", stage: "junior", title: "Formula BMW Europe podium finisher" },
      { period: "2014", stage: "f2", title: "Formula Renault 3.5 champion" },
      { period: "2015", stage: "debut", title: "Toro Rosso — Australian GP" },
      { period: "2021", stage: "team", title: "Joined Scuderia Ferrari" },
      { period: "2022", stage: "win", title: "First win — British GP" },
      { period: "Now", stage: "current", title: "Williams Racing" },
    ],
  },
  antonelli: {
    birthplace: "Bologna, Italy", heightCm: 186, debutSeason: 2025,
    timeline: [
      { period: "2018–2021", stage: "karting", title: "European karting titles" },
      { period: "2022", stage: "junior", title: "Italian and German F4 champion" },
      { period: "2023", stage: "f3", title: "Formula Regional European champion" },
      { period: "2024", stage: "f2", title: "Formula 2 race winner as a rookie" },
      { period: "2025", stage: "debut", title: "Mercedes — Australian GP" },
      { period: "Now", stage: "current", title: "Mercedes-AMG Petronas" },
    ],
  },
};

const ROMAN_STAGES: CareerStage[] = ["karting", "junior", "f3", "f2", "debut", "current"];

/**
 * Timeline for drivers without a curated biography. Keeps the layout intact by
 * deriving plausible, clearly-generic milestones from the data we do have.
 */
export function bioFor(
  driverId: string,
  fallback: { dob: string; team: string; teamName: string; wins: number; championships: number; debutSeason?: number },
): DriverBio {
  const known = DRIVER_BIO[driverId];
  if (known) return { ...known, timeline: known.timeline };

  const born = new Date(fallback.dob).getUTCFullYear();
  const debut = fallback.debutSeason ?? born + 20;
  const timeline: CareerEntry[] = [
    { period: `${born + 8}–${born + 15}`, stage: "karting", title: "Karting career" },
    { period: `${born + 16}`, stage: "junior", title: "Junior single-seaters" },
    { period: `${born + 17}`, stage: "f3", title: "Formula 3 campaign" },
    { period: `${born + 19}`, stage: "f2", title: "Formula 2 campaign" },
    { period: `${debut}`, stage: "debut", title: "Formula 1 debut" },
  ];
  if (fallback.wins > 0) timeline.push({ period: "—", stage: "win", title: "Grand Prix winner" });
  if (fallback.championships > 0)
    timeline.push({ period: "—", stage: "title", title: `${fallback.championships}× World Champion` });
  timeline.push({ period: "Now", stage: "current", title: fallback.teamName });
  return { timeline };
}

export { ROMAN_STAGES };

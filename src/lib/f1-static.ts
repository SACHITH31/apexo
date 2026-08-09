// Static, slow-changing metadata used to enrich live API data.
// The live API (Jolpica/Ergast) does not expose liveries, team bases,
// circuit lengths, lap records, or career totals — these fill the gaps.

import type { Team } from "./mock-data";

export type TeamMeta = Omit<Team, "id" | "name" | "fullName"> & {
  name?: string;
  fullName?: string;
};

/** Keyed by Ergast/Jolpica constructorId. */
export const TEAM_META: Record<string, TeamMeta> = {
  ferrari:      { base: "Maranello, Italy",     principal: "Frédéric Vasseur", color: "#DC0000", themeClass: "theme-ferrari",  championships: 16, founded: 1950, fullName: "Scuderia Ferrari" },
  mclaren:      { base: "Woking, UK",           principal: "Andrea Stella",    color: "#FF8000", themeClass: "theme-mclaren",  championships: 9,  founded: 1966, fullName: "McLaren F1 Team" },
  mercedes:     { base: "Brackley, UK",         principal: "Toto Wolff",       color: "#27F4D2", themeClass: "theme-mercedes", championships: 8,  founded: 1954, fullName: "Mercedes-AMG Petronas F1 Team" },
  red_bull:     { base: "Milton Keynes, UK",    principal: "Laurent Mekies",   color: "#3671C6", themeClass: "theme-redbull",  championships: 6,  founded: 2005, fullName: "Oracle Red Bull Racing" },
  aston_martin: { base: "Silverstone, UK",      principal: "Andy Cowell",      color: "#229971", themeClass: "theme-aston",    championships: 0,  founded: 2021, fullName: "Aston Martin Aramco F1 Team" },
  alpine:       { base: "Enstone, UK",          principal: "Steve Nielsen",    color: "#0093CC", themeClass: "theme-alpine",   championships: 2,  founded: 2021, fullName: "BWT Alpine F1 Team" },
  williams:     { base: "Grove, UK",            principal: "James Vowles",     color: "#64C4FF", themeClass: "theme-williams", championships: 9,  founded: 1977, fullName: "Williams Racing" },
  haas:         { base: "Kannapolis, USA",      principal: "Ayao Komatsu",     color: "#B6BABD", themeClass: "theme-haas",     championships: 0,  founded: 2016, fullName: "MoneyGram Haas F1 Team" },
  sauber:       { base: "Hinwil, Switzerland",  principal: "Jonathan Wheatley", color: "#52E252", themeClass: "theme-sauber",  championships: 0,  founded: 1993, fullName: "Stake F1 Team Kick Sauber" },
  audi:         { base: "Hinwil, Switzerland",  principal: "Jonathan Wheatley", color: "#BB0A30", themeClass: "theme-audi",    championships: 0,  founded: 2026, fullName: "Audi F1 Team" },
  rb:           { base: "Faenza, Italy",        principal: "Alan Permane",     color: "#6692FF", themeClass: "theme-rb",       championships: 0,  founded: 2006, fullName: "Visa Cash App Racing Bulls" },
  racing_bulls: { base: "Faenza, Italy",        principal: "Alan Permane",     color: "#6692FF", themeClass: "theme-rb",       championships: 0,  founded: 2006, fullName: "Visa Cash App Racing Bulls" },
  cadillac:     { base: "Fishers, USA",         principal: "Graeme Lowdon",    color: "#C9A227", themeClass: "theme-cadillac", championships: 0,  founded: 2026, fullName: "Cadillac Formula 1 Team" },
};

export const DEFAULT_TEAM_META: TeamMeta = {
  base: "—",
  principal: "—",
  color: "#8A8F98",
  themeClass: "theme-haas",
  championships: 0,
  founded: new Date().getUTCFullYear(),
};

/** Jolpica circuitId -> id used by the local circuit metadata table. */
export const CIRCUIT_ALIAS: Record<string, string> = {
  americas: "cota",
  vegas: "las_vegas",
  losail: "losail",
  rodriguez: "rodriguez",
};

/** Career totals the standings endpoint cannot provide. Keyed by driverId. */
export const DRIVER_CAREER: Record<string, { championships: number; wins: number; podiums: number; poles: number; careerPoints: number }> = {
  max_verstappen: { championships: 4, wins: 65, podiums: 117, poles: 44, careerPoints: 3210 },
  hamilton:       { championships: 7, wins: 105, podiums: 202, poles: 104, careerPoints: 4900 },
  alonso:         { championships: 2, wins: 32, podiums: 106, poles: 22, careerPoints: 2350 },
  norris:         { championships: 1, wins: 11, podiums: 45, poles: 15, careerPoints: 1420 },
  leclerc:        { championships: 0, wins: 8, podiums: 48, poles: 27, careerPoints: 1560 },
  russell:        { championships: 0, wins: 6, podiums: 25, poles: 8, careerPoints: 890 },
  piastri:        { championships: 0, wins: 9, podiums: 27, poles: 6, careerPoints: 890 },
  sainz:          { championships: 0, wins: 4, podiums: 29, poles: 7, careerPoints: 1300 },
  antonelli:      { championships: 0, wins: 1, podiums: 6, poles: 2, careerPoints: 200 },
  gasly:          { championships: 0, wins: 1, podiums: 5, poles: 0, careerPoints: 470 },
  stroll:         { championships: 0, wins: 0, podiums: 3, poles: 1, careerPoints: 310 },
  albon:          { championships: 0, wins: 0, podiums: 2, poles: 0, careerPoints: 300 },
  hulkenberg:     { championships: 0, wins: 0, podiums: 1, poles: 1, careerPoints: 640 },
  ocon:           { championships: 0, wins: 1, podiums: 4, poles: 0, careerPoints: 480 },
  tsunoda:        { championships: 0, wins: 0, podiums: 0, poles: 0, careerPoints: 120 },
  bearman:        { championships: 0, wins: 0, podiums: 1, poles: 0, careerPoints: 60 },
  lawson:         { championships: 0, wins: 0, podiums: 0, poles: 0, careerPoints: 50 },
  colapinto:      { championships: 0, wins: 0, podiums: 0, poles: 0, careerPoints: 30 },
  bortoleto:      { championships: 0, wins: 0, podiums: 1, poles: 0, careerPoints: 40 },
  hadjar:         { championships: 0, wins: 0, podiums: 1, poles: 0, careerPoints: 60 },
};

const COUNTRY_FLAG: Record<string, string> = {
  australia: "🇦🇺", austria: "🇦🇹", azerbaijan: "🇦🇿", bahrain: "🇧🇭", belgium: "🇧🇪",
  brazil: "🇧🇷", canada: "🇨🇦", china: "🇨🇳", france: "🇫🇷", germany: "🇩🇪",
  hungary: "🇭🇺", india: "🇮🇳", italy: "🇮🇹", japan: "🇯🇵", korea: "🇰🇷",
  malaysia: "🇲🇾", mexico: "🇲🇽", monaco: "🇲🇨", morocco: "🇲🇦", netherlands: "🇳🇱",
  portugal: "🇵🇹", qatar: "🇶🇦", russia: "🇷🇺", "saudi arabia": "🇸🇦", singapore: "🇸🇬",
  spain: "🇪🇸", sweden: "🇸🇪", switzerland: "🇨🇭", turkey: "🇹🇷", uae: "🇦🇪",
  "united arab emirates": "🇦🇪", uk: "🇬🇧", "united kingdom": "🇬🇧", usa: "🇺🇸",
  "united states": "🇺🇸", argentina: "🇦🇷", thailand: "🇹🇭", "new zealand": "🇳🇿",
  finland: "🇫🇮", denmark: "🇩🇰", poland: "🇵🇱", "south africa": "🇿🇦", vietnam: "🇻🇳",
  indonesia: "🇮🇩", ireland: "🇮🇪", colombia: "🇨🇴", venezuela: "🇻🇪", chile: "🇨🇱",
  israel: "🇮🇱", estonia: "🇪🇪", "czech republic": "🇨🇿", "united states of america": "🇺🇸",
};

const NATIONALITY_COUNTRY: Record<string, string> = {
  dutch: "netherlands", british: "uk", monegasque: "monaco", monégasque: "monaco",
  australian: "australia", spanish: "spain", italian: "italy", german: "germany",
  french: "france", canadian: "canada", thai: "thailand", japanese: "japan",
  "new zealander": "new zealand", argentine: "argentina", argentinian: "argentina",
  brazilian: "brazil", american: "usa", mexican: "mexico", finnish: "finland",
  danish: "denmark", chinese: "china", swiss: "switzerland", austrian: "austria",
  belgian: "belgium", polish: "poland", russian: "russia", "south african": "south africa",
  irish: "ireland", swedish: "sweden", indian: "india", colombian: "colombia",
  venezuelan: "venezuela", israeli: "israel", estonian: "estonia", czech: "czech republic",
  portuguese: "portugal",
};

export function flagForCountry(country: string): string {
  return COUNTRY_FLAG[country.trim().toLowerCase()] ?? "🏁";
}

export function flagForNationality(nationality: string): string {
  const country = NATIONALITY_COUNTRY[nationality.trim().toLowerCase()];
  return country ? flagForCountry(country) : "🏁";
}

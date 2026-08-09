import type { SeasonData } from "./f1.server";
import {
  circuits,
  constructorStandings,
  driverStandings,
  drivers,
  driversById,
  races,
  racesById,
  teams,
} from "./mock-data";

/** Offline / API-outage fallback built from the bundled local dataset. */
export function mockSeasonData(): SeasonData {
  return {
    season: String(new Date(races[0].sessions.race).getUTCFullYear()),
    live: false,
    teams,
    drivers,
    driversById,
    circuits,
    races,
    racesById,
    driverStandings,
    constructorStandings,
  };
}

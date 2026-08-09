// Team Garage metadata. The timing APIs expose none of this — factory address,
// technical leadership, power unit, chassis name or all-time records — so it
// lives here and is merged into the live constructor data at render time.

export interface GarageMeta {
  factory: string;
  country: string;
  technicalDirector: string;
  powerUnit: string;
  engineSupplier: string;
  chassis: string;
  carName: string;
  reserveDriver?: string;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  /** Seasons the constructor won the Constructors' Championship. */
  titleYears: number[];
}

/** Keyed by Jolpica/Ergast constructorId. */
export const TEAM_GARAGE: Record<string, GarageMeta> = {
  ferrari: {
    factory: "Maranello", country: "Italy",
    technicalDirector: "Loïc Serra", powerUnit: "Ferrari 066/12", engineSupplier: "Ferrari",
    chassis: "SF-25", carName: "SF-25", reserveDriver: "Antonio Giovinazzi",
    wins: 248, podiums: 818, poles: 253, fastestLaps: 262,
    titleYears: [1961, 1964, 1975, 1976, 1977, 1979, 1982, 1983, 1999, 2000, 2001, 2002, 2003, 2004, 2007, 2008],
  },
  mclaren: {
    factory: "Woking", country: "United Kingdom",
    technicalDirector: "Peter Prodromou", powerUnit: "Mercedes-AMG F1 M16", engineSupplier: "Mercedes",
    chassis: "MCL39", carName: "MCL39", reserveDriver: "Pato O'Ward",
    wins: 197, podiums: 535, poles: 168, fastestLaps: 170,
    titleYears: [1974, 1984, 1985, 1988, 1989, 1990, 1991, 1998, 2024, 2025],
  },
  mercedes: {
    factory: "Brackley", country: "United Kingdom",
    technicalDirector: "James Allison", powerUnit: "Mercedes-AMG F1 M16", engineSupplier: "Mercedes",
    chassis: "W16", carName: "W16", reserveDriver: "Frederik Vesti",
    wins: 129, podiums: 300, poles: 141, fastestLaps: 106,
    titleYears: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
  },
  red_bull: {
    factory: "Milton Keynes", country: "United Kingdom",
    technicalDirector: "Pierre Waché", powerUnit: "Honda RBPT H002", engineSupplier: "Honda RBPT",
    chassis: "RB21", carName: "RB21", reserveDriver: "Ayumu Iwasa",
    wins: 124, podiums: 292, poles: 104, fastestLaps: 100,
    titleYears: [2010, 2011, 2012, 2013, 2022, 2023],
  },
  aston_martin: {
    factory: "Silverstone", country: "United Kingdom",
    technicalDirector: "Enrico Cardile", powerUnit: "Mercedes-AMG F1 M16", engineSupplier: "Mercedes",
    chassis: "AMR25", carName: "AMR25", reserveDriver: "Felipe Drugovich",
    wins: 0, podiums: 9, poles: 1, fastestLaps: 3,
    titleYears: [],
  },
  alpine: {
    factory: "Enstone", country: "United Kingdom",
    technicalDirector: "David Sanchez", powerUnit: "Renault E-Tech RE25", engineSupplier: "Renault",
    chassis: "A525", carName: "A525", reserveDriver: "Paul Aron",
    wins: 1, podiums: 6, poles: 0, fastestLaps: 3,
    titleYears: [],
  },
  williams: {
    factory: "Grove", country: "United Kingdom",
    technicalDirector: "Pat Fry", powerUnit: "Mercedes-AMG F1 M16", engineSupplier: "Mercedes",
    chassis: "FW47", carName: "FW47", reserveDriver: "Luke Browning",
    wins: 114, podiums: 313, poles: 128, fastestLaps: 133,
    titleYears: [1980, 1981, 1986, 1987, 1992, 1993, 1994, 1996, 1997],
  },
  haas: {
    factory: "Kannapolis", country: "United States",
    technicalDirector: "Andrea De Zordo", powerUnit: "Ferrari 066/12", engineSupplier: "Ferrari",
    chassis: "VF-25", carName: "VF-25", reserveDriver: "Ryō Hirakawa",
    wins: 0, podiums: 0, poles: 1, fastestLaps: 3,
    titleYears: [],
  },
  sauber: {
    factory: "Hinwil", country: "Switzerland",
    technicalDirector: "James Key", powerUnit: "Ferrari 066/12", engineSupplier: "Ferrari",
    chassis: "C45", carName: "C45", reserveDriver: "Zane Maloney",
    wins: 1, podiums: 27, poles: 1, fastestLaps: 6,
    titleYears: [],
  },
  audi: {
    factory: "Hinwil", country: "Switzerland",
    technicalDirector: "Mattia Binotto", powerUnit: "Audi F1 Power Unit", engineSupplier: "Audi",
    chassis: "R26", carName: "R26", reserveDriver: "Zane Maloney",
    wins: 0, podiums: 0, poles: 0, fastestLaps: 0,
    titleYears: [],
  },
  rb: {
    factory: "Faenza", country: "Italy",
    technicalDirector: "Tim Goss", powerUnit: "Honda RBPT H002", engineSupplier: "Honda RBPT",
    chassis: "VCARB 02", carName: "VCARB 02", reserveDriver: "Ayumu Iwasa",
    wins: 2, podiums: 5, poles: 1, fastestLaps: 4,
    titleYears: [],
  },
  racing_bulls: {
    factory: "Faenza", country: "Italy",
    technicalDirector: "Tim Goss", powerUnit: "Honda RBPT H002", engineSupplier: "Honda RBPT",
    chassis: "VCARB 02", carName: "VCARB 02", reserveDriver: "Ayumu Iwasa",
    wins: 2, podiums: 5, poles: 1, fastestLaps: 4,
    titleYears: [],
  },
  cadillac: {
    factory: "Fishers, Indiana", country: "United States",
    technicalDirector: "Nick Chester", powerUnit: "Ferrari 066/12", engineSupplier: "Ferrari",
    chassis: "C01", carName: "C01",
    wins: 0, podiums: 0, poles: 0, fastestLaps: 0,
    titleYears: [],
  },
};

export const DEFAULT_GARAGE: GarageMeta = {
  factory: "—",
  country: "—",
  technicalDirector: "—",
  powerUnit: "—",
  engineSupplier: "—",
  chassis: "—",
  carName: "—",
  wins: 0,
  podiums: 0,
  poles: 0,
  fastestLaps: 0,
  titleYears: [],
};

export function garageFor(constructorId: string, base?: string): GarageMeta {
  const known = TEAM_GARAGE[constructorId];
  if (known) return known;
  const [factory, country] = (base ?? "—, —").split(",").map((s) => s.trim());
  return { ...DEFAULT_GARAGE, factory: factory || "—", country: country || "—" };
}

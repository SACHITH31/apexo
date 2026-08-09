// Mock F1 2025 season data. Replaced later by Jolpica/OpenF1 sync.

export type TeamId =
  | "ferrari" | "mclaren" | "mercedes" | "redbull" | "aston" | "alpine"
  | "williams" | "haas" | "sauber" | "rb";

export interface Team {
  id: string;
  name: string;
  fullName: string;
  base: string;
  principal: string;
  color: string; // hex for chart lines / badges
  themeClass: string;
  championships: number;
  founded: number;
}

export const teams: Record<string, Team> = {
  ferrari:  { id: "ferrari",  name: "Ferrari",       fullName: "Scuderia Ferrari HP",         base: "Maranello, Italy",     principal: "Frédéric Vasseur", color: "#DC0000", themeClass: "theme-ferrari",  championships: 16, founded: 1950 },
  mclaren:  { id: "mclaren",  name: "McLaren",       fullName: "McLaren F1 Team",             base: "Woking, UK",           principal: "Andrea Stella",    color: "#FF8000", themeClass: "theme-mclaren",  championships: 9,  founded: 1966 },
  mercedes: { id: "mercedes", name: "Mercedes",      fullName: "Mercedes-AMG Petronas",       base: "Brackley, UK",         principal: "Toto Wolff",       color: "#27F4D2", themeClass: "theme-mercedes", championships: 8,  founded: 1954 },
  redbull:  { id: "redbull",  name: "Red Bull",      fullName: "Oracle Red Bull Racing",      base: "Milton Keynes, UK",    principal: "Christian Horner", color: "#3671C6", themeClass: "theme-redbull",  championships: 6,  founded: 2005 },
  aston:    { id: "aston",    name: "Aston Martin",  fullName: "Aston Martin Aramco F1 Team", base: "Silverstone, UK",      principal: "Andy Cowell",      color: "#229971", themeClass: "theme-aston",    championships: 0,  founded: 2021 },
  alpine:   { id: "alpine",   name: "Alpine",        fullName: "BWT Alpine F1 Team",          base: "Enstone, UK",          principal: "Oliver Oakes",     color: "#0093CC", themeClass: "theme-alpine",   championships: 2,  founded: 2021 },
  williams: { id: "williams", name: "Williams",      fullName: "Williams Racing",             base: "Grove, UK",            principal: "James Vowles",     color: "#64C4FF", themeClass: "theme-williams", championships: 9,  founded: 1977 },
  haas:     { id: "haas",     name: "Haas",          fullName: "MoneyGram Haas F1 Team",      base: "Kannapolis, USA",      principal: "Ayao Komatsu",     color: "#B6BABD", themeClass: "theme-haas",     championships: 0,  founded: 2016 },
  sauber:   { id: "sauber",   name: "Kick Sauber",   fullName: "Stake F1 Team Kick Sauber",   base: "Hinwil, Switzerland",  principal: "Alessandro Alunni Bravi", color: "#52E252", themeClass: "theme-sauber", championships: 0, founded: 1993 },
  rb:       { id: "rb",       name: "RB",            fullName: "Visa Cash App RB",            base: "Faenza, Italy",        principal: "Laurent Mekies",   color: "#6692FF", themeClass: "theme-rb",       championships: 0,  founded: 2006 },
};

export interface Driver {
  id: string;
  code: string; // 3-letter
  number: number;
  firstName: string;
  lastName: string;
  nationality: string;
  flag: string;
  dob: string;
  team: string;
  championships: number;
  wins: number;
  podiums: number;
  poles: number;
  careerPoints: number;
  seasonPoints: number;
  seasonWins: number;
  seasonPodiums: number;
}

export const drivers: Driver[] = [
  { id: "verstappen", code: "VER", number: 1,  firstName: "Max",       lastName: "Verstappen", nationality: "Dutch",       flag: "🇳🇱", dob: "1997-09-30", team: "redbull",  championships: 4, wins: 63, podiums: 112, poles: 40, careerPoints: 3023, seasonPoints: 385, seasonWins: 8, seasonPodiums: 14 },
  { id: "norris",     code: "NOR", number: 4,  firstName: "Lando",     lastName: "Norris",     nationality: "British",     flag: "🇬🇧", dob: "1999-11-13", team: "mclaren",  championships: 0, wins: 5,  podiums: 30,  poles: 8,  careerPoints: 971,  seasonPoints: 374, seasonWins: 4, seasonPodiums: 13 },
  { id: "leclerc",    code: "LEC", number: 16, firstName: "Charles",   lastName: "Leclerc",    nationality: "Monégasque",  flag: "🇲🇨", dob: "1997-10-16", team: "ferrari",  championships: 0, wins: 8,  podiums: 43,  poles: 26, careerPoints: 1385, seasonPoints: 356, seasonWins: 3, seasonPodiums: 12 },
  { id: "piastri",    code: "PIA", number: 81, firstName: "Oscar",     lastName: "Piastri",    nationality: "Australian",  flag: "🇦🇺", dob: "2001-04-06", team: "mclaren",  championships: 0, wins: 2,  podiums: 15,  poles: 3,  careerPoints: 542,  seasonPoints: 342, seasonWins: 2, seasonPodiums: 11 },
  { id: "sainz",      code: "SAI", number: 55, firstName: "Carlos",    lastName: "Sainz",      nationality: "Spanish",     flag: "🇪🇸", dob: "1994-09-01", team: "williams", championships: 0, wins: 4,  podiums: 27,  poles: 6,  careerPoints: 1230, seasonPoints: 168, seasonWins: 0, seasonPodiums: 3  },
  { id: "hamilton",   code: "HAM", number: 44, firstName: "Lewis",     lastName: "Hamilton",   nationality: "British",     flag: "🇬🇧", dob: "1985-01-07", team: "ferrari",  championships: 7, wins: 105, podiums: 202, poles: 104, careerPoints: 4839, seasonPoints: 223, seasonWins: 1, seasonPodiums: 5 },
  { id: "russell",    code: "RUS", number: 63, firstName: "George",    lastName: "Russell",    nationality: "British",     flag: "🇬🇧", dob: "1998-02-15", team: "mercedes", championships: 0, wins: 3,  podiums: 17,  poles: 5,  careerPoints: 623,  seasonPoints: 245, seasonWins: 2, seasonPodiums: 6  },
  { id: "antonelli",  code: "ANT", number: 12, firstName: "Kimi",      lastName: "Antonelli",  nationality: "Italian",     flag: "🇮🇹", dob: "2006-08-25", team: "mercedes", championships: 0, wins: 0,  podiums: 2,   poles: 1,  careerPoints: 78,   seasonPoints: 78,  seasonWins: 0, seasonPodiums: 2  },
  { id: "alonso",     code: "ALO", number: 14, firstName: "Fernando",  lastName: "Alonso",     nationality: "Spanish",     flag: "🇪🇸", dob: "1981-07-29", team: "aston",    championships: 2, wins: 32, podiums: 106, poles: 22, careerPoints: 2331, seasonPoints: 62,  seasonWins: 0, seasonPodiums: 0  },
  { id: "stroll",     code: "STR", number: 18, firstName: "Lance",     lastName: "Stroll",     nationality: "Canadian",    flag: "🇨🇦", dob: "1998-10-29", team: "aston",    championships: 0, wins: 0,  podiums: 3,   poles: 1,  careerPoints: 289,  seasonPoints: 24,  seasonWins: 0, seasonPodiums: 0  },
  { id: "gasly",      code: "GAS", number: 10, firstName: "Pierre",    lastName: "Gasly",      nationality: "French",      flag: "🇫🇷", dob: "1996-02-07", team: "alpine",   championships: 0, wins: 1,  podiums: 5,   poles: 0,  careerPoints: 421,  seasonPoints: 42,  seasonWins: 0, seasonPodiums: 0  },
  { id: "doohan",     code: "DOO", number: 7,  firstName: "Jack",      lastName: "Doohan",     nationality: "Australian",  flag: "🇦🇺", dob: "2003-01-20", team: "alpine",   championships: 0, wins: 0,  podiums: 0,   poles: 0,  careerPoints: 12,   seasonPoints: 12,  seasonWins: 0, seasonPodiums: 0  },
  { id: "albon",      code: "ALB", number: 23, firstName: "Alex",      lastName: "Albon",      nationality: "Thai",        flag: "🇹🇭", dob: "1996-03-23", team: "williams", championships: 0, wins: 0,  podiums: 2,   poles: 0,  careerPoints: 268,  seasonPoints: 68,  seasonWins: 0, seasonPodiums: 0  },
  { id: "hulkenberg", code: "HUL", number: 27, firstName: "Nico",      lastName: "Hülkenberg", nationality: "German",      flag: "🇩🇪", dob: "1987-08-19", team: "sauber",   championships: 0, wins: 0,  podiums: 1,   poles: 1,  careerPoints: 597,  seasonPoints: 40,  seasonWins: 0, seasonPodiums: 1  },
  { id: "bortoleto",  code: "BOR", number: 5,  firstName: "Gabriel",   lastName: "Bortoleto",  nationality: "Brazilian",   flag: "🇧🇷", dob: "2004-10-14", team: "sauber",   championships: 0, wins: 0,  podiums: 0,   poles: 0,  careerPoints: 8,    seasonPoints: 8,   seasonWins: 0, seasonPodiums: 0  },
  { id: "ocon",       code: "OCO", number: 31, firstName: "Esteban",   lastName: "Ocon",       nationality: "French",      flag: "🇫🇷", dob: "1996-09-17", team: "haas",     championships: 0, wins: 1,  podiums: 3,   poles: 0,  careerPoints: 462,  seasonPoints: 28,  seasonWins: 0, seasonPodiums: 0  },
  { id: "bearman",    code: "BEA", number: 87, firstName: "Ollie",     lastName: "Bearman",    nationality: "British",     flag: "🇬🇧", dob: "2005-05-08", team: "haas",     championships: 0, wins: 0,  podiums: 0,   poles: 0,  careerPoints: 14,   seasonPoints: 14,  seasonWins: 0, seasonPodiums: 0  },
  { id: "tsunoda",    code: "TSU", number: 22, firstName: "Yuki",      lastName: "Tsunoda",    nationality: "Japanese",    flag: "🇯🇵", dob: "2000-05-11", team: "rb",       championships: 0, wins: 0,  podiums: 0,   poles: 0,  careerPoints: 82,   seasonPoints: 34,  seasonWins: 0, seasonPodiums: 0  },
  { id: "lawson",     code: "LAW", number: 30, firstName: "Liam",      lastName: "Lawson",     nationality: "New Zealander", flag: "🇳🇿", dob: "2002-02-11", team: "rb",     championships: 0, wins: 0,  podiums: 0,   poles: 0,  careerPoints: 10,   seasonPoints: 10,  seasonWins: 0, seasonPodiums: 0  },
  { id: "colapinto",  code: "COL", number: 43, firstName: "Franco",    lastName: "Colapinto", nationality: "Argentine",    flag: "🇦🇷", dob: "2003-05-27", team: "alpine",   championships: 0, wins: 0,  podiums: 0,   poles: 0,  careerPoints: 5,    seasonPoints: 5,   seasonWins: 0, seasonPodiums: 0  },
];

export const driversById: Record<string, Driver> = Object.fromEntries(drivers.map((d) => [d.id, d]));

export interface Circuit {
  id: string;
  name: string;
  location: string;
  country: string;
  flag: string;
  lengthKm: number;
  laps: number;
  lapRecord: { time: string; driver: string; year: number };
  drsZones: number;
  firstGp: number;
  notes: string;
}

export const circuits: Record<string, Circuit> = {
  albert_park:   { id: "albert_park",   name: "Albert Park",             location: "Melbourne",    country: "Australia",    flag: "🇦🇺", lengthKm: 5.278, laps: 58, lapRecord: { time: "1:19.813", driver: "Charles Leclerc", year: 2024 }, drsZones: 4, firstGp: 1996, notes: "Street-park hybrid circuit around Albert Park Lake." },
  shanghai:      { id: "shanghai",      name: "Shanghai International",  location: "Shanghai",     country: "China",        flag: "🇨🇳", lengthKm: 5.451, laps: 56, lapRecord: { time: "1:32.238", driver: "Michael Schumacher", year: 2004 }, drsZones: 2, firstGp: 2004, notes: "Iconic snail-shaped Turn 1-2-3 complex." },
  suzuka:        { id: "suzuka",        name: "Suzuka",                  location: "Suzuka",       country: "Japan",        flag: "🇯🇵", lengthKm: 5.807, laps: 53, lapRecord: { time: "1:30.983", driver: "Lewis Hamilton", year: 2019 }, drsZones: 2, firstGp: 1987, notes: "Only figure-8 layout on the calendar." },
  bahrain:       { id: "bahrain",       name: "Bahrain International",   location: "Sakhir",       country: "Bahrain",      flag: "🇧🇭", lengthKm: 5.412, laps: 57, lapRecord: { time: "1:31.447", driver: "Pedro de la Rosa", year: 2005 }, drsZones: 3, firstGp: 2004, notes: "Desert night race under floodlights." },
  jeddah:        { id: "jeddah",        name: "Jeddah Corniche",         location: "Jeddah",       country: "Saudi Arabia", flag: "🇸🇦", lengthKm: 6.174, laps: 50, lapRecord: { time: "1:30.734", driver: "Lewis Hamilton", year: 2021 }, drsZones: 3, firstGp: 2021, notes: "Fastest street circuit on the calendar." },
  miami:         { id: "miami",         name: "Miami International",     location: "Miami",        country: "USA",          flag: "🇺🇸", lengthKm: 5.412, laps: 57, lapRecord: { time: "1:29.708", driver: "Max Verstappen", year: 2023 }, drsZones: 3, firstGp: 2022, notes: "Purpose-built ribbon around Hard Rock Stadium." },
  imola:         { id: "imola",         name: "Imola",                   location: "Imola",        country: "Italy",        flag: "🇮🇹", lengthKm: 4.909, laps: 63, lapRecord: { time: "1:15.484", driver: "Lewis Hamilton", year: 2020 }, drsZones: 2, firstGp: 1980, notes: "Classic Italian anti-clockwise circuit." },
  monaco:        { id: "monaco",        name: "Circuit de Monaco",       location: "Monte Carlo",  country: "Monaco",       flag: "🇲🇨", lengthKm: 3.337, laps: 78, lapRecord: { time: "1:12.909", driver: "Lewis Hamilton", year: 2021 }, drsZones: 1, firstGp: 1950, notes: "The crown jewel — street circuit through the principality." },
  catalunya:     { id: "catalunya",     name: "Barcelona-Catalunya",     location: "Barcelona",    country: "Spain",        flag: "🇪🇸", lengthKm: 4.657, laps: 66, lapRecord: { time: "1:16.330", driver: "Max Verstappen", year: 2023 }, drsZones: 2, firstGp: 1991, notes: "The team's second home — reference-lap track." },
  villeneuve:    { id: "villeneuve",    name: "Circuit Gilles Villeneuve", location: "Montréal",  country: "Canada",       flag: "🇨🇦", lengthKm: 4.361, laps: 70, lapRecord: { time: "1:13.078", driver: "Valtteri Bottas", year: 2019 }, drsZones: 3, firstGp: 1978, notes: "Wall of Champions demands zero mistakes." },
  red_bull_ring: { id: "red_bull_ring", name: "Red Bull Ring",           location: "Spielberg",    country: "Austria",      flag: "🇦🇹", lengthKm: 4.318, laps: 71, lapRecord: { time: "1:05.619", driver: "Carlos Sainz", year: 2020 }, drsZones: 3, firstGp: 1970, notes: "Elevation-heavy Styrian mountain track." },
  silverstone:   { id: "silverstone",   name: "Silverstone",             location: "Silverstone",  country: "UK",           flag: "🇬🇧", lengthKm: 5.891, laps: 52, lapRecord: { time: "1:27.097", driver: "Max Verstappen", year: 2020 }, drsZones: 2, firstGp: 1950, notes: "Home of the first-ever World Championship race." },
  spa:           { id: "spa",           name: "Spa-Francorchamps",       location: "Stavelot",     country: "Belgium",      flag: "🇧🇪", lengthKm: 7.004, laps: 44, lapRecord: { time: "1:44.701", driver: "Sergio Pérez", year: 2024 }, drsZones: 2, firstGp: 1950, notes: "Eau Rouge–Raidillon: the greatest corner in motorsport." },
  hungaroring:   { id: "hungaroring",   name: "Hungaroring",             location: "Budapest",     country: "Hungary",      flag: "🇭🇺", lengthKm: 4.381, laps: 70, lapRecord: { time: "1:16.627", driver: "Lewis Hamilton", year: 2020 }, drsZones: 1, firstGp: 1986, notes: "Twisty 'Monaco without the walls'." },
  zandvoort:     { id: "zandvoort",     name: "Zandvoort",               location: "Zandvoort",    country: "Netherlands",  flag: "🇳🇱", lengthKm: 4.259, laps: 72, lapRecord: { time: "1:11.097", driver: "Lewis Hamilton", year: 2021 }, drsZones: 2, firstGp: 1952, notes: "Banked Hugenholtz and Arie Luyendyk corners." },
  monza:         { id: "monza",         name: "Autodromo Nazionale Monza", location: "Monza",     country: "Italy",        flag: "🇮🇹", lengthKm: 5.793, laps: 53, lapRecord: { time: "1:21.046", driver: "Rubens Barrichello", year: 2004 }, drsZones: 2, firstGp: 1950, notes: "Temple of Speed — the Tifosi's cathedral." },
  baku:          { id: "baku",          name: "Baku City Circuit",       location: "Baku",         country: "Azerbaijan",   flag: "🇦🇿", lengthKm: 6.003, laps: 51, lapRecord: { time: "1:43.009", driver: "Charles Leclerc", year: 2019 }, drsZones: 2, firstGp: 2016, notes: "Longest full-throttle section on the calendar." },
  marina_bay:    { id: "marina_bay",    name: "Marina Bay",              location: "Singapore",    country: "Singapore",    flag: "🇸🇬", lengthKm: 4.940, laps: 62, lapRecord: { time: "1:35.867", driver: "Daniel Ricciardo", year: 2024 }, drsZones: 3, firstGp: 2008, notes: "F1's original night street race." },
  cota:          { id: "cota",          name: "Circuit of the Americas", location: "Austin",       country: "USA",          flag: "🇺🇸", lengthKm: 5.513, laps: 56, lapRecord: { time: "1:36.169", driver: "Charles Leclerc", year: 2019 }, drsZones: 2, firstGp: 2012, notes: "Iconic uphill Turn 1 and esses inspired by Suzuka." },
  rodriguez:     { id: "rodriguez",     name: "Autódromo Hermanos Rodríguez", location: "Mexico City", country: "Mexico",   flag: "🇲🇽", lengthKm: 4.304, laps: 71, lapRecord: { time: "1:17.774", driver: "Valtteri Bottas", year: 2021 }, drsZones: 3, firstGp: 1963, notes: "High-altitude circuit ending inside a baseball stadium." },
  interlagos:    { id: "interlagos",    name: "Interlagos",              location: "São Paulo",    country: "Brazil",       flag: "🇧🇷", lengthKm: 4.309, laps: 71, lapRecord: { time: "1:10.540", driver: "Valtteri Bottas", year: 2018 }, drsZones: 2, firstGp: 1973, notes: "Home of Senna — anti-clockwise, always dramatic." },
  las_vegas:     { id: "las_vegas",     name: "Las Vegas Strip",         location: "Las Vegas",    country: "USA",          flag: "🇺🇸", lengthKm: 6.201, laps: 50, lapRecord: { time: "1:34.876", driver: "Lando Norris", year: 2024 }, drsZones: 2, firstGp: 2023, notes: "Night race down the Vegas Strip." },
  losail:        { id: "losail",        name: "Lusail International",    location: "Lusail",       country: "Qatar",        flag: "🇶🇦", lengthKm: 5.419, laps: 57, lapRecord: { time: "1:22.384", driver: "Lando Norris", year: 2024 }, drsZones: 1, firstGp: 2021, notes: "Fast, flowing desert circuit." },
  yas_marina:    { id: "yas_marina",    name: "Yas Marina",              location: "Abu Dhabi",    country: "UAE",          flag: "🇦🇪", lengthKm: 5.281, laps: 58, lapRecord: { time: "1:26.103", driver: "Max Verstappen", year: 2021 }, drsZones: 2, firstGp: 2009, notes: "Season finale under twilight lights." },
};

export interface Race {
  id: string;
  round: number;
  name: string;
  officialName: string;
  circuitId: string;
  hasSprint: boolean;
  status: "completed" | "upcoming" | "live";
  sessions: {
    fp1?: string; fp2?: string; fp3?: string;
    sprintQuali?: string; sprint?: string;
    quali: string; race: string;
  };
  podium?: [string, string, string]; // driver ids
  poleId?: string;
  fastestLap?: { driverId: string; time: string; lap: number };
  fastestPit?: { team: TeamId; seconds: number };
}

// 2025 calendar — 24 rounds. Dates are ISO UTC.
export const races: Race[] = [
  { id: "2025-australia",   round: 1,  name: "Australian GP",   officialName: "FORMULA 1 LOUIS VUITTON AUSTRALIAN GRAND PRIX 2025", circuitId: "albert_park", hasSprint: false, status: "completed", sessions: { fp1:"2025-03-14T01:30:00Z", fp2:"2025-03-14T05:00:00Z", fp3:"2025-03-15T01:30:00Z", quali:"2025-03-15T05:00:00Z", race:"2025-03-16T04:00:00Z" }, podium:["norris","verstappen","russell"], poleId:"norris", fastestLap:{ driverId:"norris", time:"1:22.167", lap:56 }, fastestPit:{ team:"mclaren", seconds:2.31 } },
  { id: "2025-china",       round: 2,  name: "Chinese GP",       officialName: "FORMULA 1 HEINEKEN CHINESE GRAND PRIX 2025",       circuitId: "shanghai",    hasSprint: true,  status: "completed", sessions: { fp1:"2025-03-21T03:30:00Z", sprintQuali:"2025-03-21T07:30:00Z", sprint:"2025-03-22T03:00:00Z", quali:"2025-03-22T07:00:00Z", race:"2025-03-23T07:00:00Z" }, podium:["piastri","norris","russell"], poleId:"piastri", fastestLap:{ driverId:"leclerc", time:"1:35.454", lap:52 }, fastestPit:{ team:"mclaren", seconds:2.28 } },
  { id: "2025-japan",       round: 3,  name: "Japanese GP",      officialName: "FORMULA 1 LENOVO JAPANESE GRAND PRIX 2025",        circuitId: "suzuka",      hasSprint: false, status: "completed", sessions: { fp1:"2025-04-04T02:30:00Z", fp2:"2025-04-04T06:00:00Z", fp3:"2025-04-05T02:30:00Z", quali:"2025-04-05T06:00:00Z", race:"2025-04-06T05:00:00Z" }, podium:["verstappen","norris","piastri"], poleId:"verstappen", fastestLap:{ driverId:"norris", time:"1:30.983", lap:47 }, fastestPit:{ team:"redbull", seconds:2.22 } },
  { id: "2025-bahrain",     round: 4,  name: "Bahrain GP",       officialName: "FORMULA 1 GULF AIR BAHRAIN GRAND PRIX 2025",       circuitId: "bahrain",     hasSprint: false, status: "completed", sessions: { fp1:"2025-04-11T11:30:00Z", fp2:"2025-04-11T15:00:00Z", fp3:"2025-04-12T12:30:00Z", quali:"2025-04-12T16:00:00Z", race:"2025-04-13T15:00:00Z" }, podium:["piastri","russell","norris"], poleId:"piastri", fastestLap:{ driverId:"piastri", time:"1:33.019", lap:54 }, fastestPit:{ team:"mclaren", seconds:2.19 } },
  { id: "2025-saudi",       round: 5,  name: "Saudi Arabian GP", officialName: "FORMULA 1 STC SAUDI ARABIAN GRAND PRIX 2025",      circuitId: "jeddah",      hasSprint: false, status: "completed", sessions: { fp1:"2025-04-18T13:30:00Z", fp2:"2025-04-18T17:00:00Z", fp3:"2025-04-19T13:30:00Z", quali:"2025-04-19T17:00:00Z", race:"2025-04-20T17:00:00Z" }, podium:["piastri","verstappen","leclerc"], poleId:"verstappen", fastestLap:{ driverId:"norris", time:"1:31.778", lap:49 }, fastestPit:{ team:"ferrari", seconds:2.14 } },
  { id: "2025-miami",       round: 6,  name: "Miami GP",         officialName: "FORMULA 1 CRYPTO.COM MIAMI GRAND PRIX 2025",       circuitId: "miami",       hasSprint: true,  status: "completed", sessions: { fp1:"2025-05-02T16:30:00Z", sprintQuali:"2025-05-02T20:30:00Z", sprint:"2025-05-03T16:00:00Z", quali:"2025-05-03T20:00:00Z", race:"2025-05-04T20:00:00Z" }, podium:["piastri","norris","russell"], poleId:"verstappen", fastestLap:{ driverId:"antonelli", time:"1:29.708", lap:55 }, fastestPit:{ team:"mclaren", seconds:2.11 } },
  { id: "2025-imola",       round: 7,  name: "Emilia-Romagna GP", officialName: "FORMULA 1 AWS GRAN PREMIO DEL MADE IN ITALY 2025", circuitId: "imola",       hasSprint: false, status: "completed", sessions: { fp1:"2025-05-16T11:30:00Z", fp2:"2025-05-16T15:00:00Z", fp3:"2025-05-17T10:30:00Z", quali:"2025-05-17T14:00:00Z", race:"2025-05-18T13:00:00Z" }, podium:["verstappen","norris","piastri"], poleId:"piastri", fastestLap:{ driverId:"hamilton", time:"1:17.988", lap:60 }, fastestPit:{ team:"redbull", seconds:2.18 } },
  { id: "2025-monaco",      round: 8,  name: "Monaco GP",        officialName: "FORMULA 1 TAG HEUER GRAND PRIX DE MONACO 2025",    circuitId: "monaco",      hasSprint: false, status: "completed", sessions: { fp1:"2025-05-23T11:30:00Z", fp2:"2025-05-23T15:00:00Z", fp3:"2025-05-24T10:30:00Z", quali:"2025-05-24T14:00:00Z", race:"2025-05-25T13:00:00Z" }, podium:["norris","leclerc","piastri"], poleId:"norris", fastestLap:{ driverId:"hamilton", time:"1:14.481", lap:72 }, fastestPit:{ team:"ferrari", seconds:2.24 } },
  { id: "2025-spain",       round: 9,  name: "Spanish GP",       officialName: "FORMULA 1 ARAMCO GRAN PREMIO DE ESPAÑA 2025",      circuitId: "catalunya",   hasSprint: false, status: "completed", sessions: { fp1:"2025-05-30T11:30:00Z", fp2:"2025-05-30T15:00:00Z", fp3:"2025-05-31T10:30:00Z", quali:"2025-05-31T14:00:00Z", race:"2025-06-01T13:00:00Z" }, podium:["piastri","norris","leclerc"], poleId:"piastri", fastestLap:{ driverId:"leclerc", time:"1:15.743", lap:63 }, fastestPit:{ team:"mclaren", seconds:2.16 } },
  { id: "2025-canada",      round: 10, name: "Canadian GP",      officialName: "FORMULA 1 PIRELLI GRAND PRIX DU CANADA 2025",      circuitId: "villeneuve",  hasSprint: false, status: "completed", sessions: { fp1:"2025-06-13T17:30:00Z", fp2:"2025-06-13T21:00:00Z", fp3:"2025-06-14T16:30:00Z", quali:"2025-06-14T20:00:00Z", race:"2025-06-15T18:00:00Z" }, podium:["russell","verstappen","antonelli"], poleId:"russell", fastestLap:{ driverId:"russell", time:"1:13.556", lap:65 }, fastestPit:{ team:"mercedes", seconds:2.09 } },
  { id: "2025-austria",     round: 11, name: "Austrian GP",      officialName: "FORMULA 1 ROLEX GROSSER PREIS VON ÖSTERREICH 2025", circuitId: "red_bull_ring", hasSprint: false, status: "completed", sessions: { fp1:"2025-06-27T11:30:00Z", fp2:"2025-06-27T15:00:00Z", fp3:"2025-06-28T10:30:00Z", quali:"2025-06-28T14:00:00Z", race:"2025-06-29T13:00:00Z" }, podium:["norris","piastri","leclerc"], poleId:"norris", fastestLap:{ driverId:"norris", time:"1:05.815", lap:60 }, fastestPit:{ team:"mclaren", seconds:2.13 } },
  { id: "2025-britain",     round: 12, name: "British GP",       officialName: "FORMULA 1 QATAR AIRWAYS BRITISH GRAND PRIX 2025",  circuitId: "silverstone", hasSprint: false, status: "completed", sessions: { fp1:"2025-07-04T11:30:00Z", fp2:"2025-07-04T15:00:00Z", fp3:"2025-07-05T10:30:00Z", quali:"2025-07-05T14:00:00Z", race:"2025-07-06T14:00:00Z" }, podium:["hamilton","verstappen","norris"], poleId:"verstappen", fastestLap:{ driverId:"hamilton", time:"1:28.293", lap:50 }, fastestPit:{ team:"ferrari", seconds:2.08 } },
  { id: "2025-belgium",     round: 13, name: "Belgian GP",       officialName: "FORMULA 1 ROLEX BELGIAN GRAND PRIX 2025",          circuitId: "spa",         hasSprint: true,  status: "completed", sessions: { fp1:"2025-07-25T10:30:00Z", sprintQuali:"2025-07-25T14:30:00Z", sprint:"2025-07-26T10:00:00Z", quali:"2025-07-26T14:00:00Z", race:"2025-07-27T13:00:00Z" }, podium:["piastri","norris","leclerc"], poleId:"norris", fastestLap:{ driverId:"leclerc", time:"1:45.921", lap:41 }, fastestPit:{ team:"mclaren", seconds:2.07 } },
  { id: "2025-hungary",     round: 14, name: "Hungarian GP",     officialName: "FORMULA 1 LENOVO HUNGARIAN GRAND PRIX 2025",       circuitId: "hungaroring", hasSprint: false, status: "completed", sessions: { fp1:"2025-08-01T11:30:00Z", fp2:"2025-08-01T15:00:00Z", fp3:"2025-08-02T10:30:00Z", quali:"2025-08-02T14:00:00Z", race:"2025-08-03T13:00:00Z" }, podium:["norris","piastri","russell"], poleId:"leclerc", fastestLap:{ driverId:"norris", time:"1:18.114", lap:66 }, fastestPit:{ team:"mclaren", seconds:2.15 } },
  { id: "2025-netherlands", round: 15, name: "Dutch GP",         officialName: "FORMULA 1 HEINEKEN DUTCH GRAND PRIX 2025",         circuitId: "zandvoort",   hasSprint: false, status: "upcoming", sessions: { fp1:"2027-01-05T10:30:00Z", fp2:"2027-01-05T14:00:00Z", fp3:"2027-01-06T09:30:00Z", quali:"2027-01-06T13:00:00Z", race:"2027-01-07T13:00:00Z" } },
  { id: "2025-italy",       round: 16, name: "Italian GP",       officialName: "FORMULA 1 PIRELLI GRAN PREMIO D'ITALIA 2025",      circuitId: "monza",       hasSprint: false, status: "upcoming", sessions: { fp1:"2027-01-12T11:30:00Z", fp2:"2027-01-12T15:00:00Z", fp3:"2027-01-13T10:30:00Z", quali:"2027-01-13T14:00:00Z", race:"2027-01-14T13:00:00Z" } },
  { id: "2025-azerbaijan",  round: 17, name: "Azerbaijan GP",    officialName: "FORMULA 1 QATAR AIRWAYS AZERBAIJAN GRAND PRIX 2025", circuitId: "baku",     hasSprint: false, status: "upcoming", sessions: { fp1:"2027-01-19T08:30:00Z", fp2:"2027-01-19T12:00:00Z", fp3:"2027-01-20T09:30:00Z", quali:"2027-01-20T13:00:00Z", race:"2027-01-21T11:00:00Z" } },
  { id: "2025-singapore",   round: 18, name: "Singapore GP",     officialName: "FORMULA 1 SINGAPORE AIRLINES SINGAPORE GRAND PRIX 2025", circuitId: "marina_bay", hasSprint: false, status: "upcoming", sessions: { fp1:"2027-02-02T09:30:00Z", fp2:"2027-02-02T13:00:00Z", fp3:"2027-02-03T09:30:00Z", quali:"2027-02-03T13:00:00Z", race:"2027-02-04T12:00:00Z" } },
  { id: "2025-usa",         round: 19, name: "United States GP", officialName: "FORMULA 1 PIRELLI UNITED STATES GRAND PRIX 2025",  circuitId: "cota",        hasSprint: true,  status: "upcoming", sessions: { fp1:"2027-02-16T17:30:00Z", sprintQuali:"2027-02-16T21:30:00Z", sprint:"2027-02-17T17:00:00Z", quali:"2027-02-17T21:00:00Z", race:"2027-02-18T19:00:00Z" } },
  { id: "2025-mexico",      round: 20, name: "Mexico City GP",   officialName: "FORMULA 1 GRAN PREMIO DE LA CIUDAD DE MÉXICO 2025", circuitId: "rodriguez",  hasSprint: false, status: "upcoming", sessions: { fp1:"2027-02-23T18:30:00Z", fp2:"2027-02-23T22:00:00Z", fp3:"2027-02-24T17:30:00Z", quali:"2027-02-24T21:00:00Z", race:"2027-02-25T20:00:00Z" } },
  { id: "2025-brazil",      round: 21, name: "São Paulo GP",     officialName: "FORMULA 1 LENOVO GRANDE PRÊMIO DE SÃO PAULO 2025", circuitId: "interlagos",  hasSprint: true,  status: "upcoming", sessions: { fp1:"2027-03-01T14:30:00Z", sprintQuali:"2027-03-01T18:30:00Z", sprint:"2027-03-02T14:00:00Z", quali:"2027-03-02T18:00:00Z", race:"2027-03-03T17:00:00Z" } },
  { id: "2025-vegas",       round: 22, name: "Las Vegas GP",     officialName: "FORMULA 1 HEINEKEN SILVER LAS VEGAS GRAND PRIX 2025", circuitId: "las_vegas", hasSprint: false, status: "upcoming", sessions: { fp1:"2027-03-08T04:30:00Z", fp2:"2027-03-08T08:00:00Z", fp3:"2027-03-09T04:30:00Z", quali:"2027-03-09T08:00:00Z", race:"2027-03-10T06:00:00Z" } },
  { id: "2025-qatar",       round: 23, name: "Qatar GP",         officialName: "FORMULA 1 QATAR AIRWAYS QATAR GRAND PRIX 2025",    circuitId: "losail",      hasSprint: true,  status: "upcoming", sessions: { fp1:"2027-03-15T13:30:00Z", sprintQuali:"2027-03-15T17:30:00Z", sprint:"2027-03-16T14:00:00Z", quali:"2027-03-16T18:00:00Z", race:"2027-03-17T16:00:00Z" } },
  { id: "2025-abudhabi",    round: 24, name: "Abu Dhabi GP",     officialName: "FORMULA 1 ETIHAD AIRWAYS ABU DHABI GRAND PRIX 2025", circuitId: "yas_marina", hasSprint: false, status: "upcoming", sessions: { fp1:"2027-03-22T09:30:00Z", fp2:"2027-03-22T13:00:00Z", fp3:"2027-03-23T10:30:00Z", quali:"2027-03-23T14:00:00Z", race:"2027-03-24T13:00:00Z" } },
];

export const racesById: Record<string, Race> = Object.fromEntries(races.map((r) => [r.id, r]));

export function getNextRace(): Race {
  const now = Date.now();
  const upcoming = races.find((r) => new Date(r.sessions.race).getTime() > now);
  return upcoming ?? races[races.length - 1];
}

// Driver standings derived from mock data
export const driverStandings = [...drivers]
  .sort((a, b) => b.seasonPoints - a.seasonPoints)
  .map((d, i) => ({ position: i + 1, driver: d }));

// Constructor standings
export const constructorStandings = (() => {
  const map: Record<string, number> = {};
  drivers.forEach((d) => { map[d.team] = (map[d.team] ?? 0) + d.seasonPoints; });
  return Object.entries(map)
    .map(([tid, pts]) => ({ team: teams[tid], points: pts }))
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({ position: i + 1, ...e }));
})();

// On this day snippets
export const onThisDay = [
  { year: 1994, text: "Ayrton Senna claims a legendary pole at Imola." },
  { year: 2008, text: "Lewis Hamilton wins his first World Championship at Interlagos on the final corner of the final lap." },
  { year: 2021, text: "Max Verstappen wins his first World Championship in Abu Dhabi." },
  { year: 1976, text: "Niki Lauda returns to racing at Monza just six weeks after his Nürburgring crash." },
];

export function pickOnThisDay() {
  const day = new Date().getDate();
  return onThisDay[day % onThisDay.length];
}

// F1 glossary
export const glossary = [
  { term: "DRS", full: "Drag Reduction System", def: "A driver-activated rear-wing flap that reduces drag on straights, enabled within 1 second of the car ahead in designated zones — used to promote overtaking." },
  { term: "Parc Fermé", full: "Parc Fermé", def: "French for 'closed park'. Once qualifying starts, teams can no longer make significant setup changes to the car without incurring a penalty." },
  { term: "Undercut", full: "Pit strategy", def: "Pitting earlier than a rival to use fresh tyres to gain time and jump them when they pit." },
  { term: "Overcut", full: "Pit strategy", def: "Staying out longer than a rival on old tyres, relying on clear air to gain enough time to leapfrog them at their pit stop." },
  { term: "Soft/Medium/Hard", full: "Slick compounds", def: "Dry-weather tyres from softest (fastest, shortest life) to hardest (slowest, longest life). Marked red, yellow, white." },
  { term: "Intermediates", full: "Wet tyres", def: "Green-banded tyres for damp or drying conditions." },
  { term: "Full Wets", full: "Wet tyres", def: "Blue-banded tyres for heavy rain and standing water." },
  { term: "Blue Flag", full: "Marshal signal", def: "Shown to a driver about to be lapped by a faster car — they must let it pass promptly." },
  { term: "Safety Car", full: "Neutralisation", def: "Deploys onto the track behind the leader to slow the field during an incident, bunching cars into a train." },
  { term: "VSC", full: "Virtual Safety Car", def: "Sector-based speed limits imposed field-wide without a physical car on track." },
  { term: "Formation Lap", full: "Race start", def: "The lap before the race begins, used to warm tyres and brakes and take up grid positions." },
  { term: "Points System", full: "Race scoring", def: "1st–10th score 25-18-15-12-10-8-6-4-2-1. Fastest lap earns +1 if the driver finishes in the top 10." },
];

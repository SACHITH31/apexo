// Circuit Explorer metadata. Slow-changing characteristics the timing APIs do
// not expose — corner counts, elevation, tyre/brake demand, overtaking index.

export interface CircuitProfile {
  corners: number;
  elevationM: number;
  topSpeedKph: number;
  /** 1 (light) — 5 (severe) */
  brakeWear: number;
  tyreWear: number;
  /** 1 (processional) — 5 (overtaking festival) */
  overtaking: number;
  history?: string;
}

/** Keyed by Jolpica/Ergast circuitId. */
export const CIRCUIT_PROFILE: Record<string, CircuitProfile> = {
  bahrain: { corners: 15, elevationM: 17, topSpeedKph: 330, brakeWear: 5, tyreWear: 5, overtaking: 4, history: "Traction-limited and abrasive — rear tyres decide the race." },
  jeddah: { corners: 27, elevationM: 12, topSpeedKph: 340, brakeWear: 3, tyreWear: 3, overtaking: 3, history: "Blind, walled, and the fastest street circuit ever built." },
  albert_park: { corners: 14, elevationM: 10, topSpeedKph: 330, brakeWear: 3, tyreWear: 3, overtaking: 3, history: "Reprofiled in 2022 into a far faster, four-DRS layout." },
  suzuka: { corners: 18, elevationM: 40, topSpeedKph: 320, brakeWear: 2, tyreWear: 5, overtaking: 2, history: "The only figure-of-eight on the calendar and the ultimate driver test." },
  shanghai: { corners: 16, elevationM: 8, topSpeedKph: 335, brakeWear: 4, tyreWear: 4, overtaking: 4, history: "The endless Turn 1-2-3 spiral punishes any early commitment." },
  miami: { corners: 19, elevationM: 5, topSpeedKph: 340, brakeWear: 4, tyreWear: 3, overtaking: 4 },
  imola: { corners: 19, elevationM: 45, topSpeedKph: 325, brakeWear: 4, tyreWear: 3, overtaking: 1, history: "Old-school, anti-clockwise, and desperately narrow for modern cars." },
  monaco: { corners: 19, elevationM: 42, topSpeedKph: 290, brakeWear: 5, tyreWear: 1, overtaking: 1, history: "Qualifying is the race. Nothing else on the calendar compares." },
  catalunya: { corners: 14, elevationM: 30, topSpeedKph: 325, brakeWear: 2, tyreWear: 5, overtaking: 2, history: "Every team's reference track — nothing can be hidden here." },
  villeneuve: { corners: 14, elevationM: 5, topSpeedKph: 340, brakeWear: 5, tyreWear: 2, overtaking: 5, history: "Stop-start layout guarded by the Wall of Champions." },
  red_bull_ring: { corners: 10, elevationM: 65, topSpeedKph: 335, brakeWear: 4, tyreWear: 3, overtaking: 5, history: "Barely a minute a lap, with three genuine overtaking zones." },
  silverstone: { corners: 18, elevationM: 15, topSpeedKph: 330, brakeWear: 2, tyreWear: 5, overtaking: 4, history: "Home of the first World Championship race, in 1950." },
  spa: { corners: 19, elevationM: 102, topSpeedKph: 345, brakeWear: 3, tyreWear: 4, overtaking: 5, history: "Eau Rouge into Raidillon — still the benchmark of bravery." },
  hungaroring: { corners: 14, elevationM: 35, topSpeedKph: 315, brakeWear: 4, tyreWear: 4, overtaking: 1, history: "Monaco without the walls: a permanent circuit with street-race rhythm." },
  zandvoort: { corners: 14, elevationM: 20, topSpeedKph: 320, brakeWear: 3, tyreWear: 4, overtaking: 2, history: "Banked Hugenholtz and Arie Luyendyk corners loaded the cars like nothing else." },
  monza: { corners: 11, elevationM: 10, topSpeedKph: 360, brakeWear: 5, tyreWear: 2, overtaking: 5, history: "The Temple of Speed — lowest downforce weekend of the year." },
  baku: { corners: 20, elevationM: 30, topSpeedKph: 355, brakeWear: 4, tyreWear: 2, overtaking: 5, history: "A 2.2km full-throttle blast into a medieval castle section." },
  marina_bay: { corners: 19, elevationM: 6, topSpeedKph: 320, brakeWear: 5, tyreWear: 3, overtaking: 2, history: "F1's original night race and its most physically brutal." },
  americas: { corners: 20, elevationM: 41, topSpeedKph: 335, brakeWear: 4, tyreWear: 4, overtaking: 4, history: "Uphill Turn 1 and a Maggotts-inspired esses complex." },
  rodriguez: { corners: 17, elevationM: 2240, topSpeedKph: 350, brakeWear: 5, tyreWear: 3, overtaking: 4, history: "Thin high-altitude air ruins cooling and slashes downforce." },
  interlagos: { corners: 15, elevationM: 43, topSpeedKph: 335, brakeWear: 3, tyreWear: 4, overtaking: 5, history: "Anti-clockwise, short, and historically the home of chaos." },
  vegas: { corners: 17, elevationM: 12, topSpeedKph: 350, brakeWear: 4, tyreWear: 2, overtaking: 4, history: "Cold-track graining on a two-kilometre run down the Strip." },
  losail: { corners: 16, elevationM: 12, topSpeedKph: 325, brakeWear: 2, tyreWear: 5, overtaking: 2, history: "Relentless high-speed direction changes shred tyre sidewalls." },
  yas_marina: { corners: 16, elevationM: 12, topSpeedKph: 330, brakeWear: 4, tyreWear: 2, overtaking: 3, history: "Twilight finale — the track cools lap after lap." },
};

/** Reasonable estimate for circuits Apexo has no hand-authored profile for. */
export function profileFor(
  circuitId: string,
  fallback: { lengthKm: number; drsZones: number },
): CircuitProfile {
  const known = CIRCUIT_PROFILE[circuitId];
  if (known) return known;
  const corners = Math.max(10, Math.round(fallback.lengthKm * 2.8));
  return {
    corners,
    elevationM: 20,
    topSpeedKph: 330,
    brakeWear: 3,
    tyreWear: 3,
    overtaking: Math.min(5, Math.max(2, fallback.drsZones + 1)),
  };
}

export const WEAR_LABEL = ["", "Very low", "Low", "Medium", "High", "Extreme"];
export const OVERTAKE_LABEL = ["", "Very hard", "Hard", "Moderate", "Good", "Excellent"];

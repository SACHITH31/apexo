// Race Strategy Simulator engine. A deliberately transparent lap-time model:
// base pace + compound offset + linear degradation + fuel burn-off, with a
// fixed pit loss per stop. Good enough to compare strategies, honest about it.

export type Compound = "soft" | "medium" | "hard" | "inter" | "wet";

export interface CompoundSpec {
  label: string;
  short: string;
  color: string;
  /** seconds per lap vs the medium reference */
  paceDelta: number;
  /** seconds lost per lap of age */
  degPerLap: number;
  /** laps before the cliff steepens */
  cliff: number;
}

export const COMPOUNDS: Record<Compound, CompoundSpec> = {
  soft: { label: "Soft", short: "S", color: "#E8002D", paceDelta: -0.7, degPerLap: 0.09, cliff: 16 },
  medium: { label: "Medium", short: "M", color: "#F5C518", paceDelta: 0, degPerLap: 0.055, cliff: 26 },
  hard: { label: "Hard", short: "H", color: "#E8E8E8", paceDelta: 0.6, degPerLap: 0.032, cliff: 38 },
  inter: { label: "Intermediate", short: "I", color: "#43B02A", paceDelta: 4.5, degPerLap: 0.05, cliff: 30 },
  wet: { label: "Wet", short: "W", color: "#0067AD", paceDelta: 9, degPerLap: 0.04, cliff: 34 },
};

export interface Stint {
  compound: Compound;
  laps: number;
}

export interface StrategyInput {
  totalLaps: number;
  /** clean-air medium-tyre lap time in seconds, on low fuel */
  baseLapSeconds: number;
  /** circuit tyre wear 1–5 */
  wear: number;
  pitLossSeconds: number;
  /** 0 = dry, 1 = fully wet */
  rainRisk: number;
  stints: Stint[];
}

export interface StrategyResult {
  /** cumulative race time in seconds */
  totalSeconds: number;
  stops: number;
  lapTimes: { lap: number; seconds: number; compound: Compound }[];
  valid: boolean;
  lapsUsed: number;
  warnings: string[];
}

const FUEL_EFFECT = 0.035; // seconds per lap of fuel remaining

export function simulateStrategy(input: StrategyInput): StrategyResult {
  const wearFactor = 0.6 + input.wear * 0.2;
  const lapTimes: StrategyResult["lapTimes"] = [];
  const warnings: string[] = [];
  let lap = 0;
  let total = 0;

  input.stints.forEach((stint, index) => {
    const spec = COMPOUNDS[stint.compound];
    for (let age = 0; age < stint.laps; age++) {
      lap++;
      if (lap > input.totalLaps) break;
      const fuel = (input.totalLaps - lap) * FUEL_EFFECT;
      const beyondCliff = Math.max(0, age - spec.cliff);
      const deg = spec.degPerLap * wearFactor * age + beyondCliff * spec.degPerLap * wearFactor * 1.8;
      const rain = input.rainRisk * (stint.compound === "soft" ? 2.2 : stint.compound === "medium" ? 1.6 : 1.1);
      const seconds = input.baseLapSeconds + spec.paceDelta + deg + fuel + rain;
      total += seconds;
      lapTimes.push({ lap, seconds, compound: stint.compound });
    }
    if (index < input.stints.length - 1) total += input.pitLossSeconds;
    if (stint.laps > spec.cliff + 10) warnings.push(`${spec.label} stint of ${stint.laps} laps runs deep past the cliff.`);
  });

  const lapsUsed = lapTimes.length;
  const compounds = new Set(input.stints.map((s) => s.compound));
  const dryOnly = [...compounds].every((c) => c === "soft" || c === "medium" || c === "hard");
  if (dryOnly && compounds.size < 2) warnings.push("Two different dry compounds are mandatory in a dry race.");
  if (lapsUsed !== input.totalLaps) warnings.push(`Stint laps total ${lapsUsed} of ${input.totalLaps}.`);

  return {
    totalSeconds: total,
    stops: Math.max(0, input.stints.length - 1),
    lapTimes,
    lapsUsed,
    valid: lapsUsed === input.totalLaps && (!dryOnly || compounds.size >= 2),
    warnings,
  };
}

/** Evenly split laps across a preset compound sequence. */
export function presetStints(totalLaps: number, sequence: Compound[]): Stint[] {
  const per = Math.floor(totalLaps / sequence.length);
  return sequence.map((compound, i) => ({
    compound,
    laps: i === sequence.length - 1 ? totalLaps - per * (sequence.length - 1) : per,
  }));
}

export const PRESETS: { id: string; label: string; sequence: Compound[] }[] = [
  { id: "1-stop-mh", label: "1-stop · M-H", sequence: ["medium", "hard"] },
  { id: "1-stop-sh", label: "1-stop · S-H", sequence: ["soft", "hard"] },
  { id: "2-stop-smh", label: "2-stop · S-M-H", sequence: ["soft", "medium", "hard"] },
  { id: "2-stop-mms", label: "2-stop · M-M-S", sequence: ["medium", "medium", "soft"] },
  { id: "3-stop", label: "3-stop · S-S-M-H", sequence: ["soft", "soft", "medium", "hard"] },
];

export function formatRaceTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

export function formatGap(seconds: number) {
  if (Math.abs(seconds) < 0.05) return "±0.0s";
  return `${seconds > 0 ? "+" : "−"}${Math.abs(seconds).toFixed(1)}s`;
}

// Client-safe race-control event vocabulary shared by the server data layer
// and the Race Control Timeline UI.

export type RaceEventKind =
  | "start"
  | "green"
  | "yellow"
  | "double-yellow"
  | "red"
  | "sc"
  | "vsc"
  | "chequered"
  | "penalty"
  | "track-limits"
  | "drs"
  | "pit"
  | "fastest-lap"
  | "result"
  | "info";

export interface RaceEvent {
  id: string;
  kind: RaceEventKind;
  /** Lap the event happened on, when known. */
  lap?: number;
  /** ISO timestamp, when known. */
  time?: string;
  driverNumber?: number;
  driverId?: string;
  title: string;
  message: string;
}

export interface EventStyle {
  label: string;
  /** CSS color token expression used for the rail, dot and glow. */
  color: string;
  severity: 0 | 1 | 2 | 3;
}

export const EVENT_STYLE: Record<RaceEventKind, EventStyle> = {
  start: { label: "Lights out", color: "var(--accent)", severity: 2 },
  green: { label: "Green flag", color: "var(--track-green)", severity: 0 },
  yellow: { label: "Yellow flag", color: "var(--track-yellow)", severity: 1 },
  "double-yellow": { label: "Double yellow", color: "var(--track-yellow)", severity: 2 },
  red: { label: "Red flag", color: "var(--track-red)", severity: 3 },
  sc: { label: "Safety car", color: "var(--track-yellow)", severity: 2 },
  vsc: { label: "Virtual safety car", color: "var(--track-yellow)", severity: 2 },
  chequered: { label: "Chequered flag", color: "var(--foreground)", severity: 0 },
  penalty: { label: "Penalty", color: "var(--track-red)", severity: 2 },
  "track-limits": { label: "Track limits", color: "var(--tyre-wet)", severity: 1 },
  drs: { label: "DRS", color: "var(--track-green)", severity: 0 },
  pit: { label: "Pit stop", color: "var(--accent)", severity: 0 },
  "fastest-lap": { label: "Fastest lap", color: "var(--tyre-wet)", severity: 0 },
  result: { label: "Result", color: "var(--foreground)", severity: 0 },
  info: { label: "Race control", color: "var(--muted-foreground)", severity: 0 },
};

/** Normalise a raw race-control message into an Apexo event kind. */
export function classifyMessage(raw: {
  category?: string;
  flag?: string;
  message?: string;
}): RaceEventKind {
  const msg = (raw.message ?? "").toUpperCase();
  const flag = (raw.flag ?? "").toUpperCase();

  if (msg.includes("VIRTUAL SAFETY CAR") || msg.includes("VSC")) return "vsc";
  if (msg.includes("SAFETY CAR")) return "sc";
  if (flag === "RED" || msg.includes("RED FLAG")) return "red";
  if (flag === "CHEQUERED" || msg.includes("CHEQUERED")) return "chequered";
  if (flag === "DOUBLE YELLOW") return "double-yellow";
  if (flag === "YELLOW") return "yellow";
  if (flag === "GREEN" || flag === "CLEAR") return "green";
  if (msg.includes("TRACK LIMITS")) return "track-limits";
  if (msg.includes("PENALTY") || msg.includes("REPRIMAND") || msg.includes("GRID DROP")) return "penalty";
  if (msg.includes("DRS")) return "drs";
  if (msg.includes("PIT")) return "pit";
  return "info";
}

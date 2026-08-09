import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RaceEvent, RaceEventKind } from "./race-events";
import { EVENT_STYLE } from "./race-events";

export type AlertKind = RaceEventKind | "session";

export interface LiveAlert {
  id: string;
  /** Throttle key — repeated pushes with the same key are suppressed. */
  key: string;
  kind: AlertKind;
  title: string;
  message?: string;
  /** 0 info · 1 notice · 2 important · 3 critical (pins a banner). */
  severity: 0 | 1 | 2 | 3;
  createdAt: number;
  /** ms before auto-dismiss; 0 keeps it until dismissed. */
  ttl?: number;
}

interface AlertsApi {
  alerts: LiveAlert[];
  banner: LiveAlert | null;
  push: (a: Omit<LiveAlert, "id" | "createdAt"> & { ttl?: number }) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const AlertsContext = createContext<AlertsApi | null>(null);

/** Minimum gap between two alerts sharing the same key. */
const THROTTLE_MS = 45_000;
const MAX_VISIBLE = 3;

export function LiveAlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [banner, setBanner] = useState<LiveAlert | null>(null);
  const lastSeen = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setAlerts((list) => list.filter((a) => a.id !== id));
    setBanner((b) => (b?.id === id ? null : b));
  }, []);

  const push = useCallback<AlertsApi["push"]>((input) => {
    const now = Date.now();
    const previous = lastSeen.current.get(input.key) ?? 0;
    if (now - previous < THROTTLE_MS) return;
    lastSeen.current.set(input.key, now);

    const alert: LiveAlert = {
      id: `${input.key}-${now}`,
      createdAt: now,
      ttl: input.ttl ?? (input.severity >= 3 ? 0 : 7000),
      ...input,
    };

    setAlerts((list) => [alert, ...list].slice(0, MAX_VISIBLE));
    if (alert.severity >= 2) setBanner(alert);
  }, []);

  const clear = useCallback(() => {
    setAlerts([]);
    setBanner(null);
  }, []);

  // Auto-dismiss pass — one interval instead of a timer per toast.
  useEffect(() => {
    if (!alerts.length) return;
    const t = window.setInterval(() => {
      const now = Date.now();
      setAlerts((list) => list.filter((a) => !a.ttl || now - a.createdAt < a.ttl));
    }, 500);
    return () => window.clearInterval(t);
  }, [alerts.length]);

  const value = useMemo(
    () => ({ alerts, banner, push, dismiss, clear }),
    [alerts, banner, push, dismiss, clear],
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useLiveAlerts(): AlertsApi {
  const ctx = useContext(AlertsContext);
  if (ctx) return ctx;
  // Safe no-op so components can be rendered outside the provider (tests, SSR).
  return { alerts: [], banner: null, push: () => {}, dismiss: () => {}, clear: () => {} };
}

export function alertColor(kind: AlertKind): string {
  if (kind === "session") return "var(--accent)";
  return EVENT_STYLE[kind]?.color ?? "var(--accent)";
}

export function alertLabel(kind: AlertKind): string {
  if (kind === "session") return "Session";
  return EVENT_STYLE[kind]?.label ?? "Race control";
}

/* --------------------------- race-weekend sources -------------------------- */

const SESSION_LABEL: Record<string, string> = {
  fp1: "Free Practice 1",
  fp2: "Free Practice 2",
  fp3: "Free Practice 3",
  sprintQuali: "Sprint Qualifying",
  sprint: "Sprint Race",
  quali: "Qualifying",
  race: "Race start",
};

/** Sessions starting within this window trigger a "starting soon" alert. */
const SOON_MS = 15 * 60 * 1000;

export function useSessionAlerts(sessions: Record<string, string | undefined>, raceName: string) {
  const { push } = useLiveAlerts();

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      for (const [key, iso] of Object.entries(sessions)) {
        if (!iso) continue;
        const at = new Date(iso).getTime();
        if (Number.isNaN(at)) continue;
        const delta = at - now;
        const label = SESSION_LABEL[key] ?? key.toUpperCase();

        if (delta <= SOON_MS && delta > 0) {
          push({
            key: `session-soon-${key}`,
            kind: "session",
            severity: 1,
            title: `${label} starts soon`,
            message: `${raceName} · in ${Math.max(1, Math.round(delta / 60000))} min`,
          });
        } else if (delta <= 0 && delta > -5 * 60 * 1000) {
          push({
            key: `session-live-${key}`,
            kind: key === "race" ? "start" : "session",
            severity: 2,
            title: key === "race" ? "Lights out" : `${label} underway`,
            message: raceName,
          });
        }
      }
    };
    check();
    const t = window.setInterval(check, 30_000);
    return () => window.clearInterval(t);
  }, [sessions, raceName, push]);
}

const ALERTABLE: RaceEventKind[] = [
  "start", "sc", "vsc", "red", "chequered", "drs", "double-yellow", "yellow", "result",
];

/** Turns incoming race-control events into throttled in-app alerts. */
export function useRaceEventAlerts(events: RaceEvent[], enabled: boolean) {
  const { push } = useLiveAlerts();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !events.length) return;
    // Only react to the most recent handful so a first load doesn't spam.
    const recent = events.slice(-6);
    for (const e of recent) {
      if (seen.current.has(e.id)) continue;
      seen.current.add(e.id);
      if (!ALERTABLE.includes(e.kind)) continue;
      const style = EVENT_STYLE[e.kind];
      push({
        key: `event-${e.kind}`,
        kind: e.kind,
        severity: style.severity,
        title: e.title || style.label,
        message: e.lap ? `Lap ${e.lap} · ${e.message}` : e.message,
      });
    }
  }, [events, enabled, push]);
}

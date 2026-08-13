import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Gauge,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Thermometer,
  Wind,
  Wrench,
} from "lucide-react";
import type { Driver, Race } from "@/lib/mock-data";
import type { RaceDetail } from "@/lib/f1-extra.server";
import { buildReplay, weatherAtLap } from "@/lib/replay";
import { EVENT_STYLE } from "@/lib/race-events";
import { ReplayTrackMap, type TrackCar } from "./ReplayTrackMap";
import { RaceBattle } from "./RaceBattle";
import { computeInsights } from "@/lib/race-insights";
import { useRaceWeather, weatherSessionsOf } from "@/lib/weather-data";

const SPEEDS = [0.25, 0.5, 1, 2, 5, 10] as const;
const LAP_MS = 2200; // one replay lap at 1x
const LAP_SECONDS = 92; // reference lap time used to space cars around the map

const COMPOUND_COLOR: Record<string, string> = {
  SOFT: "var(--track-red)",
  MEDIUM: "var(--track-yellow)",
  HARD: "var(--foreground)",
  INTERMEDIATE: "var(--track-green)",
  WET: "var(--tyre-wet)",
};

interface Props {
  race: Race;
  circuitId: string;
  circuitLaps: number;
  drsZones: number;
  detail?: RaceDetail;
  driversById: Record<string, Driver>;
  driversByNumber: Record<number, Driver>;
  teamFor: (d: Driver) => { name: string; color: string };
}

/**
 * Immersive race viewer — one engine for live and completed races. Scrub or
 * play the race lap by lap with every car animated on the circuit, a live
 * leaderboard, tyre state, pit window, race control feed, deterministic
 * insights and battle mode. Reconstructed from timing data, never footage.
 */
export function RaceReplay({
  race,
  circuitId,
  circuitLaps,
  drsZones,
  detail,
  driversById,
  driversByNumber,
  teamFor,
}: Props) {
  const model = useMemo(
    () => buildReplay(detail, { circuitLaps, driversByNumber }),
    [detail, circuitLaps, driversByNumber],
  );

  const [progress, setProgress] = useState(1); // continuous lap position
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(2);
  const [selected, setSelected] = useState<string | null>(null);
  const [theatre, setTheatre] = useState(false);
  const [battle, setBattle] = useState<{ a: string; b: string } | null>(null);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const feedRef = useRef<HTMLUListElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  const total = model.totalLaps;

  useEffect(() => {
    if (!playing || !total) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = now - last.current;
      last.current = now;
      setProgress((p) => {
        const next = p + (dt / LAP_MS) * speed * (reduced ? 2 : 1);
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, speed, total]);

  const lapIndex = Math.max(1, Math.min(total || 1, Math.floor(progress)));
  const state = model.laps[lapIndex - 1];
  const lapProgress = progress - Math.floor(progress);

  const weather = useRaceWeather(circuitId, weatherSessionsOf(race));
  const baseWeather = weather.data?.sessions.find((s) => s.key === "race");
  const wx = weatherAtLap(lapIndex, total, baseWeather as never);

  const jump = useCallback(
    (lap: number) => setProgress(Math.max(1, Math.min(total || 1, lap))),
    [total],
  );

  const timelineEvents = useMemo(
    () => model.events.filter((e) => e.kind !== "info").slice(0, 60),
    [model.events],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      const laps = timelineEvents.map((e) => e.lap ?? 1);
      const next =
        dir === 1
          ? laps.find((l) => l > lapIndex) ?? total
          : [...laps].reverse().find((l) => l < lapIndex) ?? 1;
      setPlaying(false);
      jump(next);
    },
    [timelineEvents, lapIndex, total, jump],
  );

  // Keyboard shortcuts: space play/pause, arrows scrub and change speed.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
      if (!rootRef.current) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          setPlaying((p) => !p);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setPlaying(false);
          jump(lapIndex - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          setPlaying(false);
          jump(lapIndex + 1);
          break;
        case "ArrowUp":
        case "ArrowDown": {
          e.preventDefault();
          const i = SPEEDS.indexOf(speed);
          const nextI = Math.max(0, Math.min(SPEEDS.length - 1, i + (e.key === "ArrowUp" ? 1 : -1)));
          setSpeed(SPEEDS[nextI]);
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, lapIndex, speed]);

  // Auto scroll the feed to the newest event.
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [lapIndex]);

  const insights = useMemo(
    () =>
      computeInsights(
        model,
        detail,
        (id) => driversById[id]?.lastName ?? id,
        (id) => {
          const d = Object.values(driversById).find((x) => x.team === id);
          return d ? teamFor(d).name : id.replace(/_/g, " ");
        },
      ),
    [model, detail, driversById, teamFor],
  );

  const cars: TrackCar[] = useMemo(() => {
    if (!state) return [];
    return state.order
      .filter((o) => !o.retired)
      .map((o) => {
        const d = driversById[o.driverId];
        return {
          driverId: o.driverId,
          code: d?.code ?? o.driverId.slice(0, 3).toUpperCase(),
          color: d ? teamFor(d).color : "var(--accent)",
          frac: lapProgress - o.gapSec / LAP_SECONDS,
          position: o.position,
          retired: o.retired,
          pitting: o.pitting,
        };
      });
  }, [state, lapProgress, driversById, teamFor]);

  const candidates = useMemo(
    () => (state?.order ?? []).map((o) => o.driverId).filter((id) => driversById[id]),
    [state, driversById],
  );

  useEffect(() => {
    if (battle || candidates.length < 2) return;
    setBattle({ a: candidates[0], b: candidates[1] });
  }, [battle, candidates]);

  if (!model.available || !state) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
        Replay becomes available once classified results are published for this race.
      </div>
    );
  }

  const feed = model.events.filter((e) => (e.lap ?? 1) <= lapIndex).slice(-40).reverse();
  const sel = selected ? state.order.find((o) => o.driverId === selected) : undefined;
  const selDriver = sel ? driversById[sel.driverId] : undefined;
  const selStops = sel ? model.pitStops.filter((p) => p.driverId === sel.driverId && p.lap <= lapIndex) : [];

  return (
    <section
      ref={rootRef}
      className={
        "space-y-4 " +
        (theatre
          ? "fixed inset-0 z-50 overflow-y-auto bg-background/95 backdrop-blur-xl p-4 sm:p-6"
          : "")
      }
    >
      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Race viewer</div>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            {race.status === "live" ? "Live" : "Reconstructed"}
          </span>
          <button
            type="button"
            onClick={() => setTheatre((t) => !t)}
            className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-foreground"
            aria-label={theatre ? "Exit theatre mode" : "Theatre mode"}
          >
            {theatre ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <div className="ml-auto font-timing tabular-nums text-2xl">
            L{String(lapIndex).padStart(2, "0")}
            <span className="text-muted-foreground text-base">/{total}</span>
          </div>
        </div>

        <div
          className={
            "mt-4 flex flex-wrap items-center gap-2 transition-opacity duration-300 " +
            (playing ? "opacity-45 hover:opacity-100 focus-within:opacity-100" : "opacity-100")
          }
        >
          <button
            type="button"
            onClick={() => {
              if (progress >= total) setProgress(1);
              setPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[11px] uppercase tracking-widest text-accent-foreground hover-lift"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={() => step(-1)} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Previous event">
            <SkipBack className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setPlaying(false); jump(lapIndex - 1); }} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Previous lap">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setPlaying(false); jump(lapIndex + 1); }} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Next lap">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => step(1)} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Next event">
            <SkipForward className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setPlaying(false); setProgress(1); }} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Restart">
            <RotateCcw className="h-4 w-4" />
          </button>

          <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Lap
            <input
              type="number"
              min={1}
              max={total}
              value={lapIndex}
              onChange={(e) => { setPlaying(false); jump(Number(e.target.value)); }}
              className="w-16 rounded-full border border-border bg-surface/60 px-2 py-1 font-timing tabular-nums text-xs text-foreground"
              aria-label="Jump to lap"
            />
          </label>

          <div className="ml-auto flex items-center gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={
                  "rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest border transition-colors " +
                  (speed === s
                    ? "border-accent/60 bg-accent/15 text-accent-glow"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min={1}
          max={total}
          step={0.05}
          value={progress}
          onChange={(e) => { setPlaying(false); setProgress(Number(e.target.value)); }}
          aria-label="Scrub race lap"
          className="mt-4 w-full accent-[var(--accent)]"
        />

        {/* Interactive event timeline */}
        {timelineEvents.length > 0 && (
          <div className="relative mt-2 h-7 w-full">
            <div className="absolute inset-x-0 top-3 h-px bg-border" />
            {timelineEvents.map((e) => {
              const lap = e.lap ?? 1;
              const left = total > 1 ? ((lap - 1) / (total - 1)) * 100 : 0;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => { setPlaying(false); jump(lap); }}
                  title={`L${lap} · ${EVENT_STYLE[e.kind].label} — ${e.message || e.title}`}
                  aria-label={`Jump to lap ${lap}: ${EVENT_STYLE[e.kind].label}`}
                  className="group absolute top-0 -ml-1.5 h-7 w-3"
                  style={{ left: `${left}%` }}
                >
                  <span
                    className="mx-auto block h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-150"
                    style={{ background: EVENT_STYLE[e.kind].color }}
                  />
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">
          Space play · ← → lap · ↑ ↓ speed · click markers to jump
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReplayTrackMap
          circuitId={circuitId}
          lap={lapIndex}
          totalLaps={total}
          lapProgress={lapProgress}
          trackStatus={state.trackStatus}
          drsZones={drsZones}
          cars={cars}
          selectedId={selected}
          onSelect={setSelected}
          wet={(wx?.rainChance ?? 0) >= 40}
          dryLine={wx?.dryLine}
          info={
            sel && selDriver ? (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-1 rounded-full" style={{ background: teamFor(selDriver).color }} />
                  <span className="font-display text-base leading-none">{selDriver.lastName}</span>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {teamFor(selDriver).name}
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-timing tabular-nums">
                  <Row label="Pos" value={`P${sel.position}`} />
                  <Row label="Gap" value={sel.position === 1 ? "Leader" : `+${sel.gapSec.toFixed(1)}s`} />
                  <Row label="Tyre" value={`${sel.compound} ${sel.tyreAge}L`} />
                  <Row label="Life" value={`${sel.tyreLifePct}%`} />
                  <Row label="Stops" value={String(selStops.length)} />
                  <Row label="Sector" value={`S${lapProgress < 1 / 3 ? 1 : lapProgress < 2 / 3 ? 2 : 3}`} />
                  <Row label="Gained" value={`${sel.positionsGained >= 0 ? "+" : ""}${sel.positionsGained}`} />
                  <Row label="Status" value={sel.pitting ? "In pits" : sel.retired ? "Out" : "Running"} />
                </dl>
              </div>
            ) : null
          }
        />

        <div className="min-w-0 glass rounded-2xl p-5 sm:p-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Live order</div>
          <ol className="mt-3 max-h-[22rem] overflow-y-auto pr-1 space-y-1">
            {state.order.map((o) => {
              const d = driversById[o.driverId];
              if (!d) return null;
              const t = teamFor(d);
              return (
                <li key={o.driverId}>
                  <div
                    onMouseEnter={() => setSelected(o.driverId)}
                    className={
                      "flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors " +
                      (selected === o.driverId ? "border-accent/50 bg-surface/60 " : "border-transparent hover:border-accent/40 hover:bg-surface/60 ") +
                      (o.retired ? "opacity-45" : "")
                    }
                  >
                    <span className="w-6 shrink-0 font-timing tabular-nums text-sm text-muted-foreground">
                      {o.retired ? "—" : o.position}
                    </span>
                    <span className="h-4 w-1 shrink-0 rounded-full" style={{ background: t.color }} />
                    <Link
                      to="/drivers/$driverId"
                      params={{ driverId: o.driverId }}
                      className="min-w-0 flex-1 truncate text-sm hover:text-accent"
                    >
                      {d.lastName}
                    </Link>
                    {!o.retired && (
                      <span
                        className="shrink-0 rounded-full border px-1.5 text-[9px] uppercase tracking-widest"
                        style={{ borderColor: COMPOUND_COLOR[o.compound] ?? "var(--border)", color: COMPOUND_COLOR[o.compound] ?? undefined }}
                      >
                        {o.compound === "UNKNOWN" ? "?" : o.compound.slice(0, 1)}
                        {o.tyreAge}
                      </span>
                    )}
                    {o.pitting && <Wrench className="h-3 w-3 shrink-0 text-accent" />}
                    <span className="w-14 shrink-0 text-right font-timing tabular-nums text-xs text-muted-foreground">
                      {o.retired ? "DNF" : o.position === 1 ? "Leader" : `+${o.gapSec.toFixed(1)}`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Tyre state">
          <ul className="space-y-2">
            {state.order.filter((o) => !o.retired).slice(0, 6).map((o) => {
              const d = driversById[o.driverId];
              return (
                <li key={o.driverId} className="min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{d?.lastName ?? o.driverId}</span>
                    <span className="font-timing tabular-nums text-muted-foreground">{o.tyreLifePct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${o.tyreLifePct}%`, background: COMPOUND_COLOR[o.compound] ?? "var(--accent)" }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Pit window">
          <div className="font-timing tabular-nums text-3xl">
            {model.pitStops.filter((p) => p.lap <= lapIndex).length}
            <span className="text-sm text-muted-foreground"> stops</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {model.pitStops
              .filter((p) => p.lap <= lapIndex)
              .slice(-4)
              .reverse()
              .map((p, i) => (
                <li key={`${p.driverId}-${p.stop}-${i}`} className="flex justify-between gap-2">
                  <span className="truncate">L{p.lap} {driversById[p.driverId]?.lastName ?? p.driverId}</span>
                  <span className="font-timing tabular-nums">{p.duration.toFixed(2)}s</span>
                </li>
              ))}
            {!model.pitStops.some((p) => p.lap <= lapIndex) && <li>No stops yet.</li>}
          </ul>
        </Panel>

        <Panel title="Conditions">
          {wx ? (
            <div className="space-y-2 text-xs">
              <div className="font-display text-2xl">{wx.label}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Thermometer className="h-3 w-3" /> Air {wx.airTempC}°C · Track {wx.trackTempC}°C</div>
              <div className="flex items-center gap-2 text-muted-foreground"><CloudRain className="h-3 w-3" /> Rain {wx.rainChance}% · Humidity {wx.humidity}%</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Wind className="h-3 w-3" /> Wind {wx.windKph} km/h</div>
              {wx.dryLine && <div className="text-accent">Dry line forming</div>}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Conditions unavailable for this race.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Race feed">
          <ul ref={feedRef} className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {feed.map((e) => (
              <li key={e.id} className="flex min-w-0 gap-2 text-xs">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: EVENT_STYLE[e.kind].color }} />
                <div className="min-w-0">
                  <div className="uppercase tracking-widest text-[10px] text-muted-foreground">L{e.lap ?? 1} · {EVENT_STYLE[e.kind].label}</div>
                  <div className="break-words">{e.message || e.title}</div>
                </div>
              </li>
            ))}
            {!feed.length && <li className="text-xs text-muted-foreground">Awaiting race control.</li>}
          </ul>
        </Panel>

        <Panel title="Points projection">
          <ul className="space-y-1">
            {state.order.filter((o) => !o.retired && o.position <= 10).map((o) => {
              const d = driversById[o.driverId];
              return (
                <li key={o.driverId} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">P{o.position} {d?.lastName ?? o.driverId}</span>
                  <span className="font-timing tabular-nums text-accent-glow">+{state.driverPoints[o.driverId] ?? 0}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Gauge className="h-3 w-3" /> {state.safetyCars} SC/VSC · {state.redFlags} red
          </div>
        </Panel>
      </div>

      {battle && candidates.length > 1 && (
        <RaceBattle
          model={model}
          a={battle.a}
          b={battle.b}
          currentLap={lapIndex}
          driversById={driversById}
          colorOf={(id) => {
            const d = driversById[id];
            return d ? teamFor(d).color : "var(--accent)";
          }}
          candidates={candidates}
          onChange={(which, id) => setBattle((prev) => (prev ? { ...prev, [which]: id } : prev))}
        />
      )}

      {insights.length > 0 && (
        <Panel title="Race insights">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((i) => (
              <div key={i.key} className="min-w-0 rounded-xl border border-border bg-surface/40 p-3">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{i.label}</div>
                <div className="truncate font-display text-lg leading-tight">{i.value}</div>
                <div className="truncate text-[11px] text-muted-foreground">{i.detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 glass rounded-2xl p-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

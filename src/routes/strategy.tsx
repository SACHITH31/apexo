import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Gauge, Minus, Plus, Timer, Wrench } from "lucide-react";
import { seasonQueryOptions, useSeason } from "@/lib/f1-data";
import { PageSkeleton } from "@/components/Skeletons";
import { CIRCUIT_PROFILE } from "@/lib/circuit-profiles";
import {
  COMPOUNDS,
  PRESETS,
  formatGap,
  formatRaceTime,
  presetStints,
  simulateStrategy,
  type Compound,
  type Stint,
} from "@/lib/strategy";

export const Route = createFileRoute("/strategy")({
  head: () => ({
    meta: [
      { title: "Race Strategy Simulator · Apexo" },
      {
        name: "description",
        content: "Build tyre strategies lap by lap and compare one, two, and three-stop races on any F1 circuit.",
      },
      { property: "og:title", content: "Race Strategy Simulator · Apexo" },
      { property: "og:description", content: "Compounds, degradation, pit loss and rain risk — modelled lap by lap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(seasonQueryOptions());
  },
  component: StrategyPage,
  pendingComponent: PageSkeleton,
});

const DRY: Compound[] = ["soft", "medium", "hard"];

function baseLapOf(lengthKm: number) {
  // ~205 km/h race average is a fair broadcast-grade approximation.
  return (lengthKm / 205) * 3600;
}

function StrategyPage() {
  const data = useSeason();
  const circuitList = useMemo(
    () => Object.values(data.circuits).sort((a, b) => a.name.localeCompare(b.name)),
    [data.circuits],
  );

  const [circuitId, setCircuitId] = useState(circuitList[0]?.id ?? "");
  const circuit = data.circuits[circuitId] ?? circuitList[0];
  const profile = CIRCUIT_PROFILE[circuit.id];
  const totalLaps = circuit.laps;

  const [pitLoss, setPitLoss] = useState(21);
  const [rainRisk, setRainRisk] = useState(0);
  const [stints, setStints] = useState<Stint[]>(() => presetStints(circuit.laps, ["medium", "hard"]));

  const applyCircuit = (id: string) => {
    setCircuitId(id);
    const next = data.circuits[id];
    if (next) setStints(presetStints(next.laps, ["medium", "hard"]));
  };

  const input = {
    totalLaps,
    baseLapSeconds: baseLapOf(circuit.lengthKm),
    wear: profile?.tyreWear ?? 3,
    pitLossSeconds: pitLoss,
    rainRisk: rainRisk / 100,
  };

  const result = useMemo(() => simulateStrategy({ ...input, stints }), [input.totalLaps, input.baseLapSeconds, input.wear, pitLoss, rainRisk, stints]);

  const comparison = useMemo(() => {
    const rows = PRESETS.map((p) => {
      const s = presetStints(totalLaps, p.sequence);
      return { ...p, stints: s, result: simulateStrategy({ ...input, stints: s }) };
    }).sort((a, b) => a.result.totalSeconds - b.result.totalSeconds);
    return rows;
  }, [totalLaps, input.baseLapSeconds, input.wear, pitLoss, rainRisk]);

  const best = comparison[0];

  const setLaps = (index: number, delta: number) =>
    setStints((prev) =>
      prev.map((s, i) => (i === index ? { ...s, laps: Math.max(1, Math.min(totalLaps, s.laps + delta)) } : s)),
    );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="relative overflow-hidden rounded-2xl carbon-texture team-aura border border-border p-6 sm:p-8 animate-slide-up">
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Pit wall</div>
        <h1 className="mt-1 font-display text-4xl sm:text-6xl leading-none">Strategy Simulator</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Choose a circuit, set your stints, and see how compound pace, degradation, fuel burn-off and pit loss add up
          over a full race distance.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Gauge className="h-3 w-3" /> Race parameters
          </div>

          <label className="mt-4 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground" htmlFor="circuit">
            Circuit
          </label>
          <select
            id="circuit"
            value={circuit.id}
            onChange={(e) => applyCircuit(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            {circuitList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.laps} laps
              </option>
            ))}
          </select>

          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Fact label="Laps" value={String(totalLaps)} />
            <Fact label="Tyre wear" value={`${profile?.tyreWear ?? 3}/5`} />
            <Fact label="Base lap" value={`${baseLapOf(circuit.lengthKm).toFixed(1)}s`} />
          </dl>

          <Slider
            id="pit"
            label="Pit loss"
            value={pitLoss}
            min={16}
            max={30}
            suffix="s"
            onChange={setPitLoss}
            icon={<Wrench className="h-3 w-3" />}
          />
          <Slider id="rain" label="Rain risk" value={rainRisk} min={0} max={100} suffix="%" onChange={setRainRisk} />

          <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Presets</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setStints(presetStints(totalLaps, p.sequence))}
                className="min-h-9 rounded-full border border-border bg-surface/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden glass rounded-2xl p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Timer className="h-3 w-3" /> Your strategy
          </div>

          <div
            className="mt-4 flex h-8 w-full overflow-hidden rounded-full border border-border"
            role="img"
            aria-label={`Stint plan: ${stints.map((s) => `${COMPOUNDS[s.compound].label} ${s.laps} laps`).join(", ")}`}
          >
            {stints.map((s, i) => (
              <div
                key={i}
                className="h-full transition-[width] duration-500"
                style={{
                  width: `${(s.laps / Math.max(totalLaps, result.lapsUsed)) * 100}%`,
                  background: COMPOUNDS[s.compound].color,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          <ul className="mt-3 space-y-2">
            {stints.map((s, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/40 p-2.5">
                <span className="font-display text-base w-14">Stint {i + 1}</span>
                <div className="flex gap-1">
                  {DRY.concat(["inter", "wet"] as Compound[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={s.compound === c}
                      aria-label={COMPOUNDS[c].label}
                      onClick={() => setStints((prev) => prev.map((x, j) => (j === i ? { ...x, compound: c } : x)))}
                      className={
                        "grid h-9 w-9 place-items-center rounded-full border font-timing text-xs transition-transform " +
                        (s.compound === c ? "scale-110" : "opacity-55 hover:opacity-100")
                      }
                      style={{ borderColor: COMPOUNDS[c].color, color: COMPOUNDS[c].color }}
                    >
                      {COMPOUNDS[c].short}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <StepButton label={`Fewer laps in stint ${i + 1}`} onClick={() => setLaps(i, -1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </StepButton>
                  <span className="font-timing tabular-nums w-14 text-center text-sm">{s.laps} laps</span>
                  <StepButton label={`More laps in stint ${i + 1}`} onClick={() => setLaps(i, 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </StepButton>
                  {stints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setStints((prev) => prev.filter((_, j) => j !== i))}
                      className="ml-1 min-h-9 rounded-full border border-border px-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-track-red hover:text-track-red"
                    >
                      Drop
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setStints((prev) => [...prev, { compound: "hard", laps: 10 }])}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/60 px-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Add stint
          </button>

          <div className="mt-5 rounded-xl border border-border bg-surface/40 p-4">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-3xl leading-none">{formatRaceTime(result.totalSeconds)}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {result.stops} stop{result.stops === 1 ? "" : "s"} · {result.lapsUsed}/{totalLaps} laps
              </span>
              {best && (
                <span
                  className="ml-auto font-timing tabular-nums text-sm"
                  style={{ color: result.totalSeconds <= best.result.totalSeconds ? "var(--track-green, var(--accent))" : "var(--track-yellow)" }}
                >
                  {formatGap(result.totalSeconds - best.result.totalSeconds)} vs best preset
                </span>
              )}
            </div>
            {result.warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-track-yellow">
                {result.warnings.map((w) => (
                  <li key={w}>· {w}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 relative overflow-hidden glass rounded-2xl p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
        <h2 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Strategy comparison · {circuit.name}
        </h2>
        <ol className="mt-3 space-y-2">
          {comparison.map((row, i) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/40 p-3 hover-lift"
              style={i === 0 ? { borderColor: "color-mix(in oklab, var(--accent) 55%, transparent)" } : undefined}
            >
              <span className="font-display text-2xl w-8">{i + 1}</span>
              <div className="flex gap-1">
                {row.stints.map((s, j) => (
                  <span
                    key={j}
                    className="grid h-7 w-7 place-items-center rounded-full border font-timing text-[11px]"
                    style={{ borderColor: COMPOUNDS[s.compound].color, color: COMPOUNDS[s.compound].color }}
                  >
                    {COMPOUNDS[s.compound].short}
                  </span>
                ))}
              </div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{row.label}</span>
              <span className="ml-auto font-timing tabular-nums text-sm">{formatRaceTime(row.result.totalSeconds)}</span>
              <span className="font-timing tabular-nums text-xs text-muted-foreground w-20 text-right">
                {i === 0 ? "fastest" : formatGap(row.result.totalSeconds - comparison[0].result.totalSeconds)}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          Model estimate only — real strategy depends on traffic, safety cars and track evolution.
        </p>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-2">
      <dt className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="font-timing text-lg">{value}</dd>
    </div>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
  icon,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <label htmlFor={id} className="inline-flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        <span className="font-timing tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--accent)]"
      />
    </div>
  );
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
    >
      {children}
    </button>
  );
}

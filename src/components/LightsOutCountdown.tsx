import { useEffect, useState } from "react";

interface Props {
  target: string | Date;
  label?: string;
  sublabel?: string;
}

/**
 * Lights-out countdown: 5 red lights illuminate one at a time as the clock
 * counts down. When the countdown reaches zero, all lights go dark ("lights
 * out and away we go").
 */
export function LightsOutCountdown({ target, label, sublabel }: Props) {
  const targetTime = typeof target === "string" ? new Date(target).getTime() : target.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const msLeft = Math.max(0, targetTime - now);
  const days    = Math.floor(msLeft / 86_400_000);
  const hours   = Math.floor((msLeft % 86_400_000) / 3_600_000);
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000);
  const seconds = Math.floor((msLeft % 60_000) / 1000);

  const isRaceHour = msLeft > 0 && msLeft < 3_600_000; // last hour animates lights out
  // In final 5s: lights go dark one by one. Otherwise show all 5 lit.
  const litCount = msLeft === 0 ? 0 : isRaceHour && seconds <= 4 ? 5 - (5 - seconds) : 5;

  return (
    <div className="relative overflow-hidden rounded-2xl glass-elevated p-6 sm:p-8">
      <div className="absolute inset-x-0 top-0 h-px accent-line" />

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {sublabel ?? "Next session"}
          </div>
          <div className="mt-1 font-display text-2xl sm:text-3xl text-foreground">
            {label ?? "Lights out"}
          </div>
        </div>
        <LightsGantry litCount={litCount} allDark={msLeft === 0} />
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Segment value={days} unit="Days" />
        <Segment value={hours} unit="Hours" pad />
        <Segment value={minutes} unit="Min" pad />
        <Segment value={seconds} unit="Sec" pad pulse={isRaceHour} />
      </div>
    </div>
  );
}

function LightsGantry({ litCount, allDark }: { litCount: number; allDark: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1.5 border border-border shadow-inner"
      aria-label={allDark ? "Lights out" : `${litCount} of 5 lights lit`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const lit = !allDark && i < litCount;
        return (
          <span
            key={i}
            className="block h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black/80 transition-all duration-300"
            style={{
              background: lit
                ? "radial-gradient(circle at 30% 30%, oklch(0.95 0.10 25), oklch(0.55 0.24 25))"
                : "oklch(0.20 0.010 40)",
              boxShadow: lit
                ? "0 0 12px oklch(0.60 0.24 25 / 0.9), inset 0 0 4px oklch(0.95 0.10 25 / 0.7)"
                : "inset 0 1px 2px oklch(0 0 0 / 0.6)",
            }}
          />
        );
      })}
    </div>
  );
}

function Segment({ value, unit, pad, pulse }: { value: number; unit: string; pad?: boolean; pulse?: boolean }) {
  const display = pad ? String(value).padStart(2, "0") : String(value);
  return (
    <div className="text-center rounded-lg bg-surface/60 border border-border py-3 sm:py-4">
      <div
        className={"font-timing tabular-nums text-3xl sm:text-5xl leading-none " + (pulse ? "text-gradient-accent" : "text-foreground")}
      >
        {display}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{unit}</div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Broadcast-style count-up. Renders the final value immediately on the server
 * and for users who asked for reduced motion.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  className,
  duration = 900,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const from = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);

  return (
    <span className={className} suppressHydrationWarning>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

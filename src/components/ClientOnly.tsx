import { useEffect, useState, type ReactNode } from "react";

/** Renders children only after mount — used for locale-dependent content
 *  (dates, times) that would otherwise cause SSR hydration mismatch. */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}

interface FDProps {
  iso: string | Date;
  mode?: "date" | "time" | "datetime" | "weekday-datetime";
  className?: string;
}

export function FormattedDate({ iso, mode = "datetime", className }: FDProps) {
  const [text, setText] = useState<string>("");
  useEffect(() => {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    let opts: Intl.DateTimeFormatOptions;
    switch (mode) {
      case "date":              opts = { month: "short", day: "numeric" }; break;
      case "time":              opts = { hour: "numeric", minute: "2-digit" }; break;
      case "weekday-datetime":  opts = { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }; break;
      default:                  opts = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
    }
    setText(d.toLocaleString(undefined, opts));
  }, [iso, mode]);
  return <span className={className} suppressHydrationWarning>{text || "\u00A0"}</span>;
}

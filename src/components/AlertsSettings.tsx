import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { alertLabel, useLiveAlerts, type AlertKind } from "@/lib/live-alerts";

const KINDS: AlertKind[] = ["session", "start", "sc", "vsc", "red", "yellow", "double-yellow", "drs", "chequered", "result"];

const SEVERITIES: { value: 0 | 1 | 2 | 3; label: string }[] = [
  { value: 0, label: "All" },
  { value: 1, label: "Notice" },
  { value: 2, label: "Important" },
  { value: 3, label: "Critical" },
];

/** Header control that opens the in-app live alerts preferences panel. */
export function AlertsSettings() {
  const { settings, updateSettings, clear } = useLiveAlerts();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleKind = (kind: AlertKind) =>
    updateSettings({
      muted: settings.muted.includes(kind) ? settings.muted.filter((k) => k !== kind) : [...settings.muted, kind],
    });

  return (
    <div className="relative shrink-0" ref={wrap}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Alert settings"
        className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
      >
        {settings.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl glass-elevated border border-border shadow-broadcast motion-safe:animate-slide-up">
          <div className="h-px w-full accent-line" />
          <div className="flex items-center gap-2 px-4 pt-3">
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Live alerts</div>
              <div className="font-display text-lg leading-tight">Alert settings</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close alert settings"
              className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <Row
              label="In-app alerts"
              hint="Toasts for sessions and race control"
              checked={settings.enabled}
              onChange={(v) => updateSettings({ enabled: v })}
            />
            <Row
              label="Pinned banners"
              hint="Keep critical events at the top"
              checked={settings.banners}
              onChange={(v) => updateSettings({ banners: v })}
            />

            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Minimum severity</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => updateSettings({ minSeverity: s.value })}
                    aria-pressed={settings.minSeverity === s.value}
                    className={
                      "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors " +
                      (settings.minSeverity === s.value
                        ? "border-accent/60 bg-accent/10 text-foreground"
                        : "border-border bg-surface/50 text-muted-foreground hover:text-foreground")
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Event types</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {KINDS.map((k) => {
                  const on = !settings.muted.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleKind(k)}
                      aria-pressed={on}
                      className={
                        "rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest transition-colors " +
                        (on
                          ? "border-border bg-surface text-foreground"
                          : "border-border/60 bg-transparent text-muted-foreground line-through")
                      }
                    >
                      {alertLabel(k)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={clear}
              className="w-full rounded-full border border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
            >
              Clear active alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-w-0 cursor-pointer items-center gap-3">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors " +
          (checked ? "border-accent/60 bg-accent/25" : "border-border bg-surface")
        }
      >
        <span
          className={
            "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-foreground transition-all " +
            (checked ? "left-[1.4rem]" : "left-0.5")
          }
          style={{ height: "1.125rem", width: "1.125rem" }}
        />
      </button>
    </label>
  );
}

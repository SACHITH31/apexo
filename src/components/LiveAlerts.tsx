import { X } from "lucide-react";
import { AlertTriangle, Flag, Gauge, Radio, ShieldAlert, Timer, Zap } from "lucide-react";
import { alertColor, alertLabel, useLiveAlerts, type AlertKind, type LiveAlert } from "@/lib/live-alerts";

const ICONS: Record<string, typeof Flag> = {
  session: Timer,
  start: Zap,
  green: Flag,
  yellow: AlertTriangle,
  "double-yellow": AlertTriangle,
  red: ShieldAlert,
  sc: ShieldAlert,
  vsc: ShieldAlert,
  chequered: Flag,
  penalty: AlertTriangle,
  "track-limits": AlertTriangle,
  drs: Gauge,
  pit: Timer,
  "fastest-lap": Timer,
  result: Flag,
  info: Radio,
};

function AlertIcon({ kind, className }: { kind: AlertKind; className?: string }) {
  const Icon = ICONS[kind] ?? Radio;
  return <Icon className={className} />;
}

/**
 * In-app live alert host — a pinned broadcast banner for critical events plus a
 * stack of auto-dismissing toasts. No push notifications, no service worker.
 */
export function LiveAlerts() {
  const { alerts, banner, dismiss } = useLiveAlerts();

  return (
    <>
      {/* Screen-reader announcements */}
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {alerts.map((a) => (
          <p key={a.id}>{`${alertLabel(a.kind)}: ${a.title}${a.message ? `. ${a.message}` : ""}`}</p>
        ))}
      </div>

      {banner && <AlertBanner alert={banner} onDismiss={() => dismiss(banner.id)} />}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:right-6 lg:left-auto lg:items-end"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {alerts.map((a) => (
          <AlertToast key={a.id} alert={a} onDismiss={() => dismiss(a.id)} />
        ))}
      </div>
    </>
  );
}

function AlertBanner({ alert, onDismiss }: { alert: LiveAlert; onDismiss: () => void }) {
  const color = alertColor(alert.kind);
  return (
    <div
      role="status"
      className="sticky top-16 z-40 glass-elevated border-b border-border/60 motion-safe:animate-slide-up"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: color }} />
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border"
          style={{ borderColor: color, color }}
        >
          <AlertIcon kind={alert.kind} className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{alertLabel(alert.kind)}</div>
          <div className="font-display text-lg leading-tight truncate">{alert.title}</div>
        </div>
        {alert.message && (
          <div className="hidden sm:block truncate text-xs text-muted-foreground">{alert.message}</div>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AlertToast({ alert, onDismiss }: { alert: LiveAlert; onDismiss: () => void }) {
  const color = alertColor(alert.kind);
  return (
    <div
      role="status"
      className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl glass-elevated border border-border shadow-broadcast motion-safe:animate-slide-up"
    >
      <div className="h-0.5 w-full" style={{ background: color }} />
      <div className="flex items-start gap-3 p-3.5">
        <span
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border"
          style={{ borderColor: color, color }}
        >
          <AlertIcon kind={alert.kind} className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{alertLabel(alert.kind)}</div>
          <div className="font-display text-base leading-tight">{alert.title}</div>
          {alert.message && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{alert.message}</p>}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

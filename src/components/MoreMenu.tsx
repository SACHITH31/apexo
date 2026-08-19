import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { isMoreRoute, moreNav } from "@/lib/nav-config";

/**
 * Adaptive overflow navigation. Secondary routes live here so the desktop
 * header never overflows as Apexo grows — add entries to nav-config and the
 * panel picks them up with no layout work.
 */
export function MoreMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = isMoreRoute(pathname);

  const close = useCallback(() => {
    setOpen(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // route change closes the panel
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        btnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const items = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']") ?? []);

  const focusAt = (i: number) => {
    const list = items();
    if (!list.length) return;
    list[(i + list.length) % list.length].focus();
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusAt(0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusAt(-1));
    }
  };

  const onPanelKey = (e: React.KeyboardEvent) => {
    const list = items();
    const idx = list.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "ArrowDown") { e.preventDefault(); focusAt(idx + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusAt(idx - 1); }
    else if (e.key === "Home") { e.preventDefault(); focusAt(0); }
    else if (e.key === "End") { e.preventDefault(); focusAt(-1); }
    else if (e.key === "Tab") close();
  };

  const hoverOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  return (
    <div
      ref={wrapRef}
      className="relative shrink-0"
      onMouseEnter={hoverOpen}
      onMouseLeave={hoverClose}
    >
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        className={
          "relative flex shrink-0 items-center gap-1 whitespace-nowrap px-3 py-1.5 text-sm font-medium uppercase tracking-wider transition-colors " +
          (active || open ? "text-foreground" : "text-muted-foreground hover:text-foreground")
        }
      >
        More
        <ChevronDown
          className={"h-3.5 w-3.5 transition-transform duration-200 " + (open ? "rotate-180" : "")}
          aria-hidden
        />
        {active && (
          <span className="absolute -bottom-0.5 left-2 right-2 h-0.5 accent-line rounded-full" />
        )}
      </button>

      {open && (
        <div
          id={panelId}
          ref={panelRef}
          role="menu"
          aria-label="More navigation"
          onKeyDown={onPanelKey}
          className="absolute left-0 top-full z-50 mt-2 w-[34rem] max-w-[calc(100vw-2rem)] origin-top overflow-hidden rounded-2xl border border-border/70 glass-elevated carbon-texture shadow-2xl animate-slide-up"
        >
          <div className="h-px accent-line opacity-70" />
          <div className="grid grid-cols-2 gap-x-4 p-3">
            {moreNav.map((group, gi) => (
              <div
                key={group.title}
                className={
                  "py-2 " +
                  (gi >= 2 ? "border-t border-border/50 " : "") +
                  (gi % 2 === 1 ? "sm:border-l sm:border-border/50 sm:pl-4" : "")
                }
              >
                <div className="px-2 pb-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {group.title}
                </div>
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    role="menuitem"
                    onClick={close}
                    className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:bg-surface focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/60"
                    activeProps={{ className: "bg-surface text-foreground" }}
                  >
                    <span className="font-medium uppercase tracking-wider">{item.label}</span>
                    {item.hint && (
                      <span className="mt-0.5 block text-[11px] normal-case tracking-normal text-muted-foreground/80">
                        {item.hint}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

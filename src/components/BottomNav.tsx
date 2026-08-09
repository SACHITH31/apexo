import { Link } from "@tanstack/react-router";
import { Home, Calendar, Trophy, BarChart3, Users } from "lucide-react";

type Item = {
  to: "/" | "/calendar" | "/standings" | "/statistics" | "/drivers";
  label: string;
  icon: typeof Home;
  exact?: boolean;
};

const items: Item[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/standings", label: "Standings", icon: Trophy },
  { to: "/statistics", label: "Stats", icon: BarChart3 },
  { to: "/drivers", label: "Drivers", icon: Users },
];

/** Native-feeling bottom tab bar for mobile. Hidden on lg+. */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-elevated border-t border-border/60 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-70" />
      <ul className="mx-auto grid max-w-3xl grid-cols-5 px-1">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to} className="relative">
              <Link
                to={it.to}
                activeOptions={{ exact: it.exact }}
                aria-label={it.label}
                className="group relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-all duration-200 active:scale-90 hover:text-foreground tap-highlight-none"
                activeProps={{ className: "text-accent" }}
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden
                      className={`absolute -top-px left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full transition-all duration-300 ${
                        isActive ? "accent-line opacity-100 shadow-[0_0_12px_currentColor]" : "opacity-0"
                      }`}
                    />
                    <span
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
                        isActive
                          ? "bg-accent/12 shadow-[inset_0_0_0_1px_hsl(var(--accent)/0.35)]"
                          : "group-hover:bg-surface/60"
                      }`}
                    >
                      <Icon
                        className={`h-[19px] w-[19px] transition-transform duration-200 ${
                          isActive ? "scale-105" : "group-active:scale-90"
                        }`}
                        strokeWidth={isActive ? 2.4 : 1.9}
                      />
                    </span>
                    <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-80"}`}>
                      {it.label}
                    </span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

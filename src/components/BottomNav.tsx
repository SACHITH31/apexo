import { Link } from "@tanstack/react-router";
import { Home, Calendar, Trophy, Users, Flag } from "lucide-react";

type Item = {
  to: "/" | "/calendar" | "/standings" | "/drivers" | "/circuits";
  label: string;
  icon: typeof Home;
  exact?: boolean;
};

const items: Item[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/standings", label: "Standings", icon: Trophy },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/circuits", label: "Circuits", icon: Flag },
];

/** Native-feeling bottom tab bar for mobile. Hidden on lg+. */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-elevated border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                activeOptions={{ exact: it.exact }}
                className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors active:scale-95 hover:text-foreground"
                activeProps={{ className: "text-accent" }}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
                    <span>{it.label}</span>
                    {isActive && (
                      <span className="absolute -top-px h-0.5 w-8 accent-line rounded-full" />
                    )}
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

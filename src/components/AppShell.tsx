import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTeamTheme } from "@/lib/theme";
import { teams } from "@/lib/mock-data";
import { PageTransition } from "./PageTransition";
import { OfflineBanner } from "./OfflineBanner";
import { BottomNav } from "./BottomNav";
import { AlertsSettings } from "./AlertsSettings";
import { SeasonSelector } from "./SeasonSelector";

const nav = [
  { to: "/",              label: "Home" },
  { to: "/calendar",      label: "Calendar" },
  { to: "/season-story",  label: "Season Story" },
  { to: "/standings",     label: "Standings" },
  { to: "/statistics",    label: "Statistics" },
  { to: "/compare",       label: "Compare" },
  { to: "/simulator",     label: "Simulator" },
  { to: "/strategy",      label: "Strategy" },

  { to: "/drivers",       label: "Drivers" },
  { to: "/constructors",  label: "Teams" },
  { to: "/circuits",      label: "Circuits" },
  { to: "/playground",    label: "Playground" },
  { to: "/glossary",      label: "Glossary" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { favoriteTeam, setFavoriteTeam } = useTeamTheme();

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <LogoMark />
            <span className="font-display text-2xl tracking-widest">APEXO</span>
          </Link>

          <nav className="ml-6 hidden min-w-0 flex-1 lg:flex items-center gap-1 overflow-x-auto no-scrollbar">

            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="shrink-0 whitespace-nowrap px-3 py-1.5 text-sm font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors relative"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: n.to === "/" }}
              >

                {({ isActive }) => (
                  <>
                    {n.label}
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-2 right-2 h-0.5 accent-line rounded-full" />
                    )}
                  </>
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 shrink items-center gap-2">
            <Link
              to="/search"
              className="hidden sm:flex min-w-0 items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors w-52 max-w-full"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Search drivers, races…</span>
            </Link>
            <Link to="/search" className="sm:hidden shrink-0 p-2 rounded-md hover:bg-surface" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>

            <select
              value={favoriteTeam}
              onChange={(e) => setFavoriteTeam(e.target.value as never)}
              className="hidden md:block min-w-0 max-w-40 shrink truncate rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium uppercase tracking-wider hover:border-accent/50 focus:border-accent outline-none transition-colors"
              aria-label="Favorite team accent color"
            >
              {Object.values(teams).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>


            <SeasonSelector />
            <AlertsSettings />

            <button
              className="lg:hidden shrink-0 p-2 rounded-md hover:bg-surface"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="h-px accent-line opacity-60" />

        {open && (
          <nav className="lg:hidden glass-elevated border-t border-border/50">
            <div className="mx-auto max-w-7xl px-4 py-3 grid grid-cols-2 gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-md text-sm font-medium uppercase tracking-wider text-muted-foreground hover:bg-surface hover:text-foreground"
                  activeProps={{ className: "bg-surface text-foreground" }}
                >
                  {n.label}
                </Link>
              ))}
              <div className="col-span-2 pt-2">
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Accent team</label>
                <select
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value as never)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                >
                  {Object.values(teams).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </nav>
        )}
      </header>

      <OfflineBanner />

      <main className="w-full min-w-0 flex-1 pb-20 lg:pb-0 tap-highlight-none">
        <PageTransition>{children}</PageTransition>
      </main>

      <footer className="border-t border-border/50 mt-12 pb-20 lg:pb-0">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 text-xs text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-display tracking-widest text-sm text-foreground">APEXO</span>
          <span>Unofficial F1 companion. Not affiliated with the FIA or Formula One Group.</span>
          <span className="ml-auto">Data placeholders — live sync coming soon.</span>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}

function LogoMark() {
  return (
    <div className="relative h-8 w-8 rounded-md carbon-texture border border-border flex items-center justify-center overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 accent-line" />
      <span className="font-display text-lg text-foreground translate-y-[1px]">A</span>
    </div>
  );
}

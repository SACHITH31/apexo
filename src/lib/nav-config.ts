// Adaptive navigation model. Primary items stay in the desktop bar; everything
// else is organised into labelled groups inside the "More" dropdown so the
// header never overflows as Apexo grows.

export interface NavItem {
  to: string;
  label: string;
  /** Short helper line shown inside the More dropdown. */
  hint?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const primaryNav: readonly NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/calendar", label: "Calendar" },
  { to: "/season-story", label: "Season Story" },
  { to: "/standings", label: "Standings" },
  { to: "/statistics", label: "Statistics" },
] as const;

export const moreNav: readonly NavGroup[] = [
  {
    title: "Racing",
    items: [
      { to: "/simulator", label: "Simulator", hint: "Project the title fight" },
      { to: "/strategy", label: "Strategy", hint: "Pit windows & tyre plans" },
      { to: "/championship", label: "Championship Playback", hint: "Round-by-round replay" },
    ],
  },
  {
    title: "Analysis",
    items: [
      { to: "/compare", label: "Compare", hint: "Driver & team head-to-head" },
      { to: "/seasons", label: "Season Comparison", hint: "Any two seasons, side by side" },
      { to: "/records", label: "Records", hint: "Streaks, milestones, record book" },
    ],
  },
  {
    title: "Explore",
    items: [
      { to: "/drivers", label: "Drivers", hint: "Grid profiles & careers" },
      { to: "/constructors", label: "Teams", hint: "Garages and history" },
      { to: "/circuits", label: "Circuits", hint: "Corner-by-corner explorer" },
    ],
  },
  {
    title: "Tools",
    items: [
      { to: "/playground", label: "Playground", hint: "What-if experiments" },
      { to: "/glossary", label: "Glossary", hint: "Every term, explained" },
    ],
  },
] as const;

/** Flat list (primary first) — used by the untouched mobile hamburger menu. */
export const allNav: readonly NavItem[] = [
  ...primaryNav,
  ...moreNav.flatMap((g) => g.items),
];

export function isMoreRoute(pathname: string) {
  return moreNav.some((g) =>
    g.items.some((i) => pathname === i.to || pathname.startsWith(i.to + "/")),
  );
}

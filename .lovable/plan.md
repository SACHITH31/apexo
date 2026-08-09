# Apexo — Product Plan & Build Roadmap

Decisions made on your behalf (all reversible — tell me what to change).

## 1. Vision

Apexo is a fast, beautiful, ad-free F1 companion for **both casual and hardcore fans** — simple on the surface, deep on tap. Differentiator: broadcast-grade design, instant countdown/live state, and explain-it-to-me features (glossary, plain-English strategy) that the official app lacks.

## 2. Branding (already established, keeping it)

- Name: Apexo. Dark-first theme, carbon-fiber texture, racing accent lines.
- Accent: user-selectable team color, Ferrari red default.
- Type: display face for headlines, tabular "timing" face for numbers.
- Language: premium broadcast, not playful.

## 3. Feature set (phased)

**Have today (Phase 1/1.5):** calendar, standings, drivers, teams, circuits, race pages, search, glossary, on-this-day, skeletons, offline banner, PWA install, bottom nav.

**Phase 2 — Real data**
- Lovable Cloud backend + scheduled sync from Jolpica (Ergast successor) for schedule, results, standings, qualifying, sprint.
- `live` race state: in-progress detection, LIVE badge on home hero, live leaderboard via OpenF1.
- Weather per session (Open-Meteo — free, no key, no attribution headaches).

**Phase 3 — Depth**
- Driver vs driver and team vs team comparison.
- Lap times, pit stop analysis, tire strategy chart per race.
- Career statistics and race history.

**Phase 4 — Personal**
- Accounts (Google + email + guest mode), favorites for drivers/teams.
- Push notifications: race start, qualifying start, results posted.
- Settings: theme, units (km/mi, °C/°F), notification toggles, accent team.

**Deliberately excluded for now:** telemetry, video, podcasts, community, fantasy, admin panel, ads. Reason: licensing risk or scope. Revisit after launch.

## 4. Navigation

Five bottom tabs (mobile) / full nav (desktop): **Home · Races · Standings · Drivers · More**. "More" holds Teams, Circuits, Glossary, Search, Settings.

## 5. Screen contents

- **Home:** next/live race hero with countdown or live bar, championship top 3 (drivers + constructors), last race podium, on-this-day, favorite team module, weather chip.
- **Race:** session schedule with local times, circuit signature map, weather, results/qualifying/sprint tabs, pit + tire strategy, live timing when live.
- **Driver:** hero with generated illustration, number, nationality, age, team, career wins/poles/podiums/championships, season form, bio.
- **Team:** livery-colored hero, principal, base, power unit, drivers, championships, season points chart, history.
- **Circuit:** traced layout, length, corners, DRS zones, lap record, first GP, weather, facts.
- **Search:** drivers, teams, circuits, races, glossary terms — one unified index.

## 6. Assets & legal

No copyrighted F1 photos, logos, or official track maps. Use generated illustrations, SVG circuit tracings, and team-color abstractions. All swappable later if you license real assets.

## 7. PWA

Manifest + icons shipped. Add: app shortcuts (Next race, Standings), splash colors, portrait-primary orientation, and offline support only in Phase 4 alongside push (guarded service worker so previews never break).

## 8. Technical architecture

- TanStack Start + React 19 + Tailwind v4 (current stack, no change).
- Lovable Cloud (Postgres) for cached F1 data — never call third-party APIs from the browser.
- Server functions for reads; `/api/public/*` route for a cron-triggered sync job.
- Tables: `seasons`, `races`, `sessions`, `drivers`, `teams`, `circuits`, `race_results`, `qualifying_results`, `standings_snapshots`, `lap_times`, `pit_stops`, `profiles`, `favorites`, `push_subscriptions`. RLS on all; public data readable by `anon`, user data scoped to `auth.uid()`; roles in a separate `user_roles` table.
- TanStack Query for caching, route loaders with `ensureQueryData`.

## 9. Roadmap

1. **Phase 2a** — Enable Cloud, schema + sync job, swap mock data for real data behind the same interfaces.
2. **Phase 2b** — Live race state + OpenF1 live leaderboard + weather.
3. **Phase 3** — Comparisons, lap/pit/tire analysis, statistics.
4. **Phase 4** — Auth, favorites, notifications, settings, offline.

## What I'd start with on approval

Phase 2a: enable Lovable Cloud, create the schema with grants and RLS, build the sync server route, and switch the existing pages from mock data to live database reads with zero UI regression.

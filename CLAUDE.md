# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GM-OS is a Dungeon Master management tool for tabletop RPG campaigns, built as a React SPA backed by Supabase. All application code lives in `~/gm-os/` (sibling directory to this repo).

## Commands

All commands run from `~/gm-os/`:

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint (quiet mode)
npm run lint:fix     # Auto-fix ESLint issues
npm run typecheck    # JSDoc/TS type checking via jsconfig.json
npm run seed:demo    # Seed a demo campaign (reads .env.local)
```

There is no test suite configured.

## Architecture

### Frontend Stack
- **React 18** + **React Router 6** (client-side routing)
- **Vite 6** + **@vitejs/plugin-react** (build)
- **TanStack React Query** (server state management)
- **React Hook Form** + **Zod** (form handling & validation)
- **Tailwind CSS** + **shadcn/ui** (Radix UI-based components in `src/components/ui/`)
- **Framer Motion**, **cmdk** (command palette), **react-leaflet**, **recharts**

### OS Shell / Chrome
GM-OS is styled as a desktop operating system. The key chrome pieces live in `src/components/layout/`:
- **Taskbar.jsx** — full-width top bar: Start button (`data-start-button`), active-mode badge (Prep/Session/Debrief, clickable → session), breadcrumbs, and the system tray (search, `TrayAudioPlayer`, `TrayNotifications`, `ThemeToggle`, clock).
- **CommandPalette.jsx** — ⌘K palette (cmdk) with Search / Create / Go-to groups and inline dice rolling.
- **NavMenu.jsx** + **Sidebar.jsx** — dock/float navigation. `src/Layout.jsx` owns `navMode` ('docked'|'floating', persisted to `localStorage` key `gmos_nav_mode`); the Start button and sidebar chevron toggle docked vs. a floating dropdown. `useMediaQuery('(min-width: 768px)')` resets nav state on breakpoint changes.
- **BootSequence.jsx** — startup animation, gated by `localStorage` key `gmos_booted`.
- **ToolDock.jsx**, **TrayNotifications.jsx** (+ `NotificationContext`), **TrayAudioPlayer.jsx** (+ `AudioPlayerContext`, plays a YouTube link), **ShortcutsHelp.jsx** (the `?` overlay), **QuickCapture.jsx** (floating + button), **LandingPage.jsx** (pre-auth marketing page).

### Keyboard Shortcuts
Implemented via `src/lib/useHotkeys.js` and gated by `src/lib/useHotkeysEnabled.js` (suppressed while typing in inputs):
- **⌘K / Ctrl+K** — Command Palette
- **⌥N / Alt+N** — quick-create menu
- **?** — shortcuts help overlay
- **Esc** — close the active palette/menu/overlay

### Theme — Teenage Engineering (IMPORTANT GOTCHA)
The TE look is implemented by **overriding Tailwind's color scales** in `tailwind.config.js`, not by adding new color names:
- `amber` is overridden to a TE signal-orange ramp (`amber-500` = `#ff4d1c`).
- `zinc` is overridden to a flat warm-gray ramp.
- `index.css` CSS vars are hue-shifted (accent 38→13, neutral 240→30); `--radius` is `0.375rem`.

**Gotcha:** class names no longer match their stock colors — `text-amber-500` renders signal-orange, `bg-zinc-800` renders warm-gray. Don't "fix" these to other color names expecting stock Tailwind values. Intentional categorical palettes (entity-type rainbow, D&D rarity, HP gradient, Google logo) are left untouched.

### Entity-Type Presentation — single source
`src/lib/entityColors.js` is the **single source of truth** for per-entity-type color, icon, and label. It exports `ENTITY_TYPE_META` (per type: `label`, `Icon` lucide component, `text`, `dot`, `bg`, `tag`, `badge`), a back-compat alias `ENTITY_TYPE_COLORS = ENTITY_TYPE_META`, and `getEntityColors(type)` (falls back to `npc`). Never re-define a local type→color map; derive from this. (Exception: `InitiativeTracker` keeps its own combat friend/foe row tints.)

### Supabase Backend
The app uses Supabase as its backend. The client is initialized in `src/api/supabaseClient.js`. Authentication is handled via Supabase Auth (Google OAuth **and** email/password) in `src/lib/AuthContext.jsx`. Requires `.env.local`:
```
VITE_SUPABASE_URL=<project_url>
VITE_SUPABASE_ANON_KEY=<anon_key>
```

Supabase project: `suofaewpbrzbixplwzvs` (us-east-1). Tables (8): `campaigns`, `world_entities`, `sessions`, `relationships`, `quick_notes`, `campaign_maps`, `random_tables`, `user_profiles`. RLS on all tables (owner-based: `created_by = auth.uid()`; child tables gated through campaign ownership; `user_profiles` has no UPDATE policy so users can't self-modify their plan).

### Routing
Pages are auto-registered from `src/pages/` via `src/pages.config.js` (auto-generated — do not manually edit). Page components: CampaignList, CampaignDashboard, CampaignMap, CampaignNotes, CampaignSettings, EntityBrowser, EntityDetail, RelationshipMap, SessionBrowser, SessionPage, RandomTableBrowser, CampaignTimeline, PlayerView, About. The public player share route (`/player-view/public`, rendered by `PublicPlayerView.jsx`) is wired directly in `src/App.jsx` outside the authenticated app and needs no account.

**Important:** `CAMPAIGN_PAGES` array in `src/Layout.jsx` controls which pages get the sidebar layout. Any new campaign-scoped page must be added to this array or it will load without a sidebar.

### Component Organization
```
src/components/
├── ui/            # shadcn/ui base components (Radix-based)
├── entity/        # Per-entity-type components (NPC, Creature, Location, Faction, etc.)
├── session/       # Session wizard, prep, GM screen, combat/initiative, debrief
├── dashboard/     # Campaign dashboard widgets
├── prep/          # Session prep materials
├── layout/        # Taskbar, tray apps, command palette, sidebar/nav, landing, boot
├── relationships/ # Relationship graph/mapping
├── map/           # React Leaflet map components
├── encounter/     # Encounter builder
├── tables/        # Random table card + dialog
└── common/        # EntityMentionTextarea, EntityQuickViewModal
```

Entity types: NPCs, Player Characters, Creatures, Locations, Factions, Deities, Items, Shops, Events, Encounters, Lore, Threads.

### Serverless Functions
`functions/` contains TypeScript/Deno Edge Functions deployed to Supabase. Deployed slugs → local files:
- `create-demo-for-user` (`createDemoForUser.ts`) — seeds a demo campaign for a user
- `export-campaign` (`exportCampaign.ts`) — full campaign backup (all tables) using service role
- `import-campaign` (`importCampaign.ts`) — full campaign restore with ID remapping; new records owned by importing user; CORS + transactional rollback on partial failure (`verify_jwt=false`)
- `import-dndbeyond` (`importDndBeyondCharacter.ts`) — fetches public D&D Beyond character (numeric-ID validated) and maps to WorldEntity shape
- `player-view` (`playerView.ts`) — player-safe projection for the public share link; returns only whitelisted columns, player-visible entity types, and `players_know`/`players_suspect` visibility (`verify_jwt=false`)
- `invoke-llm` (`invoke-llm.ts`) — **decommissioned.** Returns HTTP 410 and never reads `ANTHROPIC_API_KEY`. There are no AI features in the app; do not re-introduce LLM calls without revisiting the key-exposure/cost surface.

### Path Aliases
`@/*` maps to `src/*` (configured in `jsconfig.json` and `vite.config.js`).

### ESLint Rules
ESLint flat config (`eslint.config.js`), scoped to `src/components`, `src/pages`, `src/Layout.jsx` (ignores `src/lib`, `src/components/ui`):
- **`no-undef`** is an **error** (re-enabled after a crash from an unimported icon; the flat config's explicit `rules` block had silently dropped it).
- Unused imports are **errors**; unused variables are **warnings** (`_`-prefixed vars exempt).
- React hooks rules enforced.
- No prop-types required (JSDoc type checking via `jsconfig.json` with `checkJs: true`).

## Deployment
Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml` (Node 22; runs lint + build with `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` secrets). Base path is `/GM-OS/`. Internal navigation must use `useNavigate()` rather than `window.location.href` (the base path otherwise breaks links).

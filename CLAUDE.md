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
```

There is no test suite configured.

## Architecture

### Frontend Stack
- **React 18** + **React Router 6** (client-side routing, 8 pages)
- **Vite 6** + **@vitejs/plugin-react** (build)
- **TanStack React Query** (server state management)
- **React Hook Form** + **Zod** (form handling & validation)
- **Tailwind CSS** + **shadcn/ui** (Radix UI-based components in `src/components/ui/`)

### Supabase Backend
The app uses Supabase as its backend. The client is initialized in `src/api/supabaseClient.js`. Authentication is handled via Supabase Auth (Google OAuth) in `src/lib/AuthContext.jsx`. Requires `.env.local`:
```
VITE_SUPABASE_URL=<project_url>
VITE_SUPABASE_ANON_KEY=<anon_key>
```

Supabase project: `suofaewpbrzbixplwzvs` (us-east-1). Tables: `campaigns`, `world_entities`, `sessions`, `relationships`, `quick_notes`, `campaign_maps`, `random_tables`. RLS on all tables (owner-based: `created_by = auth.uid()`).

### Routing
Pages are auto-registered from `src/pages/` via `src/pages.config.js` (auto-generated — do not manually edit). Current routes: CampaignList, CampaignDashboard, CampaignMap, EntityBrowser, EntityDetail, RelationshipMap, SessionBrowser, SessionPage, RandomTableBrowser, CampaignTimeline, PlayerView.

**Important:** `CAMPAIGN_PAGES` array in `src/Layout.jsx` controls which pages get the sidebar layout. Any new campaign-scoped page must be added to this array or it will load without a sidebar.

### Component Organization
```
src/components/
├── ui/            # shadcn/ui base components (Radix-based)
├── entity/        # Per-entity-type components (NPC, Creature, Location, Faction, etc.)
├── session/       # Session management & playback
├── dashboard/     # Campaign dashboard widgets
├── prep/          # Session prep materials
├── layout/        # Sidebar + navigation
├── relationships/ # Relationship graph/mapping
├── map/           # React Leaflet map components
├── encounter/     # Encounter builder
└── tables/        # Random table card + dialog
```

Entity types: NPCs, Player Characters, Creatures, Locations, Factions, Deities, Items, Shops, Events, Encounters, Lore/Threads.

### Serverless Functions
`functions/` contains TypeScript/Deno Edge Functions deployed to Supabase. Deployed slugs → local files:
- `invoke-llm` (`invoke-llm.ts`) — calls Anthropic claude-haiku; requires `ANTHROPIC_API_KEY` secret in Supabase
- `export-campaign` (`exportCampaign.ts`) — full campaign backup (all tables) using service role
- `import-campaign` (`importCampaign.ts`) — full campaign restore with ID remapping; new records owned by importing user
- `import-dndbeyond` (`importDndBeyondCharacter.ts`) — fetches public D&D Beyond character and maps to WorldEntity shape

### Path Aliases
`@/*` maps to `src/*` (configured in `jsconfig.json` and `vite.config.js`).

### ESLint Rules
- Unused imports are **errors**; unused variables are **warnings** (`_`-prefixed vars exempt)
- React hooks rules enforced
- No prop-types required (JSDoc type checking via `jsconfig.json` with `checkJs: true`)

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GM-OS is a Dungeon Master management tool for tabletop RPG campaigns, built as a React SPA on the [Base44](https://base44.com) backend-as-a-service platform. All application code lives in `gm-os-extracted/`.

## Commands

All commands run from `gm-os-extracted/`:

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
- **Vite 6** + **Base44 Vite plugin** (build + backend integration)
- **TanStack React Query** (server state management)
- **React Hook Form** + **Zod** (form handling & validation)
- **Tailwind CSS** + **shadcn/ui** (Radix UI-based components in `src/components/ui/`)

### Base44 Integration
The app uses `@base44/sdk` as its only backend. There is no custom API layer — all data fetching goes through the Base44 client initialized in `src/api/base44Client.js`. Authentication is provided by Base44 via `src/lib/AuthContext.jsx`. Requires `.env.local`:
```
VITE_BASE44_APP_ID=<app_id>
VITE_BASE44_APP_BASE_URL=<backend_url>
```

### Routing
Pages are auto-registered from `src/pages/` via `src/pages.config.js` (auto-generated — do not manually edit). The 8 main routes are: CampaignList, CampaignDashboard, CampaignMap, EntityBrowser, EntityDetail, RelationshipMap, SessionBrowser, SessionPage.

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
└── encounter/     # Encounter builder
```

Entity types: NPCs, Player Characters, Creatures, Locations, Factions, Deities, Items, Shops, Events, Encounters, Lore/Threads.

### Serverless Functions
Backend logic lives in `functions/` (TypeScript/Deno, deployed via Base44):
- `importCampaign.ts` / `exportCampaign.ts` — full campaign backup/restore with ID remapping
- `importDndBeyondCharacter.ts` — D&D Beyond character import

### Path Aliases
`@/*` maps to `src/*` (configured in `jsconfig.json` and `vite.config.js`).

### ESLint Rules
- Unused imports are **errors**; unused variables are **warnings** (`_`-prefixed vars exempt)
- React hooks rules enforced
- No prop-types required (JSDoc type checking via `jsconfig.json` with `checkJs: true`)

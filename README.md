# GM-OS

A Dungeon Master operating system for tabletop RPG campaigns. Track entities, relationships, sessions, encounters, and more — all in one place.

**Live app:** https://trisdenc.github.io/GM-OS/

---

## Features

- **Campaign Dashboard** — party overview, weather generator, inventory tracker
- **Entity Browser** — NPCs, locations, factions, items, lore, deities, shops, and more
- **Relationship Map** — interactive graph of entity connections
- **Campaign Map** — pin locations with notes on a custom map image
- **Session Management** — prep, run, and debrief sessions with resource tracking
- **Encounter Builder** — XP budget calculator with D&D 5e CR tables
- **Random Tables** — create and roll on custom tables
- **Campaign Timeline** — visual history of sessions and world events
- **Player View** — read-only view of player-facing entities

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Vite 6 |
| State | TanStack React Query |
| UI | Tailwind CSS, shadcn/ui (Radix UI) |
| Backend | Supabase (auth, database, storage) |
| Deployment | GitHub Pages via GitHub Actions |

## Local Development

**Prerequisites:** Node 20+, a Supabase project

1. Clone the repo:
   ```bash
   git clone https://github.com/trisdenc/GM-OS.git
   cd GM-OS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local`:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Available Scripts

```bash
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint (errors only)
npm run lint:fix   # Auto-fix ESLint issues
```

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/deploy.yml`. The workflow runs lint, builds with Supabase credentials from repository secrets, and uploads the `dist/` folder.

Required repository secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Project Structure

```
src/
├── api/              # Supabase client + entity facade
├── components/
│   ├── ui/           # shadcn/ui base components
│   ├── entity/       # Per-entity-type field components
│   ├── session/      # Session management components
│   ├── dashboard/    # Campaign dashboard widgets
│   ├── layout/       # Sidebar, breadcrumbs, search
│   ├── map/          # React Leaflet map components
│   └── tables/       # Random table components
├── lib/              # Auth context, utilities
├── pages/            # Top-level route components
└── pages.config.js   # Route registration
functions/            # Supabase Edge Functions (TypeScript/Deno)
.github/workflows/    # GitHub Actions CI/CD
```

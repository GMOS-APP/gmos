# GM-OS

A Dungeon Master operating system for tabletop RPG campaigns. Track your world, prep smarter, and run sessions without juggling a dozen browser tabs.

**Live app:** https://trisdenc.github.io/GM-OS/ &nbsp;·&nbsp; **[User Tutorial](TUTORIAL.md)**

---

## Features

### World Building
- **Entity Browser** — 12 entity types: NPCs, Player Characters, Locations, Factions, Creatures, Items, Events, Encounters, Shops, Lore, Threads, Deities
- **Relationship Map** — interactive force-directed graph of entity connections; filter by type, status, or entity
- **Campaign Map** — pin locations on a custom map image with notes and entity links
- **D&D Beyond Import** — import Player Characters directly from a D&D Beyond public character URL

### Session Workflow
- **Session Prep** — 8-section structured prep: Recap, Intro, Events, Locations, NPCs, Encounters, Threads, Rewards
- **AI-Assisted Writing** — AI generation for every prep section (powered by Claude via Supabase Edge Functions)
- **GM Screen** — floating panel with dice roller, resource tracker, entity lookup, and quick notes during play
- **Resource Tracker** — track HP, spell slots, and abilities per PC with live edits
- **Quick Capture** — floating button to add notes from any page without leaving your current view
- **Session Debrief** — post-session notes, XP, and loot tracking

### Campaign Tools
- **Campaign Dashboard** — party passives, weather generator, active threads, recent entities, private scratchpad
- **Random Tables** — create weighted tables and roll mid-session
- **Campaign Timeline** — visual history of sessions and world events
- **Player View** — read-only view of player-safe entities to share with your party
- **Global Search** — search all entities in the campaign from any page

### AI Features (requires `ANTHROPIC_API_KEY` secret in Supabase)
- Prep section drafts (recap, intro scene, events, location details, NPC goals, threads, rewards)
- In-session NPC dialogue generator (entity-linked, system-aware)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Vite 6 |
| State | TanStack React Query |
| UI | Tailwind CSS, shadcn/ui (Radix UI) |
| Backend | Supabase (auth, PostgreSQL, storage) |
| Edge Functions | TypeScript/Deno on Supabase |
| AI | Anthropic Claude (claude-haiku via Edge Functions) |
| Deployment | GitHub Pages via GitHub Actions |

---

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

**AI features** (optional): Deploy the `invoke-llm` Edge Function to Supabase and set `ANTHROPIC_API_KEY` as a Supabase secret. Without it the app works fully — AI generate buttons will return errors.

**Demo campaign**: After signing in, use the "Load Demo Campaign" button on the campaigns list page to populate a sample campaign for exploration.

---

## Available Scripts

```bash
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint (errors only)
npm run lint:fix   # Auto-fix ESLint issues
```

---

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/deploy.yml`. The workflow runs lint, builds with Supabase credentials from repository secrets, and uploads the `dist/` folder.

Required repository secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Project Structure

```
src/
├── api/              # Supabase client + entity CRUD facade
├── components/
│   ├── ui/           # shadcn/ui base components (Radix-based)
│   ├── entity/       # Per-entity-type field editors + stat block views
│   ├── session/      # PrepTab, RunTab, GMScreen, ResourceTracker, Debrief
│   ├── dashboard/    # Campaign dashboard widgets
│   ├── layout/       # Sidebar, breadcrumbs, global search, quick capture
│   ├── relationships/# Relationship graph + dialog
│   ├── map/          # React Leaflet map components
│   ├── encounter/    # XP budget calculator
│   ├── prep/         # Entity pickers used in PrepTab
│   ├── tables/       # Random table card + roll dialog
│   └── common/       # EntityMentionTextarea, EntityQuickViewModal
├── lib/              # AuthContext, CampaignContext, utilities
├── pages/            # Top-level route components (11 pages)
└── pages.config.js   # Route registration (auto-generated)
functions/            # Supabase Edge Functions (TypeScript/Deno)
.github/workflows/    # GitHub Actions CI/CD
```

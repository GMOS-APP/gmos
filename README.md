# GM-OS

A Dungeon Master operating system for tabletop RPG campaigns. Track your world, prep smarter, and run sessions without juggling a dozen browser tabs.

**Live app:** https://trisdenc.github.io/GM-OS/ &nbsp;·&nbsp; **[User Tutorial](TUTORIAL.md)**

---

## Features

### World Building
- **Entity Browser** — 12 entity types: NPCs, Player Characters, Locations, Factions, Creatures, Items, Events, Encounters, Shops, Lore, Threads, Deities
- **Open5e Import** — search and import monsters, magic items, and spells directly from the Open5e SRD database into your campaign
- **D&D Beyond Import** — import Player Characters directly from a D&D Beyond public character URL
- **Relationship Map** — interactive force-directed graph of entity connections; filter by type, status, or entity
- **Campaign Map** — pin locations on a custom map image with notes and entity links

### Session Workflow
- **Lazy RPG Prep Wizard** — 8-step guided session creation following the [Sly Flourish Lazy GM method](https://slyflourish.com/lazy_gm_resource_document.html): Characters → Strong Start → Scenes → Secrets & Clues → Locations → NPCs → Monsters → Rewards
- **Quick Wizard** — 4-step guided setup for Goals, Opening, Scenes
- **Session Prep** — structured prep sections: Recap, Intro, Events, Locations, NPCs, Encounters, Threads, Rewards
- **GM Screen** — floating panel with dice roller, resource tracker, entity lookup, and quick notes during play
- **Resource Tracker** — track HP, spell slots, and abilities per PC with live edits
- **Quick Capture** — floating button to add notes from any page without leaving your current view
- **Session Debrief** — post-session notes, XP, and loot tracking

### Campaign Tools
- **Campaign Dashboard** — party passives, weather generator, active threads, recent entities, timer, and private scratchpad
- **Random Tables** — create weighted tables and roll mid-session
- **Campaign Timeline** — visual history of sessions and world events
- **Player View** — read-only view of player-safe entities to share with your party
- **Global Search** — search all entities in the campaign from any page
- **Export / Import** — full campaign backup and restore as JSON

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Vite 6 |
| State | TanStack React Query |
| UI | Tailwind CSS, shadcn/ui (Radix UI) |
| Backend | Supabase (auth, PostgreSQL, storage) |
| Edge Functions | TypeScript/Deno on Supabase |
| External Data | Open5e API (monsters, magic items, spells) |
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
│   ├── entity/       # Per-entity-type field editors, stat block views, Open5e import
│   ├── session/      # Session wizard, prep, GM screen, resource tracker, debrief
│   ├── dashboard/    # Campaign dashboard widgets (timer, scratchpad, weather, etc.)
│   ├── layout/       # Sidebar, breadcrumbs, footer, global search, quick capture
│   ├── relationships/# Relationship graph + dialog
│   ├── map/          # React Leaflet map components
│   ├── encounter/    # Encounter builder + initiative tracker
│   ├── tables/       # Random table card + roll dialog
│   └── common/       # EntityMentionTextarea, EntityQuickViewModal
├── lib/              # AuthContext, CampaignContext, utilities, system configs
├── pages/            # Top-level route components
└── pages.config.js   # Route registration (auto-generated)
functions/            # Supabase Edge Functions (TypeScript/Deno)
  ├── exportCampaign.ts
  ├── importCampaign.ts
  └── importDndBeyondCharacter.ts
.github/workflows/    # GitHub Actions CI/CD
```

---

## Attributions

- Lazy RPG Prep method from the [Lazy GM's Resource Document](https://slyflourish.com/lazy_gm_resource_document.html) by Michael E. Shea of [SlyFlourish.com](https://slyflourish.com), available under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).
- Game rules and content from the [D&D Systems Reference Document 5.1](https://dnd.wizards.com/resources/systems-reference-document) © Wizards of the Coast, available under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).
- Monster data provided by [Open5e](https://open5e.com). Content published under open licenses including [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), [CC0](https://creativecommons.org/publicdomain/zero/1.0/), and the [Open Game License v1.0a](https://www.dndbeyond.com/attachments/39j2li89/OGL_v1.0a.pdf). See each entry's source for the applicable license.

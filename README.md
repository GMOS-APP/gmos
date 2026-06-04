# GM-OS

A Dungeon Master operating system for tabletop RPG campaigns. Track your world, prep smarter, and run sessions without juggling a dozen browser tabs — all wrapped in a desktop-OS-style interface.

**Live app:** https://trisdenc.github.io/GM-OS/ &nbsp;·&nbsp; **[User Tutorial](TUTORIAL.md)**

---

## Features

### The OS Shell
GM-OS presents itself as a lightweight operating system for running games:

- **Taskbar** — full-width top bar with a Start button, the campaign's active-mode badge (Prep / Session / Debrief), breadcrumbs, and a system tray
- **System tray** — quick search, the audio player, the notification center, a theme toggle, and a live clock
- **Command Palette (⌘K)** — fuzzy search across entities, create actions, and navigation, with inline dice rolling (type `2d6` and hit enter)
- **Dockable / floating sidebar** — collapse the left sidebar into a Start-menu dropdown, or dock it back into the left rail; preference persists
- **Guided tour** — a first-visit spotlight walkthrough of the shell and GM workflow; relaunchable any time from the `?` help dialog or the Command Palette (`⌘K → "tour"`)
- **Boot sequence** — a brief startup animation on first load (tracked in `localStorage`)
- **Tool Dock & Notification Center** — quick-access tools and an in-app notification feed
- **Audio player** — play a YouTube link (ambient music, battle tracks) as a tray app while you run the game

### World Building
- **Entity Browser** — 12 entity types: NPCs, Player Characters, Locations, Factions, Creatures, Items, Events, Encounters, Shops, Lore, Threads, Deities
- **Open5e Import** — search and import monsters, magic items, and spells directly from the Open5e SRD database into your campaign
- **D&D Beyond Import** — import Player Characters from a public D&D Beyond character URL (auto-syncs on load and every 5 minutes)
- **Relationship Map** — interactive force-directed graph of entity connections; filter by type, status, or entity
- **Campaign Map** — pin locations on a custom map image with notes and entity links

### Session Workflow
- **Lazy RPG Prep Wizard** — 8-step guided session creation following the [Sly Flourish Lazy GM method](https://slyflourish.com/lazy_gm_resource_document.html): Characters → Strong Start → Scenes → Secrets & Clues → Locations → NPCs → Monsters → Rewards
- **Quick Wizard** — 4-step guided setup for Goals, Opening, Scenes
- **Session Prep** — structured prep sections (Recap, Intro, Events, Locations, NPCs, Encounters, Threads, Rewards) with markdown import/export and a printable prep sheet
- **GM Screen** — floating, always-on-top panel with dice roller, resource tracker, entity lookup, and quick notes during play
- **Initiative & Combat Tracker** — round/turn tracking that persists per campaign across reloads
- **Resource Tracker** — track HP, spell slots, and abilities per PC with live edits
- **Quick Capture** — floating button to add notes from any page without leaving your current view
- **Session Timer** — start/end a session; switching state flips the campaign's active mode (Session / Debrief)
- **Session Debrief** — post-session notes, XP, and loot tracking

### Campaign Tools
- **Campaign Dashboard** — party passives, weather generator, active threads, recent entities, timer, and private scratchpad
- **Campaign Notes** — free-form campaign notebook
- **Campaign Settings** — campaign metadata, sharing, and management
- **Random Tables** — create weighted tables and roll mid-session
- **Campaign Timeline** — visual history of sessions and world events
- **Player View** — read-only view of player-safe entities to share with your party (public share link requires no account)
- **Export / Import** — full campaign backup and restore as JSON
- **Landing & About pages** — a public landing page explaining what GM-OS is, shown before sign-in

### Theme — Teenage Engineering
The UI takes its visual language from Teenage Engineering hardware (the K.O. II sampler in particular): a warm-gray neutral palette with a single signal-orange accent. This is implemented as a **Tailwind scale override** (see the gotcha in [CLAUDE.md](CLAUDE.md)).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Vite 6 |
| State | TanStack React Query |
| Forms | React Hook Form + Zod |
| UI | Tailwind CSS, shadcn/ui (Radix UI), Framer Motion, cmdk |
| Backend | Supabase (auth, PostgreSQL, storage) |
| Auth | Supabase Auth — Google OAuth + email/password |
| Edge Functions | TypeScript/Deno on Supabase |
| External Data | Open5e API (monsters, magic items, spells), D&D Beyond |
| Deployment | GitHub Pages via GitHub Actions |

---

## Local Development

**Prerequisites:** Node 22+, a Supabase project

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
npm run typecheck  # JSDoc/TS type checking via jsconfig.json
npm run seed:demo  # Seed a demo campaign (uses .env.local)
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **⌘K** / **Ctrl+K** | Open the Command Palette (search, create, navigate, roll dice) |
| **⌥N** / **Alt+N** | Open the quick-create menu |
| **?** | Open the keyboard shortcuts help overlay |
| **Esc** | Close the open palette / menu / overlay |

Shortcuts are suppressed while you're typing in a text field.

---

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/deploy.yml` (Node 22). The workflow runs lint, builds with Supabase credentials from repository secrets, and uploads the `dist/` folder. The app is served from the `/GM-OS/` base path.

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
│   ├── session/      # Session wizard, prep, GM screen, combat/initiative, debrief
│   ├── dashboard/    # Campaign dashboard widgets (timer, scratchpad, weather, etc.)
│   ├── layout/       # Taskbar, tray apps, command palette, sidebar/nav, landing, boot
│   ├── relationships/# Relationship graph + dialog
│   ├── map/          # React Leaflet map components
│   ├── encounter/    # Encounter builder + initiative tracker
│   ├── tables/       # Random table card + roll dialog
│   └── common/       # EntityMentionTextarea, EntityQuickViewModal
├── lib/              # Auth/Campaign/Audio/Notification contexts, hooks, entityColors, utils
├── pages/            # Top-level route components
└── pages.config.js   # Route registration (auto-generated)
functions/            # Supabase Edge Functions (TypeScript/Deno)
  ├── createDemoForUser.ts       # seed a demo campaign for a user
  ├── exportCampaign.ts          # full campaign backup (service role)
  ├── importCampaign.ts          # full campaign restore with ID remapping
  ├── importDndBeyondCharacter.ts# fetch a public D&D Beyond PC
  ├── playerView.ts              # player-safe projection for the public share link
  └── invoke-llm.ts              # decommissioned (returns 410; no AI features)
.github/workflows/    # GitHub Actions CI/CD
```

---

## Security

- **Row-Level Security** on all 8 tables, owner-scoped (`created_by = auth.uid()`; child tables gated through campaign ownership). `user_profiles` has no UPDATE policy, so users can't self-modify their plan.
- **Player share link** (`playerView` edge function) projects only player-safe columns and filters to player-visible entity types and `players_know` / `players_suspect` visibility — no tokens, owner IDs, or GM-only fields leak.
- **AI decommissioned** — the `invoke-llm` function is a 410 stub that never reads any API key, removing that key-exposure and cost-abuse surface.

---

## Attributions

- Lazy RPG Prep method from the [Lazy GM's Resource Document](https://slyflourish.com/lazy_gm_resource_document.html) by Michael E. Shea of [SlyFlourish.com](https://slyflourish.com), available under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).
- Game rules and content from the [D&D Systems Reference Document 5.1](https://dnd.wizards.com/resources/systems-reference-document) © Wizards of the Coast, available under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).
- Monster data provided by [Open5e](https://open5e.com). Content published under open licenses including [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), [CC0](https://creativecommons.org/publicdomain/zero/1.0/), and the [Open Game License v1.0a](https://www.dndbeyond.com/attachments/39j2li89/OGL_v1.0a.pdf). See each entry's source for the applicable license.
- Visual design inspired by [Teenage Engineering](https://teenage.engineering) hardware.

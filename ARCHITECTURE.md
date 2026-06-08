# GM-OS — Developer Handoff & Architecture

This is the engineering guide for GM-OS: how it's built, where things live, the
conventions to follow, and how to extend it. Pair it with the product overview
in [README.md](README.md). If anything here drifts from the code, the code wins —
fix this doc.

---

## 1. What it is / stack

GM-OS is a **single-page React app** styled as a desktop operating system, for
running tabletop RPG campaigns. It's a client app backed entirely by **Supabase**
(Postgres + Auth + Storage + Edge Functions + Realtime). There is no custom
server — the "backend" is Supabase plus a set of Deno edge functions.

- **UI**: React 18, React Router 6, Vite 6 (`@vitejs/plugin-react`)
- **Server state**: TanStack React Query (`src/lib/query-client.js`)
- **Forms/validation**: React Hook Form + Zod
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives in `src/components/ui/`)
- **Misc**: framer-motion, cmdk (command palette), react-leaflet (world map),
  recharts, canvas-confetti, lucide-react (icons)
- **Backend**: Supabase project `suofaewpbrzbixplwzvs` (us-east-1)
- **Hosting**: GitHub Pages (static), auto-deployed from `main`

Language is **JavaScript with JSDoc** type-checking (not TypeScript) for app code;
edge functions are TypeScript/Deno. `npm run typecheck` runs `tsc` over
`jsconfig.json` (`checkJs: true`).

---

## 2. Getting started

Prereqs: Node 20+ (CI uses 22), npm. A Supabase project (or the existing one).

```bash
npm install
# .env.local (required):
#   VITE_SUPABASE_URL=<project url>
#   VITE_SUPABASE_ANON_KEY=<anon key>   # NO trailing whitespace (see Gotchas)
npm run dev        # Vite dev server (default :5173; base path "/")
npm run build      # production build -> dist/
npm run preview    # serve the built dist
npm run lint       # eslint --quiet (errors only)
npm run lint:fix
npm run typecheck  # JSDoc/TS checking via jsconfig.json
npm run seed:demo  # seed a demo campaign (reads .env.local)
```

There is **no automated test suite.** Verification is done by running the app and
observing it (see §11).

---

## 3. Repository layout

```
src/
├── main.jsx              # entry; initAccent() before render
├── App.jsx               # providers + top-level Router; public vs authed routes
├── Layout.jsx            # campaign shell: desktop window-manager OR mobile pages
├── pages.config.js       # PAGES map (page key -> component) + mainPage
├── pages/                # one component per route (see §4)
├── components/
│   ├── ui/               # shadcn/Radix base components (Button, Dialog, ...)
│   ├── layout/           # Taskbar, Sidebar, NavMenu, CommandPalette, Desktop,
│   │                     #   Window, WindowContent, BootSequence, Footer, etc.
│   ├── entity/           # per-entity-type UI (EntityAvatar, EntityCard, ...)
│   ├── session/          # session wizard, prep, GM screen, combat/initiative
│   ├── encounter/        # encounter builder + initiative tracker
│   ├── dashboard/        # campaign dashboard widgets
│   ├── prep/             # session prep materials
│   ├── map/              # world map (leaflet-ish) + TokenLayer/PlayerBattleMap
│   ├── relationships/    # relationship graph
│   ├── party/            # player-facing party inventory / notes
│   ├── tables/           # random tables
│   ├── tools/            # name generator, etc.
│   ├── easter/           # hidden minigame (Deep Delve)
│   └── common/           # EntityMentionTextarea, modals
├── lib/                  # contexts, hooks, engines, single-source utilities
├── api/
│   ├── supabaseClient.js # createClient(url, anonKey)  (trims whitespace)
│   └── entities.js       # generic entity CRUD wrapper + functions.invoke map
└── utils/index.ts        # createPageUrl()
functions/                # Deno edge functions (deployed to Supabase) — see §6
```

---

## 4. Routing & pages

- **`src/App.jsx`** holds the top-level `<BrowserRouter basename={BASE_URL}>`.
  Public routes (no account): `/player-view/public` (`PublicPlayerView`),
  `/PrivacyPolicy`, `/Terms`, `/admin` (`AdminConsole`, self-gated). Everything
  else goes through `AuthenticatedApp` → routes wrapped in `Layout`.
- **`src/pages.config.js`** maps page keys → components and sets `mainPage`
  (`CampaignList`). Despite the "auto-generated" header there is **no generator** —
  add pages here by hand.
- **`src/Layout.jsx`** decides the shell. `CAMPAIGN_PAGES` (array) lists which
  pages render inside the campaign shell. Non-campaign pages render full-bleed.
- Internal links use **`createPageUrl(pageKey)`** + query string. Param quirk:
  the Dashboard keys off `?id=`, everything else off `?campaign_id=` — encoded in
  `src/lib/navItems.js` (`CAMPAIGN_NAV_ITEMS`, `navHref`).

### Adding a new campaign page (checklist)
A page must be registered in **all** of these or it won't appear / open correctly:
1. `src/pages/MyPage.jsx` — read params via `usePageParams()` (see §5).
2. `src/pages.config.js` — import + add to `PAGES`.
3. `src/lib/navItems.js` — add to `CAMPAIGN_NAV_ITEMS` (sidebar + palette "Go to").
4. `src/Layout.jsx` — add the key to `CAMPAIGN_PAGES`.
5. `src/lib/WindowManager.jsx` — add to `WINDOW_PAGES` (so it opens as a window).
6. `src/components/layout/WindowContent.jsx` — import + add to its route map
   (so it renders inside a desktop window).

---

## 5. The OS shell & window manager (the defining system)

On **desktop** (≥768px) campaign pages render as **draggable/resizable floating
windows** on a "desktop"; on **mobile** they render full-screen.

- `src/lib/WindowManager.jsx` — context/provider tracking open windows
  (`{id,url,x,y,w,h,z,minimized,maximized}`), actions (open/close/focus/min/max/
  move/resize), dedupe by page+record, localStorage persistence per campaign.
- `src/components/layout/Desktop.jsx` — wallpaper + renders windows + empty state.
  Has `isolate` so windows can never paint over chrome dropdowns.
- `src/components/layout/Window.jsx` — TE-styled window chrome; pointer drag/resize.
- `src/components/layout/WindowContent.jsx` — **the key trick**: React Router v6
  forbids a nested `<Router>`, so each window provides the router's
  `UNSAFE_LocationContext / UNSAFE_NavigationContext / UNSAFE_RouteContext`
  directly (inheriting `future`/`basename` from the parent). This makes
  `useLocation` / `useNavigate` / `<Link>` resolve to **that window's** URL and
  routes navigation back through the manager — **no per-page rewrites.** Do not
  "fix" this back to a nested Router.
- **Mobile** (`!wide`): `Layout.jsx` bypasses the window manager and renders the
  routed page full-screen via a shared `shell(content)` helper; nav is the
  Start-button drawer. Chrome is null-safe when `useWindowManager()` is null.
- `src/lib/usePageParams.js` — `usePageParams()` = `new URLSearchParams(useLocation().search)`.
  Pages use this (not `window.location.search`) so each window is isolated.
- Chrome: `Taskbar.jsx` (Start, mode badge, window strip / page title, tray with
  search + tools + audio + notifications + theme + clock + sign-out),
  `Sidebar.jsx` (drawer/dock nav), `NavMenu.jsx` (floating Start menu),
  `CommandPalette.jsx` (⌘K, cmdk; search/create/go-to + inline dice).
- Hotkeys: `src/lib/useHotkeys.js` gated by `useHotkeysEnabled.js` (suppressed in
  inputs). ⌘K palette, ⌥N quick-create, `?` help, Esc close.

---

## 6. Supabase backend

**Client**: `src/api/supabaseClient.js` — `createClient(url, anonKey)`. Both are
`.trim()`'d (see Gotchas). Auth in `src/lib/AuthContext.jsx` (Google OAuth +
email/password; email signups are currently disabled).

**Data access**: `src/api/entities.js` exposes a generic `createEntityAPI(table)`
with `list/filter/create/update/delete` (auto-sets `created_by` on create). Named
entities: `Campaign, WorldEntity, Session, Relationship, CampaignMap, QuickNote,
RandomTable, PartyInventory, PlayerNote, Feedback, Announcement, Changelog,
Setting (app_settings), BattleMap`. Edge functions are invoked via
`functions.invoke(name, payload)` with a name→slug map.

**Tables** (Postgres, all RLS-protected): `campaigns`, `world_entities`,
`sessions`, `relationships`, `quick_notes`, `campaign_maps`, `random_tables`,
`user_profiles`, `party_inventory`, `player_notes`, `feedback`, `announcements`,
`changelog`, `app_settings`, `battle_maps`, `campaign_pulse`.

**RLS model**: owner-based. Top-level rows gate on `created_by = auth.uid()`;
child tables gate through campaign ownership (`campaign_id in (select id from
campaigns where created_by = auth.uid())`). `user_profiles` has no UPDATE policy
(users can't self-set `plan`/`is_admin`). Anonymous (public player link) has **no
direct table access** except narrow, deliberate read policies (see Realtime).

**Edge functions** (`functions/*.ts`, deployed to Supabase; slug ≠ filename):
| slug | file | purpose |
|---|---|---|
| `create-demo-for-user` | createDemoForUser.ts | seed a demo campaign |
| `export-campaign` | exportCampaign.ts | full campaign backup (service role) |
| `import-campaign` | importCampaign.ts | restore w/ ID remap; CORS; txn rollback |
| `import-dndbeyond` | importDndBeyondCharacter.ts | import a public D&D Beyond PC |
| `player-view` | playerView.ts | player-safe projection for the public link |
| `party-inventory` | partyInventory.ts | token-gated player writes (inventory/notes) |
| `battle-map` | battleMap.ts | token-gated player read/move of the shared map |
| `admin-api` | adminApi.ts | owner console; re-verifies `is_admin` server-side |
| `export-account` / `delete-account` | exportAccount.ts / deleteAccount.ts | GDPR access / erasure |
| `invoke-llm` | invoke-llm.ts | **decommissioned** (returns 410). No AI features — do not reintroduce LLM calls without revisiting key/cost exposure. |

Deploy edge functions via the Supabase MCP/CLI; player-facing ones run with
`verify_jwt=false` and validate a `player_share_token` themselves.

**Player sharing**: a campaign has `is_shared` (bool) + `player_share_token`
(uuid). The public link is `…/player-view/public?token=<player_share_token>`.
Players are **unauthenticated**; all player reads/writes go through token-gated
edge functions (never direct table access for secrets).

---

## 7. Realtime (live collaboration)

Used by the **Battle Map** (shared token VTT) and **live entity reveals**.

- **Channels**: `src/lib/useBattleMapChannel.js`. Two mechanisms:
  - **Broadcast** (`battlemap:<mapId>`) for smooth in-flight token motion — works
    for anon clients, no RLS.
  - **Postgres changes** as the reliable source of truth — every persisted change
    updates a row, and all clients converge from the DB event.
- **Player reveals**: a trigger bumps a **secrets-free `campaign_pulse` row** on
  any `world_entities` change; the public player view subscribes to it via
  postgres_changes and re-fetches through `player-view` (which applies the
  visibility whitelist). Entity rows are **never** exposed to anon directly.
- **Anon postgres_changes requires**: the table in the `supabase_realtime`
  publication + an anon SELECT RLS policy. Because anon can't read `campaigns`,
  shared-ness is checked via a `SECURITY DEFINER` function `is_campaign_shared()`,
  and the owner policy is scoped `TO authenticated` so anon reads don't abort on a
  `campaigns` grant. See Gotchas.

---

## 8. Theming

**Teenage Engineering look — the big gotcha.** `tailwind.config.js` *overrides*
Tailwind's color scales rather than adding names:
- `amber` = TE signal-orange (`amber-500` = `#ff4d1c`).
- `zinc` = a flat warm-gray ramp.
- `index.css` CSS vars are hue-shifted; `--radius` = 0.375rem.

So `text-amber-500` renders signal-orange and `bg-zinc-800` warm-gray. **Don't
"fix" these to other color names expecting stock values.** For true yellow/orange
use `yellow-*`/`orange-*`. Categorical palettes (entity rainbow, rarity, HP) are
intentionally left untouched.

**Runtime accent**: `amber-*` resolves to `rgb(var(--accent-N))`. `src/lib/theme.js`
generates a ramp from one hex; the admin "Appearance" control writes
`app_settings` (global) and `AccentSync.jsx` applies it app-wide (cached in
`localStorage gmos_accent`, applied pre-paint by `initAccent()` in `main.jsx`).

**Dark/light**: the `dark` class on `<html>` + the `theme` localStorage key
(`ThemeToggle.jsx`). Components use `dark:` variant pairs.

---

## 9. Entity presentation — single source

`src/lib/entityColors.js` is the **only** place that maps an entity type to its
color/icon/label (`ENTITY_TYPE_META`, `getEntityColors(type)`). Never define a
local type→color map; derive from this. `EntityAvatar.jsx` renders token/avatar
art (image_url or the type icon). Entity types: NPCs, Player Characters,
Creatures, Locations, Factions, Deities, Items, Shops, Events, Encounters, Lore,
Threads.

---

## 10. Notable feature systems (where to look)

- **Sessions / prep / combat**: `src/components/session/*`, `src/components/prep/*`,
  `src/components/encounter/InitiativeTracker.jsx`. Combat state is component-local
  (not a DB table) today.
- **World/Campaign map**: `src/pages/CampaignMap.jsx` + `src/components/map/*`
  (image + percentage-positioned pins; not Leaflet despite the dep).
- **Battle Map (realtime VTT)**: `src/pages/BattleMap.jsx` (GM) +
  `src/components/map/TokenLayer.jsx` (reusable token surface) +
  `PlayerBattleMap.jsx` (in the public player view). Tokens are `{id,label,x,y
  (0-100%),color,image_url,kind,hp,maxHp}` on `battle_maps.tokens` (jsonb).
- **Player share**: `src/pages/PublicPlayerView.jsx` (public, two-column: map left,
  framed panels right) + `PlayerView.jsx` (authed preview) + `party/*`.
- **Admin console**: `/admin` → `src/pages/AdminConsole.jsx` + `admin-api`.
  `is_admin` flag on `user_profiles`, re-verified server-side on every action.
- **Easter egg**: type `xyzzy` in ⌘K → `src/components/easter/EasterEggHost.jsx`
  opens "Deep Delve" (`DeepDelve.jsx`, engine `src/lib/deepDelve.js`). Original
  work — keep easter eggs IP-safe.

---

## 11. Verifying changes (no test suite)

Validate by running the app and observing the surface that changed. Pattern used
throughout:
- Build + run; drive the changed surface (click/keyboard/HTTP) and capture output.
- For **auth-gated UI** (Google-only OAuth can't be driven headless): render the
  target component from `App.jsx`'s **unauthenticated branch** as a throwaway
  `__Harness`, seed the React Query cache / `window.history` query params, and
  drive it with a headless browser. Tear the harness down before shipping
  (`grep src/ for harness`).
- For **realtime / RLS / edge functions**: prefer testing against real Supabase —
  curl the function, and use two browser contexts (anon key) to confirm
  cross-client sync. A long-lived Vite dev server can serve stale transforms; if
  results look wrong, restart it (`rm -rf node_modules/.vite`) or test the built
  bundle via `vite preview`.
- Then `npm run lint` + `npm run build` before shipping.

---

## 12. Deployment

Pushes to `main` auto-deploy via `.github/workflows/deploy.yml` (Node 22; runs
lint + build with `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` secrets, publishes
`dist/` to GitHub Pages). **Base path is `/GM-OS/`** in CI (set via
`VITE_BASE_PATH`); locally it's `/`. Because of the base path, **always navigate
with `useNavigate()` / `createPageUrl()`, never `window.location.href`** for
internal routes. Edge functions and DB migrations are deployed to Supabase
separately (MCP/CLI), not by the Pages workflow.

---

## 13. Conventions & gotchas (read before you code)

- **Tailwind `amber`/`zinc` are overridden** (see §8). Class names ≠ stock colors.
- **Routing base path**: use `useNavigate`/`createPageUrl`, not `window.location`.
- **Page params**: use `usePageParams()`, not `window.location.search`, so the
  window manager can isolate windows.
- **Register new pages in all 6 places** (§4).
- **`entityColors.js` is the single source** for type color/icon/label.
- **ESLint** (`eslint.config.js`, scoped to `src/components`, `src/pages`,
  `src/Layout.jsx`): `no-undef` is an **error** (unimported icon = crash); unused
  imports are **errors**, unused vars are warnings (`_`-prefixed exempt); React
  hooks rules enforced. No prop-types (JSDoc instead).
- **Realtime/anon key whitespace**: the anon key in a query param (the Realtime
  WebSocket) breaks if it has trailing whitespace (spaces → `+`). The client
  trims it; keep CI secrets clean too.
- **player-view must return `campaign.id`** — the player view's realtime
  subscription is keyed on it. (Omitting it silently disables live reveals.)
- **Anon RLS policies must not read RLS-protected tables directly** (e.g.
  `campaigns`) — use a `SECURITY DEFINER` helper; scope owner policies
  `TO authenticated` so anon evaluation doesn't abort on grants.
- **Triggers + cascade deletes**: a trigger that writes a child row (e.g.
  `campaign_pulse`) must guard `exists(campaign)` so cascade deletes don't violate
  FKs.
- **No AI features.** `invoke-llm` is decommissioned; don't reintroduce LLM calls.

---

## 14. Extending — quick recipes

- **New entity type**: add it to `entityColors.js` (`ENTITY_TYPE_META`) and the
  create-types list (`src/lib/entityCreateTypes.js`); it flows through browser,
  avatars, palette.
- **New campaign page**: follow the 6-step checklist in §4.
- **New edge function**: add `functions/foo.ts`, deploy with a slug, map it in
  `entities.js` `functions.invoke`. Player-facing → `verify_jwt=false` + validate
  `player_share_token` (copy `partyInventory.ts`/`battleMap.ts`).
- **New realtime surface**: persist to a row; subscribe via postgres_changes
  (anon needs publication + a `SECURITY DEFINER`-gated SELECT policy); use
  broadcast on top only if you need sub-second motion.

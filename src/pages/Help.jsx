import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import useDocumentTitle from '@/lib/useDocumentTitle';
import {
  ArrowLeft, Search, Rocket, FolderOpen, Monitor, Command, Boxes, Network,
  Map as MapIcon, CalendarClock, Dices, Share2, UserCog, Sparkles, X,
} from 'lucide-react';

// ── Keyboard chip ─────────────────────────────────────────────────────────
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
const MOD = isMac ? '⌘' : 'Ctrl';
const ALT = isMac ? '⌥' : 'Alt';
function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-200">
      {children}
    </kbd>
  );
}

// ── Content model ───────────────────────────────────────────────────────────
// Each section is a group of articles. Articles are blocks of typed content so
// the whole manual is searchable (we flatten every string for the filter).
const SECTIONS = [
  {
    id: 'getting-started', title: 'Getting started', Icon: Rocket,
    blurb: 'What GM/OS is, how to sign in, and how to find your feet.',
    articles: [
      {
        q: 'What is GM/OS?',
        body: [
          { type: 'p', text: 'GM/OS is one place to build and run your tabletop RPG campaigns — a "desktop operating system" for Game Masters. You keep your whole world (NPCs, locations, items, factions, plot threads and more) in one app, prep each session with a guided workflow, run it live with dice, initiative and trackers, then share a player-safe view with your table.' },
          { type: 'p', text: 'It is designed around the Lazy GM method and uses the D&D 5e SRD and Open5e for stat blocks, but works for any system.' },
        ],
      },
      {
        q: 'Sign in & create an account',
        body: [
          { type: 'p', text: 'From the landing page, choose how to sign in:' },
          { type: 'list', items: [
            'Continue with Google — one click, no password to manage.',
            'Email & password — create an account with an email and a password of at least 8 characters.',
          ] },
          { type: 'tip', text: 'New accounts start on the free plan. A demo campaign is seeded automatically so you have something to explore right away.' },
        ],
      },
      {
        q: 'The guided tour & demo campaign',
        body: [
          { type: 'p', text: 'A short interactive tour runs the first time you open a campaign and points out the Start button, the mode badge, the command palette, the system tray and the session flow.' },
          { type: 'list', items: [
            'Re-launch the tour any time from the command palette — open it and type "tour".',
            'The demo campaign is a real, fully editable campaign. Explore it, or delete it when you are ready.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'campaigns', title: 'Campaigns', Icon: FolderOpen,
    blurb: 'Create, open, back up and manage your campaigns.',
    articles: [
      {
        q: 'Create a campaign',
        body: [
          { type: 'p', text: 'On the campaign list, click New Campaign and fill in the dialog:' },
          { type: 'list', items: [
            'Campaign name (required).',
            'Background — what led to now; the history that sets the stage.',
            'Setting — where & when; the world, region and tone.',
            'Hook — the call to adventure that draws the party in.',
            'Game system — defaults to D&D 5e.',
          ] },
          { type: 'p', text: 'Everything except the name is optional and can be edited later in Settings. The Background, Setting and Hook also feed your session prep.' },
        ],
      },
      {
        q: 'Open a campaign',
        body: [
          { type: 'p', text: 'Click a campaign card to open it. On desktop it opens as a windowed "desktop" — each page is a movable, resizable window and your layout is remembered per campaign. On phones it opens one full-screen page at a time.' },
          { type: 'tip', text: 'Return to the campaign list any time from the "All campaigns" link at the top of the sidebar / Start menu.' },
        ],
      },
      {
        q: 'Back up, restore & delete',
        body: [
          { type: 'p', text: 'Your data is yours and portable:' },
          { type: 'list', items: [
            'Export backup — from a campaign card menu or Settings, download the whole campaign as a .json file (every entity, session, map, note and table).',
            'Import — on the campaign list, import a .json backup to restore it as a new campaign you own.',
            'Delete — from the card menu or Settings → Danger zone. This is permanent, so export first if unsure.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'desktop', title: 'The desktop & taskbar', Icon: Monitor,
    blurb: 'The OS shell: taskbar, windows, navigation, tray apps and wallpaper.',
    articles: [
      {
        q: 'The taskbar',
        body: [
          { type: 'p', text: 'The bar across the top is always present on a campaign:' },
          { type: 'list', items: [
            'Start button (GM/OS) — toggles the sidebar between docked (left) and a floating Start menu; opens the drawer on mobile.',
            'Mode badge — shows PREP, RUN or DEBRIEF for the campaign; click it to jump straight to the active session.',
            'Window strip (desktop) — one button per open window; click to focus or minimise, hover to close.',
            'System tray — search, background audio, notifications, theme toggle and the clock.',
          ] },
        ],
      },
      {
        q: 'Windows (desktop)',
        body: [
          { type: 'p', text: 'Each page opens as a floating window:' },
          { type: 'list', items: [
            'Drag the title bar to move; drag edges/corners to resize.',
            'Use the title-bar controls to minimise, maximise/restore or close.',
            'Click a window-strip button in the taskbar to bring a window forward, or click it again to minimise.',
            'Your open windows and their positions are saved per campaign and restored when you return.',
          ] },
          { type: 'tip', text: 'Prefer plain pages? Turn off "Desktop window mode" in Settings → Preferences and pages open full-screen, one at a time, with normal navigation. It applies to this device.' },
        ],
      },
      {
        q: 'Navigation: docked vs floating',
        body: [
          { type: 'p', text: 'The left sidebar lists every campaign page: Dashboard, All Entities, Relationship Map, Campaign Map, Battle Map, Sessions, Party Inventory, Notes, Random Tables, Timeline, Player View and Settings.' },
          { type: 'list', items: [
            'Docked — the sidebar sits on the left edge.',
            'Floating — collapse it and the Start button opens it as a dropdown menu instead.',
            'On mobile the Start button opens a full-screen drawer.',
          ] },
        ],
      },
      {
        q: 'Tray apps & wallpaper',
        body: [
          { type: 'list', items: [
            'Background audio — paste a YouTube link to play ambient music; it keeps playing as you navigate.',
            'Notifications — the bell shows session and system messages; a badge counts unread.',
            'Theme — toggle light / dark anywhere you see the sun/moon icon.',
            'Clock — the current time on the right of the tray.',
            'Wallpaper — open the desktop wallpaper menu to pick a built-in pattern, upload an image, or paste an image link.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'palette', title: 'Command palette & shortcuts', Icon: Command,
    blurb: 'Search, create, jump and roll dice from the keyboard.',
    articles: [
      {
        q: 'The command palette',
        body: [
          { type: 'p', text: 'Press the shortcut (or the tray search icon) to open the palette, then just type. Results are grouped:' },
          { type: 'list', items: [
            'Search — matching entities and sessions; pick one to open it.',
            'Create — type an entity type (e.g. "new npc") to start a new entity.',
            'Go to — jump to any campaign page.',
            'Dice — type a dice expression like "2d6", "d20" or "1d8+3" to roll inline.',
          ] },
        ],
      },
      {
        q: 'Keyboard shortcuts',
        body: [
          { type: 'kbd', items: [
            [`${MOD} K`, 'Open the command palette — search, create, jump, or roll dice'],
            [`${ALT} N`, 'Open quick-create (also the floating + button)'],
            ['?', 'Show the keyboard-shortcuts help'],
            ['Esc', 'Close the open palette, menu, dialog or drawer'],
          ] },
          { type: 'tip', text: 'Shortcuts are suppressed while you are typing in a text field (except the palette toggle). You can turn shortcuts off per device in Settings.' },
        ],
      },
      {
        q: 'Quick Capture',
        body: [
          { type: 'p', text: `The floating + button (or ${ALT} N) opens Quick Capture without leaving the page. Jot a note — it saves to the focused session if one is open, otherwise to campaign notes — or tap an entity type to start creating one.` },
        ],
      },
    ],
  },
  {
    id: 'entities', title: 'Building your world', Icon: Boxes,
    blurb: 'The 12 entity types, the editor, @-mentions and imports.',
    articles: [
      {
        q: 'Entity types',
        body: [
          { type: 'p', text: 'Everything in your world is an "entity". There are twelve types, each with a tailored editor:' },
          { type: 'table', head: ['Type', 'Use it for'], rows: [
            ['NPC', 'Named characters: identity, personality, dialogue, rumors, hooks'],
            ['Player Character', 'The party: level, class, ability scores, equipment'],
            ['Creature', 'Monsters & beasts with full 5e stat blocks'],
            ['Location', 'Places: atmosphere, features, inhabitants, secrets'],
            ['Faction', 'Organisations: goals, structure, resources, allies/enemies'],
            ['Deity', 'Gods: domains, tenets, clergy, temples, myths'],
            ['Item', 'Treasure & gear: type, rarity, attunement, properties'],
            ['Shop', 'Vendors: shopkeeper, inventory, prices, hooks'],
            ['Event', 'World occurrences: trigger, participants, aftermath'],
            ['Encounter', 'Set-piece challenges and combats'],
            ['Lore', 'Knowledge & secrets: what is known vs. hidden'],
            ['Thread', 'Plot threads: hooks, urgency, progress to resolution'],
          ] },
        ],
      },
      {
        q: 'Create & edit an entity',
        body: [
          { type: 'p', text: 'Open All Entities (or a type from the sidebar) and choose Add Entity, then "Create from scratch". The editor has consistent sections:' },
          { type: 'list', items: [
            'Name, type, status and visibility at the top, plus an optional image URL.',
            'Summary — a one-line description for quick scanning.',
            'Key Facts — a bulleted list of at-a-glance details.',
            'Type details — the fields specific to that entity type.',
            'Stat block — AC, HP, speed, ability scores, CR, traits and actions (for creatures/NPCs/encounters).',
            'Description — long-form notes with @-mentions and an edit/preview toggle.',
            'Tags — your own labels for filtering.',
          ] },
          { type: 'p', text: 'Click Save to store changes. Existing entities also show their relationships and any linked map.' },
        ],
      },
      {
        q: 'Link entities with @-mentions',
        body: [
          { type: 'p', text: 'In any description or notes field, type @ and start a name to link another entity. Pick from the dropdown, or choose "Create…" to make a new entity on the spot.' },
          { type: 'p', text: 'Mentions render as clickable links; clicking one opens a quick-view card with the summary and key facts, plus links to view or edit the full entity. Mentions survive renames because they are stored by id.' },
        ],
      },
      {
        q: 'Import stat blocks',
        body: [
          { type: 'list', items: [
            'D&D Beyond — when creating a Player Character, paste one or more public D&D Beyond character IDs to import sheets. (The character must be set to Public.)',
            'Open5e (SRD) — when creating a Creature, Item or Lore entry, search the SRD and import the stat block, then refine it.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'relationships', title: 'Relationships', Icon: Network,
    blurb: 'Map how everyone and everything connects.',
    articles: [
      {
        q: 'The relationship map',
        body: [
          { type: 'p', text: 'The Relationship Map visualises the web of connections in your campaign as a graph (with a list fallback on mobile).' },
          { type: 'list', items: [
            'Add Relationship — pick a source and target entity, a relationship type (allied with, enemy of, member of, owns, loves, fears, owes, betrayed by, and more), a description, status and strength.',
            'Filters — narrow the graph by entity type, relationship type or status.',
            'Relationships also appear on each entity\'s detail page.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'maps', title: 'Maps & battle map', Icon: MapIcon,
    blurb: 'Pin your world map and run live token combat.',
    articles: [
      {
        q: 'Campaign maps',
        body: [
          { type: 'p', text: 'Under Campaign Map, create maps by uploading an image or pasting an image link (or import a Dyson Logos map). In edit mode, place coloured pins and link each one to a Location entity. The linked map then previews on that location\'s page.' },
        ],
      },
      {
        q: 'Battle map (token VTT)',
        body: [
          { type: 'p', text: 'The Battle Map is a real-time virtual tabletop:' },
          { type: 'list', items: [
            'Set a background image (upload or link).',
            'Add tokens — blank, from any entity (inherits its name/colour/image), or import the whole party at once.',
            'Drag tokens to move them; toggle the grid; zoom and pan.',
            'When the campaign is shared, players see the map and token movements update live.',
          ] },
          { type: 'tip', text: 'The Battle Map is in alpha — it’s brand new and still rough in places. Expect changes and the occasional quirk, and tell us what breaks via Send feedback.' },
        ],
      },
    ],
  },
  {
    id: 'sessions', title: 'Sessions: prep, run, debrief', Icon: CalendarClock,
    blurb: 'The three-stage session flow and the live GM screen.',
    articles: [
      {
        q: 'Sessions overview',
        body: [
          { type: 'p', text: 'Open Sessions to see your sessions as a list or calendar and create a new one. Each session has three tabs that follow the natural flow of play: Prep, Run and Debrief.' },
        ],
      },
      {
        q: 'Prep (the Lazy GM workflow)',
        body: [
          { type: 'p', text: 'The Prep tab walks you through a focused, low-effort prep checklist:' },
          { type: 'list', items: [
            'Recap — the cliffhanger and key beats from last time (auto-filled from the previous debrief when available).',
            'Strong start — a sensory opening scene to drop players straight into the action.',
            'Scenes, secrets & clues — a handful of possible scenes and ~10 discoverable secrets.',
            'Locations, NPCs, encounters/creatures and threads — link the relevant entities so stat blocks and notes are ready.',
            'Rewards — physical loot and narrative boons.',
          ] },
          { type: 'list', items: [
            'Import Markdown — paste prep from Obsidian or any markdown notes; section headers map to the right fields.',
            'Export Markdown — download your prep as a .md file.',
            'Print — a clean, printable prep sheet for the table.',
          ] },
        ],
      },
      {
        q: 'Run (the GM screen)',
        body: [
          { type: 'p', text: 'Start the session to open the GM screen — your live command centre:' },
          { type: 'list', items: [
            'Session timer — start/stop, tracks how long you play.',
            'Session notes — capture notes during play, tag them (Combat, Clue, NPC, Item, Plot, Important) and @-mention entities.',
            'Dice roller — roll any die with quantity, modifier and advantage/disadvantage; crits are highlighted and the last rolls are kept.',
            'Combat tracker — initiative, HP and conditions (see the Combat section).',
            'Party / resource tracker — track each PC\'s HP and custom counters like Inspiration.',
            'Entity lookup — search and quick-view any entity without leaving the screen.',
          ] },
        ],
      },
      {
        q: 'Debrief',
        body: [
          { type: 'p', text: 'After play, the Debrief tab helps you close the loop: write a session summary, record the Key Events, review the notes you captured live, and jot a primer for next time (which becomes next session\'s recap). Saving marks the session debriefed.' },
        ],
      },
      {
        q: 'Combat & initiative',
        body: [
          { type: 'p', text: 'In the combat tracker:' },
          { type: 'list', items: [
            'Add combatants by searching your entities (name and HP auto-fill) or by typing them manually.',
            'Set initiative; combatants sort highest-first and the active one is highlighted.',
            'Track HP with +/- and watch the colour-coded bar; apply and clear 5e conditions per combatant.',
            'Next Turn advances the order and counts rounds; Reset Combat clears it. Combat state is saved, so minimising or reloading keeps it.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'tables-notes', title: 'Tables, notes, timeline & inventory', Icon: Dices,
    blurb: 'Random tables, campaign notes, the timeline and party loot.',
    articles: [
      {
        q: 'Random tables',
        body: [
          { type: 'p', text: 'Build reusable tables (encounters, names, loot, plot hooks, events or custom) with dice ranges and results, then click Roll during play to generate an outcome.' },
        ],
      },
      {
        q: 'Campaign notes',
        body: [
          { type: 'p', text: 'Notes is a quick-capture board. Write a note (with @-mentions), tag it, optionally tie it to a session, then pin the important ones, mark them done, search and filter. Quick Capture and the GM screen both feed into here.' },
        ],
      },
      {
        q: 'Timeline',
        body: [
          { type: 'p', text: 'The Timeline lays out your sessions in order with the Events tied to each one, plus any pre-campaign events — a running history of your world.' },
        ],
      },
      {
        q: 'Party inventory',
        body: [
          { type: 'p', text: 'Track shared party currency (pp/gp/sp/cp) and items — quantity, who carries each, equipped status and notes — plus party notes your players should see. This can be shared in the player view.' },
        ],
      },
    ],
  },
  {
    id: 'sharing', title: 'Sharing with players', Icon: Share2,
    blurb: 'The live player view and what your table can see.',
    articles: [
      {
        q: 'The player share link',
        body: [
          { type: 'p', text: 'Turn on Player View (from the dashboard or Settings) to generate a public share link. Send it to your players — no account needed — and they get a read-only, player-safe view of the campaign.' },
        ],
      },
      {
        q: 'Controlling what players see',
        body: [
          { type: 'p', text: 'Every entity has a visibility setting that governs the player view:' },
          { type: 'list', items: [
            'GM only — hidden from players (the default).',
            'Players know — shown to players as known information.',
            'Players suspect — shown as a rumor.',
          ] },
          { type: 'tip', text: 'Reveals are live: change an entity to "players know" and it appears in the player view within moments — no refresh needed. Player characters, shared party inventory and party notes also appear, and the battle map updates in real time when you run combat.' },
        ],
      },
    ],
  },
  {
    id: 'account', title: 'Account & your data', Icon: UserCog,
    blurb: 'Profile, theme, data export and account deletion.',
    articles: [
      {
        q: 'Account settings',
        body: [
          { type: 'list', items: [
            'Display name — set how you appear.',
            'Email & sign-in — managed by Google for Google accounts; email users can change their password (min 8 characters).',
            'Plan — your current plan (free today).',
            'Theme — light / dark, also available from the tray.',
          ] },
        ],
      },
      {
        q: 'Your data (export & delete)',
        body: [
          { type: 'list', items: [
            'Export my data — download a complete copy of your account and all campaigns as JSON, any time.',
            'Delete account — permanently removes your account, every campaign, your profile and your sign-in across all systems. It cannot be undone, so export first.',
          ] },
          { type: 'p', text: 'See the Privacy Policy and Terms of Service for the full details.' },
        ],
      },
    ],
  },
];

// Flatten an article's text for the search filter.
function articleText(a) {
  const parts = [a.q];
  for (const b of a.body) {
    if (b.text) parts.push(b.text);
    if (b.items) for (const it of b.items) parts.push(Array.isArray(it) ? it.join(' ') : it);
    if (b.head) parts.push(b.head.join(' '));
    if (b.rows) for (const r of b.rows) parts.push(r.join(' '));
  }
  return parts.join(' ').toLowerCase();
}

// ── Block renderer ──────────────────────────────────────────────────────────
function Block({ block }) {
  switch (block.type) {
    case 'p':
      return <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{block.text}</p>;
    case 'list':
      return (
        <ul className="space-y-1.5 pl-1">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case 'tip':
      return (
        <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200/90">{block.text}</p>
        </div>
      );
    case 'kbd':
      return (
        <div className="space-y-1.5">
          {block.items.map(([key, desc], i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
              <Kbd>{key}</Kbd>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      );
    case 'table':
      return (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-900">
              <tr>{block.head.map((h, i) => <th key={i} className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-200">{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800">
                  {r.map((c, j) => (
                    <td key={j} className={`px-3 py-2 align-top ${j === 0 ? 'font-medium text-zinc-800 dark:text-zinc-100 whitespace-nowrap' : 'text-zinc-600 dark:text-zinc-400'}`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export default function Help() {
  useDocumentTitle('User manual');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  // Filter sections/articles by the search query.
  const sections = useMemo(() => {
    if (!q) return SECTIONS;
    return SECTIONS
      .map((s) => ({ ...s, articles: s.articles.filter((a) => articleText(a).includes(q)) }))
      .filter((s) => s.articles.length > 0 || s.title.toLowerCase().includes(q));
  }, [q]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800/70 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            GM<span className="text-amber-500">/OS</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to app
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Title + search */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">User manual</p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">How to use GM/OS</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Everything from setting up your first campaign to running live combat and sharing with players.
          </p>
          <div className="relative mt-5 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the manual…"
              aria-label="Search the manual"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 py-2 pl-9 pr-9 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-10">
          {/* Table of contents */}
          <nav className="mb-8 lg:mb-0">
            <div className="lg:sticky lg:top-20 space-y-0.5">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100">
                  <s.Icon className="h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span>{s.title}</span>
                </a>
              ))}
            </div>
          </nav>

          {/* Content */}
          <main className="min-w-0 space-y-12">
            {sections.length === 0 && (
              <p className="text-sm text-zinc-500">No results for “{query}”. Try a different word.</p>
            )}
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <div className="flex items-center gap-2.5 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <s.Icon className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{s.title}</h2>
                </div>
                <div className="mt-6 space-y-8">
                  {s.articles.map((a, i) => (
                    <article key={i}>
                      <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">{a.q}</h3>
                      <div className="space-y-3">
                        {a.body.map((b, j) => <Block key={j} block={b} />)}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {/* Footer links */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-6 text-xs text-zinc-400 dark:text-zinc-600">
              <Link to={createPageUrl('About')} className="hover:underline">Attributions</Link>
              <span className="mx-2">·</span>
              <Link to={createPageUrl('PrivacyPolicy')} className="hover:underline">Privacy</Link>
              <span className="mx-2">·</span>
              <Link to={createPageUrl('Terms')} className="hover:underline">Terms</Link>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

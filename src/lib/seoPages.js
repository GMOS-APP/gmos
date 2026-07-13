// Shared content + metadata for the SEO landing pages (comparison + feature).
// Plain data only (no JSX, no browser APIs) so it can be imported by BOTH the
// Vite app (ComparisonPage/FeaturePage render from it) and the Node build-time
// prerender script (scripts/prerender-marketing.mjs bakes <title>/meta/JSON-LD).
//
// Keep copy honest and specific — Google penalises thin "doorway" pages, and the
// competitor-strength sections build trust. Every claim maps to a real feature.

export const SITE = 'https://gmos.app';

// GM/OS's own pricing — stated concretely (we own these numbers).
export const PRICING_BLURB = 'GM/OS is free for one fully-featured campaign (no credit card). Unlimited campaigns are $3.99/mo, $37.99/yr, or $49.99 once for lifetime.';

// Hub-page metadata (shared by the hub components and the build prerender).
export const COMPARE_HUB = {
  path: '/compare',
  title: 'GM/OS vs Other Campaign Managers | Compare',
  description: 'See how GM/OS compares to other TTRPG campaign managers — World Anvil, Kanka, LegendKeeper, Notion, and Obsidian — for D&D 5e and any tabletop RPG. Free to start.',
};
export const FEATURES_HUB = {
  path: '/features',
  title: 'Dungeon Master Tools & Features | GM/OS',
  description: 'Every tool GM/OS gives a game master: an initiative tracker, a live battle map, a relationship map, guided session prep, an online DM screen, NPC tracking, and a player view. Free to start.',
};

// Generic "GM/OS vs Others" comparison — a category-level table for the compare
// hub that does not single out one competitor. Rows describe how GM/OS differs
// from typical campaign managers / worldbuilding wikis as a whole.
export const GENERIC_COMPARISON = {
  competitorLabel: 'Typical tools',
  rows: [
    { feature: 'Worldbuilding wiki (NPCs, locations, lore)', gmos: 'Yes — 12 linked entity types', others: 'Usually' },
    { feature: 'System-agnostic (any tabletop RPG)', gmos: 'Yes — D&D 5e + custom types', others: 'Often D&D-only' },
    { feature: 'Guided session prep', gmos: 'Yes — Lazy GM method', others: 'Rarely' },
    { feature: 'Initiative / combat tracker', gmos: 'Built in', others: 'Separate tool' },
    { feature: 'Live shared battle map (VTT)', gmos: 'Built in — real-time', others: 'Separate VTT' },
    { feature: 'Dice at the table', gmos: 'Built in', others: 'Separate tool' },
    { feature: 'Player view with secrets hidden', gmos: 'Yes — per-entity control', others: 'Limited' },
    { feature: 'Focus', gmos: 'Prepping and running sessions', others: 'Mostly a wiki' },
    { feature: 'Free plan', gmos: 'Yes — 1 full campaign', others: 'Varies' },
    { feature: 'Lifetime option', gmos: 'Yes — $49.99 once', others: 'Rare' },
  ],
};

// ---------------------------------------------------------------------------
// Comparison / "alternative to" pages — highest purchase intent.
// ---------------------------------------------------------------------------
export const COMPARISONS = [
  {
    slug: 'world-anvil-alternative',
    competitor: 'World Anvil',
    metaTitle: 'A World Anvil Alternative for Running Sessions | GM/OS',
    metaDescription:
      'Looking for a World Anvil alternative? GM/OS is a faster, table-first TTRPG campaign manager (D&D 5e and beyond) — worldbuilding plus a live battle map, initiative, dice, and a player view. Free to start.',
    h1: 'The World Anvil alternative built for the table',
    intro:
      "World Anvil is a deep worldbuilding and publishing suite — and that depth is also its reputation for a steep, button-heavy interface. GM/OS takes the opposite stance: keep your world organised, but put the tools you actually use while running a session one keystroke away. If you want less setup and more play, GM/OS is the World Anvil alternative to try.",
    rows: [
      { feature: 'Worldbuilding wiki (NPCs, locations, lore)', gmos: 'Yes — 12 linked entity types', competitor: 'Yes — very deep' },
      { feature: 'Guided session prep', gmos: 'Yes — Lazy GM 8-step method', competitor: 'Limited' },
      { feature: 'Initiative / combat tracker', gmos: 'Yes — live HP, conditions, friend/foe', competitor: 'Basic' },
      { feature: 'Live shared battle map (VTT)', gmos: 'Yes — real-time, no player account', competitor: 'No' },
      { feature: 'Player-facing view you control', gmos: 'Yes — per-entity visibility', competitor: 'Yes' },
      { feature: 'Interface', gmos: 'Focused desktop-style OS', competitor: 'Powerful but complex' },
      { feature: 'Free plan', gmos: 'Yes — 1 full campaign', competitor: 'Yes — limited' },
      { feature: 'Lifetime option', gmos: 'Yes — $49.99 once', competitor: 'Yes' },
    ],
    gmosWins: [
      'Everything you need at the table — initiative, dice, a GM screen, and a live battle map — not just a wiki.',
      'A clean, fast, desktop-style workspace instead of dozens of nested settings panels.',
      'Guided prep based on the Lazy GM method, so a session comes together in minutes.',
      'Real-time battle map your players join from a browser link — no account, no install.',
    ],
    competitorWins: [
      'Unmatched worldbuilding depth, article templates, and timelines for lore-heavy settings.',
      'A huge, active community with worlds to explore and monthly worldbuilding events.',
      'Built-in novel-writing tools if you publish fiction alongside your campaign.',
    ],
    bestFor:
      'Choose GM/OS if your priority is prepping and running sessions with less friction. Choose World Anvil if exhaustive worldbuilding and publishing is the main event.',
  },
  {
    slug: 'kanka-alternative',
    competitor: 'Kanka',
    metaTitle: 'A Kanka Alternative with Battle Map & Prep | GM/OS',
    metaDescription:
      'A Kanka alternative that goes beyond the wiki: GM/OS adds guided session prep, an initiative tracker, a live battle map, and a player view — in a clean desktop-style workspace. Free to start.',
    h1: 'The Kanka alternative for prepping and running sessions',
    intro:
      "Kanka is a beloved, community-driven campaign wiki with excellent entity linking. GM/OS covers that same worldbuilding ground — NPCs, locations, factions, and the relationships between them — then adds the run-the-session layer Kanka leaves to other tools: a guided prep flow, an initiative tracker, inline dice, a GM screen, and a real-time battle map.",
    rows: [
      { feature: 'Campaign wiki + entity linking', gmos: 'Yes — mentions auto-link', competitor: 'Yes — excellent' },
      { feature: 'Relationship map', gmos: 'Yes — force-directed graph', competitor: 'Yes' },
      { feature: 'Guided session prep', gmos: 'Yes — Lazy GM method', competitor: 'No' },
      { feature: 'Initiative / combat tracker', gmos: 'Yes — live HP + conditions', competitor: 'No' },
      { feature: 'Live shared battle map (VTT)', gmos: 'Yes — real-time', competitor: 'No' },
      { feature: 'Player-facing view', gmos: 'Yes — you choose what shows', competitor: 'Limited' },
      { feature: 'Free plan', gmos: 'Yes — 1 full campaign', competitor: 'Yes — generous' },
      { feature: 'System-agnostic', gmos: 'Yes — D&D 5e + custom types', competitor: 'Yes' },
    ],
    gmosWins: [
      'At-the-table tools Kanka does not include: initiative, dice, GM screen, and a live battle map.',
      'A guided prep structure so you walk into a session ready, not staring at a blank wiki page.',
      'A desktop-style workspace with a ⌘K command palette to jump anywhere instantly.',
    ],
    competitorWins: [
      'A very generous free tier and a large, established community.',
      'Extremely flexible entity linking and custom relations, refined over years.',
      'Multi-language support and an open, self-host-friendly ethos.',
    ],
    bestFor:
      'Choose GM/OS if you want your world and your session-running tools in one app. Choose Kanka if a deep, free, community-driven wiki is all you need.',
  },
  {
    slug: 'legendkeeper-alternative',
    competitor: 'LegendKeeper',
    metaTitle: 'A LegendKeeper Alternative with a Free Plan | GM/OS',
    metaDescription:
      'A LegendKeeper alternative with a free plan and tools for running the game: GM/OS adds an initiative tracker, a live battle map, guided prep, and dice to fast worldbuilding. Free to start.',
    h1: 'The LegendKeeper alternative that runs the session too',
    intro:
      "LegendKeeper is a fast, polished worldbuilding tool with beautiful nested maps. GM/OS is just as focused on speed, and it starts free — then it carries you past worldbuilding into actually running the session: guided prep, initiative, dice, a GM screen, and a live, shared battle map your players can see in real time.",
    rows: [
      { feature: 'Fast worldbuilding wiki', gmos: 'Yes', competitor: 'Yes — very fast' },
      { feature: 'Interactive location maps', gmos: 'Yes — pins + Dyson Logos import', competitor: 'Yes — nested maps' },
      { feature: 'Guided session prep', gmos: 'Yes — Lazy GM method', competitor: 'No' },
      { feature: 'Initiative / combat tracker', gmos: 'Yes', competitor: 'No' },
      { feature: 'Live shared battle map (VTT)', gmos: 'Yes — real-time tokens + fog', competitor: 'No' },
      { feature: 'Player-facing view', gmos: 'Yes — per-entity control', competitor: 'Yes — share pages' },
      { feature: 'Free plan', gmos: 'Yes — 1 full campaign', competitor: 'Trial only' },
      { feature: 'Lifetime option', gmos: 'Yes — $49.99 once', competitor: 'No' },
    ],
    gmosWins: [
      'A genuinely free plan — one full campaign, every feature, no credit card.',
      'Tools for running combat and encounters, not just building the world beforehand.',
      'A real-time battle map with tokens, fog of war, and a ruler that players join by link.',
      'A one-time lifetime purchase if you would rather not subscribe.',
    ],
    competitorWins: [
      'Exceptionally smooth, deeply nested interactive maps.',
      'A refined, distraction-free writing and worldbuilding experience.',
      'Real-time collaborative editing for co-GM worldbuilding.',
    ],
    bestFor:
      'Choose GM/OS if you want to prep and run for free, with combat and a battle map included. Choose LegendKeeper if map-first worldbuilding is your whole workflow.',
  },
  {
    slug: 'notion-for-dnd-alternative',
    competitor: 'Notion',
    metaTitle: 'A Notion Alternative Built for D&D DMs | GM/OS',
    metaDescription:
      'Using Notion for D&D? GM/OS is a purpose-built alternative — no template setup. Get NPCs, guided prep, an initiative tracker, a live battle map, dice, and a player view out of the box. Free to start.',
    h1: 'A Notion-for-D&D alternative, with the game tools built in',
    intro:
      "Plenty of DMs run their campaign in Notion — and then spend hours wiring up templates, databases, and relations that still can't roll a die or track initiative. GM/OS gives you all that structure on day one, purpose-built for tabletop RPGs, plus the things a general note tool never will: dice, an initiative tracker, a GM screen, a live battle map, and a player-safe share view.",
    rows: [
      { feature: 'Setup required', gmos: 'None — ready to use', competitor: 'Build your own templates' },
      { feature: 'Purpose-built entity types', gmos: 'Yes — NPCs, locations, factions…', competitor: 'DIY databases' },
      { feature: 'Guided session prep', gmos: 'Yes — Lazy GM method', competitor: 'DIY' },
      { feature: 'Initiative / dice', gmos: 'Yes — built in', competitor: 'No' },
      { feature: 'Live battle map (VTT)', gmos: 'Yes', competitor: 'No' },
      { feature: 'Player-facing view with secrets hidden', gmos: 'Yes — per-entity visibility', competitor: 'Manual share, all-or-nothing' },
      { feature: 'D&D 5e SRD content', gmos: 'Yes — stat blocks & rules', competitor: 'No' },
      { feature: 'Free plan', gmos: 'Yes — 1 full campaign', competitor: 'Yes' },
    ],
    gmosWins: [
      'Zero template-building — the campaign structure is already there and designed for GMs.',
      'Actual game tools: dice, initiative, a GM screen, and a real-time battle map.',
      'A player view that reveals only what you mark visible, so prep and secrets stay hidden.',
      'Bundled D&D 5e SRD stat blocks and rules for quick reference at the table.',
    ],
    competitorWins: [
      'Endless general-purpose flexibility for anything beyond your campaign.',
      "Free, and you may already live in it for the rest of your life's notes.",
      'A massive marketplace of community templates.',
    ],
    bestFor:
      'Choose GM/OS if you want a tool that already knows it is for running RPGs. Choose Notion if you love building your own system and only need notes.',
  },
  {
    slug: 'obsidian-for-dnd-alternative',
    competitor: 'Obsidian',
    metaTitle: 'An Obsidian Alternative for Dungeon Masters | GM/OS',
    metaDescription:
      'An Obsidian-for-D&D alternative with no plugin tinkering: GM/OS gives DMs linked NPCs, guided prep, an initiative tracker, a live battle map, and a shareable player view out of the box. Free to start.',
    h1: 'An Obsidian-for-D&D alternative — without the plugin tinkering',
    intro:
      "Obsidian is a superb local, markdown-first notes app, and with the right plugins it can manage a campaign. GM/OS is for GMs who would rather not assemble and maintain that plugin stack. You get the linked-notes feeling — mention an NPC anywhere and it connects — plus a relationship graph, guided prep, an initiative tracker, and a live battle map, all working the moment you sign in.",
    rows: [
      { feature: 'Linked notes / backlinks', gmos: 'Yes — @-mentions auto-link', competitor: 'Yes — core strength' },
      { feature: 'Relationship graph', gmos: 'Yes — built for characters & factions', competitor: 'Yes — generic graph' },
      { feature: 'Setup / plugins', gmos: 'None — works instantly', competitor: 'Install & configure plugins' },
      { feature: 'Guided session prep', gmos: 'Yes — Lazy GM method', competitor: 'Plugin-dependent' },
      { feature: 'Initiative / dice', gmos: 'Yes — built in', competitor: 'Plugin-dependent' },
      { feature: 'Live battle map (VTT)', gmos: 'Yes — real-time', competitor: 'No' },
      { feature: 'Share a player view', gmos: 'Yes — one link, secrets hidden', competitor: 'Requires Publish + manual' },
      { feature: 'Works on any device browser', gmos: 'Yes — nothing to install', competitor: 'Desktop app + sync' },
    ],
    gmosWins: [
      'No plugin hunting or config — the campaign tools are built and maintained for you.',
      'A relationship graph tuned to characters, factions, and plot threads, not generic notes.',
      'Run the game: initiative, dice, a GM screen, and a live shared battle map.',
      'Share a controlled player view with a single link — no publishing pipeline.',
    ],
    competitorWins: [
      'Your notes are local markdown files you fully own and can keep forever, offline.',
      'A vast plugin ecosystem to bend it into anything.',
      'Completely free for personal use.',
    ],
    bestFor:
      'Choose GM/OS if you want a ready-made GM toolkit with table tools included. Choose Obsidian if local files and total DIY control matter most.',
  },
];

// ---------------------------------------------------------------------------
// Feature landing pages — winnable long-tail, one keyword theme each.
// ---------------------------------------------------------------------------
export const FEATURE_PAGES = [
  {
    slug: 'initiative-tracker',
    metaTitle: 'D&D Initiative Tracker & Combat Manager | GM/OS',
    metaDescription:
      'A fast D&D initiative tracker built into your campaign: track turn order, live HP, and conditions with friend/foe tinting — and share a live turn order with players. Free to start.',
    h1: 'A D&D initiative tracker that lives with your campaign',
    intro:
      "Most initiative trackers are a blank list you re-type every fight. GM/OS keeps combat connected to your world: pull creatures and NPCs you have already statted, track initiative, HP, and conditions in one place, and tint friends and foes so the order reads at a glance. Because it is part of your campaign, the monsters, the map, and the notes are all right there.",
    bullets: [
      { title: 'Live HP & conditions', body: 'Adjust hit points and drop condition tags on any combatant; changes are instant and broadcast to the player view.' },
      { title: 'Friend / foe tinting', body: 'Allies and enemies are colour-tinted so a crowded initiative order stays readable mid-fight.' },
      { title: 'Pulls from your world', body: 'Add creatures and NPCs you have already created — no re-entering stat blocks for every encounter.' },
      { title: 'Player-facing turn order', body: 'Share a live view so players always know who is up next without you narrating the list.' },
    ],
    related: ['battle-map', 'dm-screen', 'session-prep'],
  },
  {
    slug: 'battle-map',
    metaTitle: 'Free Online Battle Map & VTT for D&D | GM/OS',
    metaDescription:
      'A free, real-time online battle map for tabletop RPGs: drop and move tokens with HP and conditions, fog of war, a ruler and ping — players join from a browser link, no account or install. Free to start.',
    h1: 'A live online battle map your players join by link',
    intro:
      "Run the tactical moments without leaving your campaign. GM/OS includes a real-time battle map — place and move tokens, track HP and conditions, hide the unexplored with fog of war, and measure with a ruler and ping. Your players open a single browser link and see every move instantly. No accounts, no installs, no separate VTT to wrangle.",
    bullets: [
      { title: 'Real-time tokens', body: 'Place, move, and resize tokens with HP and condition markers; every player sees updates live.' },
      { title: 'Fog of war', body: 'Reveal the map as the party explores and keep what is ahead hidden until they get there.' },
      { title: 'Ruler & ping', body: 'Measure distances for movement and spells, and ping a spot to point everyone at it.' },
      { title: 'No player account needed', body: 'Share one link and players join in a browser — nothing to download or sign up for.' },
    ],
    related: ['initiative-tracker', 'player-view', 'dm-screen'],
  },
  {
    slug: 'relationship-map',
    metaTitle: 'TTRPG Relationship Map & NPC Web | GM/OS',
    metaDescription:
      'Visualise how your NPCs, factions, and plot threads connect with an interactive TTRPG relationship map. Click any node to jump to that character. Part of the GM/OS campaign manager — free to start.',
    h1: 'A relationship map for your NPCs, factions, and threads',
    intro:
      "Campaigns live in the connections — who serves whom, which faction hates which, and the threads tying it together. GM/OS draws it all as an interactive, force-directed relationship map. Allies, rivals, faction ties, and plot threads become a graph you can read at a glance, and clicking any node jumps straight to that character or place.",
    bullets: [
      { title: 'Force-directed graph', body: 'Every connection in your world laid out visually — no manual chart-drawing.' },
      { title: 'Click through to entities', body: 'Select any node to open that NPC, faction, or location and keep working.' },
      { title: 'Factions & threads included', body: 'Not just characters — model organisations and the plot threads that bind them.' },
      { title: 'Always up to date', body: 'The map is generated from your world, so it reflects relationships as you add them.' },
    ],
    related: ['npc-tracker', 'session-prep', 'player-view'],
  },
  {
    slug: 'dm-screen',
    metaTitle: 'Online DM Screen for Running Sessions | GM/OS',
    metaDescription:
      'A distraction-free online DM screen: your notes, initiative, dice, and quick reference in one fullscreen view for running the game. Part of the GM/OS game master toolkit — free to start.',
    h1: 'An online DM screen for running the game',
    intro:
      "When the session is live you do not want to hunt through tabs. GM/OS gives you a fullscreen, distraction-free DM screen that pulls together the things you reach for while running: your session notes, the initiative tracker, inline dice, and quick reference — so you stay present at the table instead of clicking around.",
    bullets: [
      { title: 'Everything in one view', body: 'Notes, initiative, and dice together in a focused screen made for mid-session use.' },
      { title: 'Inline dice', body: 'Roll from the screen or the ⌘K command palette without breaking focus.' },
      { title: 'Notes that link to your world', body: 'Jot as you go and mention any NPC or location to link it instantly.' },
      { title: 'Prep, Session, Debrief modes', body: 'The whole app reshapes around what you are doing — before, during, and after the game.' },
    ],
    related: ['initiative-tracker', 'session-prep', 'battle-map'],
  },
  {
    slug: 'session-prep',
    metaTitle: 'D&D Session Prep Tool & Planner | GM/OS',
    metaDescription:
      'A guided D&D session prep tool based on the Lazy GM method: strong start, scenes, secrets, NPCs, monsters, and rewards — saved to the session and ready at the table. Free to start.',
    h1: 'Guided D&D session prep, the Lazy way',
    intro:
      "Great sessions do not need great piles of prep — they need the right prep. GM/OS walks you through the Lazy GM method step by step: review the characters, write a strong start, sketch potential scenes, seed secrets and clues, note fantastic locations, line up key NPCs and relevant monsters, and set rewards. It all saves to the session and is right there when you sit down to run.",
    bullets: [
      { title: 'The eight-step checklist', body: 'A proven structure — strong start, scenes, secrets, locations, NPCs, monsters, and rewards.' },
      { title: 'Pulls from your world', body: 'Drop in NPCs, monsters, and locations you have already created instead of retyping them.' },
      { title: 'Ready at the table', body: 'Your prep is attached to the session and one click away when you switch to Session mode.' },
      { title: 'Debrief afterward', body: 'Capture what happened and what is next so the following prep starts halfway done.' },
    ],
    related: ['dm-screen', 'initiative-tracker', 'npc-tracker'],
  },
  {
    slug: 'npc-tracker',
    metaTitle: 'D&D NPC Tracker & Campaign Manager | GM/OS',
    metaDescription:
      'Keep every NPC, location, faction, and item organised, linked, and searchable with the GM/OS NPC tracker and campaign manager. Mention one anywhere and it auto-links. Free to start.',
    h1: 'An NPC tracker that connects your whole campaign',
    intro:
      "Your NPCs do not exist in a vacuum, so your tracker should not either. GM/OS keeps NPCs alongside locations, factions, items, deities, lore, and more — twelve linked entity types in all — each with its own fields and tags. Mention any of them in a note or another entity and it auto-links, so your world becomes a connected web you can search in a keystroke.",
    bullets: [
      { title: 'Twelve linked entity types', body: 'NPCs, PCs, creatures, locations, factions, deities, items, shops, events, lore, encounters, and threads.' },
      { title: '@-mentions auto-link', body: 'Reference an NPC anywhere and GM/OS connects it — no manual cross-linking.' },
      { title: 'Fields, tags & search', body: 'Give each type its own fields, tag freely, and find anything from the ⌘K palette.' },
      { title: 'Control player visibility', body: 'Flag what players know versus suspect, and keep GM-only secrets out of the shared view.' },
    ],
    related: ['relationship-map', 'player-view', 'session-prep'],
  },
  {
    slug: 'player-view',
    metaTitle: 'Shareable Player View for Your Campaign | GM/OS',
    metaDescription:
      'Give players a private link that shows only what you choose — never your prep or secrets. The GM/OS player view reveals entities as your story unfolds. Free to start.',
    h1: 'A player view that shows only what you want',
    intro:
      "Players love a campaign wiki — but not your secrets. GM/OS gives you a separate, private player view: share one link and your table sees only the entities you have marked visible, in a clean read-only page. Flip characters and locations between “players know” and “players suspect” as the story turns, and keep every GM note and hidden twist to yourself.",
    bullets: [
      { title: 'One private link', body: 'Share a browser link — players need no account and never touch your GM workspace.' },
      { title: 'Per-entity visibility', body: 'Reveal exactly what you choose; everything else stays hidden by default.' },
      { title: '“Know” vs “suspect”', body: 'Model what the party has confirmed versus what they only suspect, and update it live.' },
      { title: 'Always current', body: 'The view reflects your world as you edit it — no separate site to maintain.' },
    ],
    related: ['npc-tracker', 'battle-map', 'relationship-map'],
  },
];

export const getComparison = (slug) => COMPARISONS.find((c) => c.slug === slug);
export const getFeaturePage = (slug) => FEATURE_PAGES.find((f) => f.slug === slug);

// Short feature-page label, e.g. "A D&D initiative tracker…" -> "D&D initiative tracker…".
export const featureLabel = (data) => data.h1.replace(/^A |^An /i, '');

// FAQ is derived from the page data so the React component and the build-time
// prerender (JSON-LD) stay in sync from one source.
export const comparisonFaq = (data) => [
  { q: `Is GM/OS a good ${data.competitor} alternative?`, a: data.bestFor },
  { q: 'Does GM/OS have a free plan?', a: PRICING_BLURB },
  { q: `What does GM/OS do that ${data.competitor} doesn't?`, a: data.gmosWins.slice(0, 2).join(' ') },
];

export const featureFaq = (data) => [
  { q: `Is the ${featureLabel(data).toLowerCase()} free?`, a: PRICING_BLURB },
  { q: 'Do my players need an account?', a: 'No. GM/OS shares a player-facing view and the live battle map through a browser link — only you, the GM, need an account.' },
  { q: 'Which game systems does it work with?', a: "GM/OS is built around D&D 5e and the Lazy GM prep method, and its world, notes, maps, and player tools are system-agnostic — they work for most tabletop RPGs, plus custom entity types you define." },
];

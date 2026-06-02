import React from 'react';
import AuthPanel from '@/components/layout/AuthPanel';
import ThemeToggle from '@/components/ui/ThemeToggle';
import {
  BookOpen, Globe, Swords, Network, Map, Eye, Command, Check,
} from 'lucide-react';

const FEATURES = [
  { Icon: Globe, title: 'Your world, in one place', body: 'Keep NPCs, locations, factions, items, deities, and lore together — linked, tagged, and searchable.' },
  { Icon: BookOpen, title: 'Session prep', body: "A guided structure for prepping a session, based on the Lazy GM method: strong start, scenes, secrets, NPCs, monsters, and rewards." },
  { Icon: Swords, title: 'Tools for the table', body: 'Notes, an initiative tracker, dice, and a fullscreen screen for while you run the game.' },
  { Icon: Network, title: 'Relationship map', body: 'A visual map of how characters, factions, and threads connect.' },
  { Icon: Map, title: 'Maps & tables', body: 'Interactive maps for your locations, and your own random tables to roll on.' },
  { Icon: Eye, title: 'Player view', body: 'A separate page you can share with players, showing only what you choose.' },
];

const SYSTEMS = ['D&D 5e', 'Pathfinder 2e', 'Call of Cthulhu', 'Blades in the Dark', 'Mothership', 'or any system'];

// A code-rendered preview of the GM/OS UI (not a screenshot) for the hero.
function ProductPreview() {
  return (
    <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden select-none">
      {/* Taskbar */}
      <div className="flex items-center gap-2 h-9 px-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">GM<span className="text-amber-500">/OS</span></span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> RUN 00:42
        </span>
        <span className="ml-auto font-mono text-[10px] text-zinc-400 dark:text-zinc-600">⌘K · 21:14</span>
      </div>

      <div className="flex h-56">
        {/* Sidebar */}
        <div className="hidden sm:block w-32 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800/60 p-2 space-y-1">
          {['Dashboard', 'Entities', 'Sessions', 'Map', 'Timeline'].map((n, i) => (
            <div key={n} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] ${i === 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium' : 'text-zinc-500 dark:text-zinc-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
              {n}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
          <div className="rounded-lg border border-emerald-300/60 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 px-3 py-2">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">🎲 Session in progress</p>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">Session #12 — The Sunken Crypt</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[['NPCs', '24'], ['Locations', '11'], ['Threads', '6']].map(([label, n]) => (
              <div key={label} className="rounded-lg border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/40 p-2">
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-none">{n}</p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {['Kael betrayed the Duke', 'The crypt seal is weakening', 'Mara seeks the lost relic'].map((t) => (
              <div key={t} className="flex items-center gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
                <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" /> {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-zinc-200/70 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <span className="text-lg font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
          GM<span className="text-amber-500">/OS</span>
        </span>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <a href="#signin" className="text-sm font-medium px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors">
            Sign in
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-16 pb-20 sm:pt-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-4">For Game Masters</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.1]">
              A dedicated space for Game Masters.
            </h1>
            <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400 max-w-lg">
              GM/OS keeps your whole campaign in one place — your NPCs and locations, your session prep, and the tools you reach for while running the game.
            </p>
            <ul className="mt-6 space-y-2">
              {['Your world: NPCs, locations, factions, lore', 'Guided session prep', 'Notes, initiative, and dice at the table', 'A player-facing view you control'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center gap-3">
              <a href="#signin" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition-colors">
                Get started
              </a>
            </div>
          </div>
          <div className="w-full">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-16 border-t border-zinc-200/70 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-2">What's inside</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 text-center mb-10">For prepping, running, and looking back on your sessions.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 p-5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
            <Command className="w-4 h-4 text-amber-500" />
            <span>It's keyboard-driven too: a command palette (⌘K), shortcuts, and inline dice.</span>
          </div>
        </div>
      </section>

      {/* Systems */}
      <section className="px-4 sm:px-6 py-10 border-t border-zinc-200/70 dark:border-zinc-800/60">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">Built for</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {SYSTEMS.map((s) => (
              <span key={s} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Sign-in */}
      <section id="signin" className="px-4 sm:px-6 py-16 border-t border-zinc-200/70 dark:border-zinc-800/60">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Get started</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">Create an account or sign in. It's free to start.</p>
          <div className="flex justify-center">
            <AuthPanel />
          </div>
        </div>
      </section>

      <footer className="mt-auto px-4 sm:px-6 py-6 border-t border-zinc-200/70 dark:border-zinc-800/60">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 text-center max-w-3xl mx-auto leading-relaxed">
          GM/OS · a dedicated space for Game Masters. Includes the Lazy GM's Resource Document (CC BY 4.0, Michael E. Shea / SlyFlourish.com),
          the D&D SRD 5.1 (CC BY 4.0, Wizards of the Coast), and Open5e content.
        </p>
      </footer>
    </div>
  );
}

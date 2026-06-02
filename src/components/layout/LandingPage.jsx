import React from 'react';
import AuthPanel from '@/components/layout/AuthPanel';
import ThemeToggle from '@/components/ui/ThemeToggle';
import {
  BookOpen, Globe, Swords, Network, Map, Eye, Command, Check,
} from 'lucide-react';

const FEATURES = [
  { Icon: BookOpen, title: 'Session prep, the lazy way', body: "The Lazy GM's 8-step method — strong start, scenes, secrets & clues, NPCs, monsters, and rewards — in a guided flow." },
  { Icon: Globe, title: 'A living world bible', body: 'NPCs, locations, factions, items, deities, and lore — all linked, tagged, and instantly searchable.' },
  { Icon: Swords, title: 'Run the table', body: 'Initiative tracker, dice roller, live notes, and a fullscreen GM screen built for game night.' },
  { Icon: Network, title: 'Relationship map', body: 'See how every character, faction, and thread connects at a glance.' },
  { Icon: Map, title: 'Maps & random tables', body: 'Pin locations on interactive campaign maps and roll on your own tables in a click.' },
  { Icon: Eye, title: 'Player view', body: 'Share a live, spoiler-safe page with your players — you control what they see.' },
];

const SYSTEMS = ['D&D 5e', 'Pathfinder 2e', 'Call of Cthulhu', 'Blades in the Dark', 'Mothership', 'or any system'];

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
      <section className="px-4 sm:px-6 pt-16 pb-20 sm:pt-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-4">For Game Masters</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.1]">
              The operating system for Game Masters.
            </h1>
            <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400 max-w-lg">
              Prep faster, run smoother. Your campaigns, NPCs, sessions, maps, and dice — in one fast, keyboard-driven workspace.
            </p>
            <ul className="mt-6 space-y-2">
              {['Guided session prep', 'A searchable world bible', 'Live tools for game night', 'Command palette + shortcuts'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center lg:justify-end">
            <AuthPanel id="signin" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-16 border-t border-zinc-200/70 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-2">Everything your table needs</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 text-center mb-10">From the first idea to the post-session debrief.</p>
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
            <span>Plus a command palette (⌘K), keyboard shortcuts, inline dice, and background music.</span>
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

      {/* CTA + footer */}
      <section className="px-4 sm:px-6 py-16 border-t border-zinc-200/70 dark:border-zinc-800/60 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Ready to run your best session?</h2>
        <a href="#signin" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition-colors">
          Get started — it's free
        </a>
      </section>

      <footer className="mt-auto px-4 sm:px-6 py-6 border-t border-zinc-200/70 dark:border-zinc-800/60">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 text-center max-w-3xl mx-auto leading-relaxed">
          GM/OS · The operating system for Game Masters. Includes the Lazy GM's Resource Document (CC BY 4.0, Michael E. Shea / SlyFlourish.com),
          the D&D SRD 5.1 (CC BY 4.0, Wizards of the Coast), and Open5e content.
        </p>
      </footer>
    </div>
  );
}

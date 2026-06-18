import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AuthPanel from '@/components/layout/AuthPanel';
import ThemeToggle from '@/components/ui/ThemeToggle';
import PricingTiers from '@/components/billing/PricingTiers';
import {
  BookOpen, Globe, Swords, Network, Map, Eye, Command, Check,
  LayoutGrid, Search, X, Minus, Square, Grid2x2, Archive,
} from 'lucide-react';

const FEATURES = [
  { Icon: LayoutGrid, title: 'A desktop-style workspace', body: 'Open your pages as floating windows you can drag, resize, and snap. Switch between Prep, Session, and Debrief modes from the taskbar, and jump anywhere with the ⌘K command palette.' },
  { Icon: Globe, title: 'Your world, in one place', body: 'Keep NPCs, locations, factions, items, deities, and lore together — linked, tagged, and searchable.' },
  { Icon: BookOpen, title: 'Session prep', body: "A guided structure for prepping a session, based on the Lazy GM method: strong start, scenes, secrets, NPCs, monsters, and rewards." },
  { Icon: Swords, title: 'Tools for the table', body: 'Notes, an initiative tracker, dice, and a fullscreen screen for while you run the game.' },
  { Icon: Network, title: 'Relationship map', body: 'A visual map of how characters, factions, and threads connect.' },
  { Icon: Map, title: 'Maps & tables', body: 'Interactive maps for your locations, and your own random tables to roll on.' },
  { Icon: Eye, title: 'Player view', body: 'A separate page you can share with players, showing only what you choose.' },
  { Icon: Grid2x2, title: 'Live battle map', body: 'A shared, real-time grid — drop and move tokens, and your players see it update live as you run combat.' },
  { Icon: Archive, title: 'Own your data', body: 'Export a full backup of any campaign to a file, and import it back anytime. Your world is yours to keep.' },
];

// A code-rendered preview of the GM/OS desktop (not a screenshot) for the hero —
// mirrors the real OS chrome: taskbar (Start, mode badge, window strip, tray)
// with draggable floating windows on the desktop.

// Three mock window controls, matching Window.jsx (left-aligned, not mac dots).
function WinControls() {
  return (
    <div className="flex items-center gap-1">
      {[X, Minus, Square].map((Icon, i) => (
        <span key={i} className="w-3 h-3 rounded-[3px] bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
          <Icon className="w-2 h-2" strokeWidth={2.75} />
        </span>
      ))}
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden select-none">
      {/* Taskbar */}
      <div className="flex items-center gap-1.5 h-8 px-2 border-b border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-950">
        {/* Start button */}
        <span className="flex items-center gap-1 px-1.5 h-6 rounded-md text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
          <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
          GM<span className="text-amber-500">/OS</span>
        </span>
        {/* Active mode badge */}
        <span className="flex items-center gap-1 px-1.5 h-6 rounded-md font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> RUN
        </span>
        {/* Open-window strip */}
        <div className="hidden sm:flex items-center gap-1 min-w-0">
          {[['Dashboard', true], ['The Sunken Crypt', false], ['Kael', false]].map(([label, active]) => (
            <span key={label} className={`flex items-center gap-1 h-6 px-1.5 rounded-md text-[10px] font-medium whitespace-nowrap ${active ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
              {label}
            </span>
          ))}
        </div>
        {/* System tray */}
        <div className="ml-auto flex items-center gap-1 pl-1 pr-1.5 h-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
          <Search className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
          <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
          <span className="font-mono text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">21:14</span>
        </div>
      </div>

      {/* Desktop with floating windows */}
      <div
        className="relative h-60 sm:h-64 overflow-hidden bg-zinc-100/60 dark:bg-zinc-900/40"
        style={{
          backgroundImage: 'radial-gradient(currentColor 0.5px, transparent 0.5px)',
          backgroundSize: '14px 14px',
          color: 'rgb(161 161 170 / 0.25)',
        }}
      >
        {/* Back window — an entity (unfocused) */}
        <div className="absolute left-[3%] top-[7%] w-[55%] h-[60%] flex flex-col rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg shadow-black/10 overflow-hidden">
          <div className="flex items-center gap-2 h-7 px-2 border-b border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/60">
            <WinControls />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 truncate">Entity</span>
          </div>
          <div className="flex-1 p-2.5 min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-md bg-rose-500/15 text-rose-500 flex items-center justify-center text-[11px] font-bold">K</span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-none">Kael Voss</p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-600 mt-0.5">NPC · Antagonist</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {['Spy', 'Duke’s court', 'Hidden'].map((t) => (
                <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/70 text-zinc-500 dark:text-zinc-400">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Front window — the dashboard (focused: amber border) */}
        <div className="absolute right-[3%] bottom-[7%] w-[64%] h-[80%] flex flex-col rounded-lg border border-amber-500/60 dark:border-amber-500/50 bg-white dark:bg-zinc-950 shadow-xl shadow-black/20 overflow-hidden">
          <div className="flex items-center gap-2 h-7 px-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
            <WinControls />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 truncate">Dashboard</span>
          </div>
          <div className="flex-1 p-2.5 space-y-2 min-h-0 overflow-hidden">
            <div className="rounded-md border border-emerald-300/60 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 px-2.5 py-1.5">
              <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">🎲 Session in progress</p>
              <p className="text-[9px] text-zinc-600 dark:text-zinc-400 mt-0.5">Session #12 — The Sunken Crypt</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[['NPCs', '24'], ['Locations', '11'], ['Threads', '6']].map(([label, n]) => (
                <div key={label} className="rounded-md border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/40 p-1.5">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-none">{n}</p>
                  <p className="text-[8px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {['Kael betrayed the Duke', 'The crypt seal is weakening'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-[9px] text-zinc-600 dark:text-zinc-400">
                  <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" /> {t}
                </div>
              ))}
            </div>
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
          <a href="#pricing" className="hidden sm:inline text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            Pricing
          </a>
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

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-16 border-t border-zinc-200/70 dark:border-zinc-800/60">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-2">Simple pricing</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 text-center mb-10">Start free with one campaign. Upgrade any time for unlimited.</p>
          <PricingTiers onSelect={() => { window.location.hash = 'signin'; }} ctaLabel="Get started" />
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
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 text-center mt-2">
          <Link to={createPageUrl('Help')} className="hover:text-zinc-600 dark:hover:text-zinc-400 hover:underline">User Manual</Link>
          <span className="mx-2" aria-hidden>·</span>
          <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-zinc-600 dark:hover:text-zinc-400 hover:underline">Privacy Policy</Link>
          <span className="mx-2" aria-hidden>·</span>
          <Link to={createPageUrl('Terms')} className="hover:text-zinc-600 dark:hover:text-zinc-400 hover:underline">Terms of Service</Link>
        </p>
      </footer>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';

const SEEN_KEY = 'gmos_tour_seen';
const CARD_W = 320;
const PAD = 6; // spotlight padding around the target

// Steps anchor to persistent OS chrome (taskbar + sidebar), so they survive the
// page navigations a couple of steps trigger via `goto`. A step with no
// `selector` (or whose target never appears) falls back to a centered card.
const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to GM/OS',
    body: "Your desktop for running tabletop campaigns. Take ~30 seconds and I'll show you around the interface.",
  },
  {
    id: 'start',
    selector: '[data-tour="start"]',
    title: 'The Start button',
    body: 'Toggle the left sidebar between docked and a floating Start-menu dropdown. Your choice is remembered.',
  },
  {
    id: 'mode',
    selector: '[data-tour="mode"]',
    title: 'Campaign mode',
    body: 'Shows whether you’re in PREP, RUN, or DEBRIEF. Click it to jump straight to your active session.',
  },
  {
    id: 'search',
    selector: '[data-tour="search"]',
    title: 'Command Palette',
    body: 'Press ⌘K / Ctrl+K anywhere to search, create, jump to a page — or roll dice inline (type “2d6” and Enter).',
  },
  {
    id: 'tray',
    selector: '[data-tour="tray"]',
    title: 'System tray',
    body: 'Your tray apps: a YouTube audio player for ambience, the notification center, a light/dark toggle, and the clock.',
  },
  {
    id: 'nav',
    selector: '[data-tour="nav"]',
    goto: (id) => createPageUrl('CampaignDashboard') + `?id=${id}`,
    title: 'Campaign navigation',
    body: 'Everything in this campaign lives here — dashboard, sessions, maps, random tables, timeline, and the player share view.',
  },
  {
    id: 'world',
    selector: '[data-tour="nav-world"]',
    title: 'Build your world',
    body: 'Your NPCs, locations, factions, items and more are “entities.” Group them here, then wire them together on the Relationship Map.',
  },
  {
    id: 'sessions',
    selector: '[data-tour="nav-SessionBrowser"]',
    goto: (id) => createPageUrl('SessionBrowser') + `?campaign_id=${id}`,
    title: 'Prep & run sessions',
    body: 'Sessions have three tabs: Prep (an 8-step Lazy GM wizard), Run (the floating GM Screen with dice + trackers), and Debrief.',
  },
  {
    id: 'quick-capture',
    selector: '[data-tour="quick-capture"]',
    title: 'Capture anything',
    body: 'This + button (⌥N) creates an entity from any page without losing your place — perfect mid-combat.',
  },
  {
    id: 'finish',
    title: 'You’re all set',
    body: 'Press ? anytime for shortcuts, and relaunch this tour from the Command Palette (⌘K → “tour”). Now go run a great game.',
  },
];

function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
}

// First-visit nudge: a small, dismissible card offering the tour. Either choice
// marks the tour as seen so it never nags twice.
function TourPrompt({ onStart, onDismiss }) {
  return (
    <div className="fixed bottom-5 left-5 z-[290] w-[19rem] max-w-[calc(100vw-2.5rem)] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mb-1">New here?</p>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Take a 30-second tour</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
        A quick walkthrough of the GM/OS interface and how to run a game.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onStart}
          className="flex-1 h-8 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
        >
          Start tour
        </button>
        <button
          onClick={onDismiss}
          className="h-8 px-3 rounded-md text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          I’ll figure it out
        </button>
      </div>
    </div>
  );
}

export default function Tour({ open, onOpenChange, campaignId }) {
  const navigate = useNavigate();
  const [seen, setSeen] = useState(() => {
    try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
  });
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);

  const total = STEPS.length;
  const step = STEPS[index];

  const close = useCallback(() => {
    markSeen();
    setSeen(true);
    setIndex(0);
    setRect(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const go = useCallback((delta) => {
    setIndex((i) => {
      const next = i + delta;
      if (next < 0) return 0;
      if (next >= total) { close(); return i; }
      return next;
    });
  }, [total, close]);

  // Reset to the first step whenever the tour (re)opens.
  useEffect(() => {
    if (open) { setIndex(0); }
  }, [open]);

  // Locate the current step's target — navigating first if the step asks for it,
  // then polling until the element exists (or timing out → centered fallback).
  useEffect(() => {
    if (!open) return undefined;
    let raf = 0;
    let cancelled = false;

    if (step.goto && campaignId) navigate(step.goto(campaignId));

    if (!step.selector) { setRect(null); return undefined; }

    const deadline = performance.now() + 1600;
    const find = () => {
      if (cancelled) return;
      const el = document.querySelector(step.selector);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width || r.height) { setRect(r); return; }
      }
      if (performance.now() < deadline) {
        raf = requestAnimationFrame(find);
      } else {
        setRect(null); // graceful fallback (e.g. sidebar collapsed on mobile)
      }
    };
    raf = requestAnimationFrame(find);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [open, index, step, campaignId, navigate]);

  // Keep the spotlight aligned on resize / scroll.
  useLayoutEffect(() => {
    if (!open || !step.selector) return undefined;
    const reposition = () => {
      const el = document.querySelector(step.selector);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, index, step]);

  // Keyboard control.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, close, go]);

  // First-visit prompt (only when the tour itself isn't running and hasn't been seen).
  if (!open) {
    if (seen) return null;
    return createPortal(
      <TourPrompt
        onStart={() => { markSeen(); setSeen(true); onOpenChange(true); }}
        onDismiss={() => { markSeen(); setSeen(true); }}
      />,
      document.body
    );
  }

  // ---- Running tour ----
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(CARD_W, vw - 24);

  // Spotlight box (viewport coords).
  const spot = rect && {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  // Card placement: below the target if there's room, otherwise above; centered
  // when there's no target.
  let cardStyle;
  if (spot) {
    const below = spot.top + spot.height < vh * 0.6;
    const top = below ? spot.top + spot.height + 12 : Math.max(12, spot.top - 12 - 200);
    let left = spot.left;
    left = Math.min(left, vw - cardW - 12);
    left = Math.max(left, 12);
    cardStyle = { top, left, width: cardW, maxHeight: vh - top - 12 };
  } else {
    cardStyle = {
      top: '50%', left: '50%', width: cardW,
      transform: 'translate(-50%, -50%)',
    };
  }

  const block = (e) => { e.preventDefault(); e.stopPropagation(); };

  return createPortal(
    <div className="fixed inset-0 z-[300]" role="dialog" aria-modal="true" aria-label="Interactive tour">
      {/* Click blocker + dim (dim comes from the spotlight's box-shadow when a target exists) */}
      <div
        className={cn('absolute inset-0 transition-colors', !spot && 'bg-black/60')}
        onMouseDown={block}
      />

      {/* Spotlight */}
      {spot && (
        <div
          className="absolute rounded-md ring-2 ring-amber-500 pointer-events-none transition-all duration-200"
          style={{
            top: spot.top, left: spot.left, width: spot.width, height: spot.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          }}
        />
      )}

      {/* Card */}
      <div
        className="absolute rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-4 flex flex-col"
        style={cardStyle}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">
            GM/OS tour · {index + 1}/{total}
          </span>
          <button
            onClick={close}
            aria-label="Close tour"
            className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed overflow-y-auto">{step.body}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1 mt-3">
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                'h-1 rounded-full transition-all',
                i === index ? 'w-4 bg-amber-500' : 'w-1 bg-zinc-300 dark:bg-zinc-700'
              )}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 mt-3">
          <button
            onClick={close}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            Skip
          </button>
          <div className="flex items-center gap-1.5">
            {index > 0 && (
              <button
                onClick={() => go(-1)}
                className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              onClick={() => go(1)}
              className="h-8 px-3 inline-flex items-center gap-1 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
            >
              {index === total - 1 ? 'Finish' : 'Next'}
              {index < total - 1 && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

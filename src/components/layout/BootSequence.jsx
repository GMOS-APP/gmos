import React, { useState, useEffect, useCallback } from 'react';

const STEPS = [
  'initializing kernel',
  'mounting campaign vault',
  'loading world entities',
  'syncing session state',
];

// A brief, skippable GM/OS "boot" splash shown once per browser session
// (keyed off the gmos_booted flag, which Sidebar clears on logout).
export default function BootSequence() {
  const [done, setDone] = useState(() => {
    try { return sessionStorage.getItem('gmos_booted') === '1'; } catch { return true; }
  });
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  const finish = useCallback(() => {
    try { sessionStorage.setItem('gmos_booted', '1'); } catch { /* ignore */ }
    setClosing(true);
    setTimeout(() => setDone(true), 320);
  }, []);

  useEffect(() => {
    if (done) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { finish(); return undefined; }

    const stepMs = 280;
    const timers = STEPS.map((_, i) => setTimeout(() => setStep(i + 1), stepMs * (i + 1)));
    const end = setTimeout(finish, stepMs * (STEPS.length + 1) + 400);
    const skip = () => finish();
    window.addEventListener('keydown', skip);
    window.addEventListener('mousedown', skip);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('mousedown', skip);
    };
  }, [done, finish]);

  if (done) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-zinc-950 transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="font-mono text-sm w-72">
        <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">GM<span className="text-amber-500">/OS</span></div>
        <div className="text-[11px] text-zinc-400 dark:text-zinc-600 mb-5">v2026.05</div>
        <div className="space-y-1.5">
          {STEPS.map((line, i) => (
            <div key={line} className={`flex items-center gap-2 transition-opacity duration-200 ${i < step ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-emerald-600 dark:text-emerald-500">▸</span>
              <span className="text-zinc-500 dark:text-zinc-400">{line}…</span>
              <span className="ml-auto text-emerald-600 dark:text-emerald-500">✓</span>
            </div>
          ))}
        </div>
        <div className={`mt-5 text-amber-500 transition-opacity duration-200 ${step >= STEPS.length ? 'opacity-100' : 'opacity-0'}`}>ready.</div>
        <div className="mt-2 text-[10px] text-zinc-300 dark:text-zinc-700">press any key to skip</div>
      </div>
    </div>
  );
}

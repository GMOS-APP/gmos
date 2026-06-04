import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PRESETS = [1, 5, 10, 15, 30]; // minutes

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, now + t);
      g.gain.exponentialRampToValueAtTime(0.15, now + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.18);
      o.start(now + t);
      o.stop(now + t + 0.2);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch { /* audio not available */ }
}

const fmt = (s) => {
  const sec = Math.max(0, s);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  const pad = (n) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
};

export default function StandaloneTimer() {
  const [duration, setDuration] = useState(300); // seconds the timer is set to
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const endRef = useRef(0);

  useEffect(() => {
    if (!running) return undefined;
    endRef.current = Date.now() + remaining * 1000;
    const tick = () => {
      const left = Math.round((endRef.current - Date.now()) / 1000);
      if (left <= 0) {
        setRemaining(0);
        setRunning(false);
        setDone(true);
        beep();
      } else {
        setRemaining(left);
      }
    };
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const setTo = (seconds) => {
    setRunning(false);
    setDone(false);
    setDuration(seconds);
    setRemaining(seconds);
  };

  const toggle = () => {
    if (done || remaining <= 0) return;
    setRunning((r) => !r);
  };

  const reset = () => {
    setRunning(false);
    setDone(false);
    setRemaining(duration);
  };

  const lowTime = running && remaining <= 10;

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Countdown</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className={cn(
          'text-5xl font-mono font-bold tabular-nums transition-colors',
          done ? 'text-red-500 animate-pulse'
            : lowTime ? 'text-amber-500'
            : running ? 'text-zinc-900 dark:text-zinc-100'
            : 'text-zinc-500 dark:text-zinc-400'
        )}>
          {fmt(remaining)}
        </p>

        {done && <p className="text-xs font-semibold uppercase tracking-widest text-red-500">Time’s up</p>}

        {/* Preset / manual set (only when idle) */}
        {!running && (
          <div className="flex flex-wrap items-center justify-center gap-1">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => setTo(m * 60)}
                className={cn(
                  'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                  !done && duration === m * 60
                    ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'
                )}
              >
                {m}m
              </button>
            ))}
            <label className="flex items-center gap-1 ml-1">
              <input
                type="number" min="0" max="999" inputMode="numeric"
                value={Math.round(duration / 60)}
                onChange={(e) => setTo(Math.max(0, Math.min(999, parseInt(e.target.value, 10) || 0)) * 60)}
                className="w-12 text-center text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-1 py-0.5 focus:outline-none focus:border-amber-500/50"
              />
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600">min</span>
            </label>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline" onClick={toggle} disabled={done || remaining <= 0}
            className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 gap-1.5"
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {running ? 'Pause' : 'Start'}
          </Button>
          <Button
            size="sm" variant="outline" onClick={reset}
            className="border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

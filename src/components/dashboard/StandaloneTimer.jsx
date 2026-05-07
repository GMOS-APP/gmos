import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StandaloneTimer() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const baseRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(baseRef.current + Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const toggle = () => {
    if (running) {
      baseRef.current = elapsed;
    }
    setRunning((r) => !r);
  };

  const reset = () => {
    setRunning(false);
    baseRef.current = 0;
    setElapsed(0);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Timer</h3>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <p className={`text-5xl font-mono font-bold tabular-nums transition-colors ${running ? 'text-zinc-900 dark:text-zinc-100' : elapsed > 0 ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600'}`}>
          {formatTime(elapsed)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={toggle}
            className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 gap-1.5"
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {running ? 'Pause' : 'Start'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={reset}
            className="border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
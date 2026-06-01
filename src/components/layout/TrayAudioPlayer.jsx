import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Square, Volume2 } from 'lucide-react';
import { useAudioPlayer } from '@/lib/AudioPlayerContext';
import { cn } from '@/lib/utils';

// System-tray "app": a music button that opens a small YouTube audio player.
// The actual playback lives in AudioPlayerProvider so it survives navigation.
export default function TrayAudioPlayer() {
  const audio = useAudioPlayer();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const ref = useRef(null);

  useEffect(() => { if (audio) setUrl(audio.lastUrl()); }, [audio]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest('[data-audio-button]')) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  if (!audio) return null;

  const submit = (e) => { e.preventDefault(); audio.load(url); };

  return (
    <>
      <button
        data-audio-button
        onClick={() => setOpen((o) => !o)}
        title="Audio"
        aria-label="Audio player"
        className={cn(
          'h-7 w-7 flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
          audio.playing
            ? 'text-amber-500'
            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'
        )}
      >
        <Music className={cn('w-3.5 h-3.5', audio.playing && 'animate-pulse')} />
      </button>

      {open && (
        <div ref={ref} className="fixed right-2 top-11 z-50 w-72 max-w-[calc(100vw-1rem)] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">audio</span>
          </div>

          <div className="p-3 space-y-3">
            <form onSubmit={submit} className="flex gap-1.5">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube link…"
                className="flex-1 min-w-0 px-2 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                Load
              </button>
            </form>

            <div className="flex items-center gap-2">
              <button
                onClick={audio.toggle}
                disabled={!audio.hasMedia}
                aria-label={audio.playing ? 'Pause' : 'Play'}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                {audio.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <p className="flex-1 min-w-0 text-xs text-zinc-600 dark:text-zinc-400 truncate">
                {audio.hasMedia ? (audio.track?.title || 'Loading…') : 'Nothing playing'}
              </p>
              <button
                onClick={audio.stop}
                disabled={!audio.hasMedia}
                aria-label="Stop"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={audio.volume}
                onChange={(e) => audio.setVolume(Number(e.target.value))}
                aria-label="Volume"
                className="flex-1 accent-amber-500"
              />
              <span className="w-7 text-right text-[11px] font-mono tabular-nums text-zinc-500">{audio.volume}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

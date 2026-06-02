import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '@/lib/NotificationContext';
import { cn } from '@/lib/utils';

const TYPE_DOT = {
  info: 'bg-zinc-400',
  session: 'bg-emerald-500',
  alert: 'bg-red-500',
  success: 'bg-amber-500',
};

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// System-tray notification center.
export default function TrayNotifications() {
  const notes = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    if (notes) notes.markAllRead();
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest('[data-bell-button]')) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, notes]);

  if (!notes) return null;
  const { items, unread, clear } = notes;

  return (
    <>
      <button
        data-bell-button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        aria-label="Notifications"
        className="relative h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
      >
        <Bell className="w-3.5 h-3.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 flex items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950 tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div ref={ref} className="fixed right-2 top-11 z-50 w-80 max-w-[calc(100vw-1rem)] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">notifications</span>
            {items.length > 0 && (
              <button
                onClick={clear}
                className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-zinc-400 dark:text-zinc-600">
                <Check className="w-5 h-5" />
                <p className="text-xs">You're all caught up.</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map((n) => (
                  <li key={n.id} className="flex items-start gap-2.5 px-3 py-2.5">
                    <span className={cn('mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0', TYPE_DOT[n.type] || TYPE_DOT.info)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{n.title}</p>
                      {n.body && <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-0.5">{n.body}</p>}
                      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-0.5">{relativeTime(n.ts)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Announcement } from '@/api/entities';
import { Megaphone, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'gmos_dismissed_announcements';
const getDismissed = () => {
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]'); } catch { return []; }
};

const LEVELS = {
  info:    { Icon: Megaphone,     cls: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200' },
  warning: { Icon: AlertTriangle, cls: 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200' },
  success: { Icon: CheckCircle2,  cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' },
};

export default function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(getDismissed);

  const { data: list = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => Announcement.filter({ published: true }, '-created_date', 5),
    staleTime: 60000,
  });

  const ann = list.find((a) => !dismissed.includes(a.id));
  if (!ann) return null;
  const lvl = LEVELS[ann.level] || LEVELS.info;

  const dismiss = () => {
    const next = [...dismissed, ann.id].slice(-50);
    setDismissed(next);
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  return (
    <div className={cn('flex items-start gap-2.5 px-4 py-2 border-b text-sm flex-shrink-0', lvl.cls)}>
      <lvl.Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <p className="flex-1 min-w-0 leading-snug">
        <span className="font-semibold">{ann.title}</span>
        {ann.body && <span className="ml-2 opacity-90">{ann.body}</span>}
      </p>
      <button onClick={dismiss} aria-label="Dismiss" className="flex-shrink-0 opacity-70 hover:opacity-100 mt-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

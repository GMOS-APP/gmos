import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PrepStep({ number, title, subtitle, icon: Icon, color = 'amber', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  const colorMap = {
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  };

  const badgeColor = {
    amber: 'bg-amber-500 text-zinc-950',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white',
    green: 'bg-green-500 text-zinc-950',
    rose: 'bg-rose-500 text-white',
    cyan: 'bg-cyan-500 text-zinc-950',
    orange: 'bg-orange-500 text-zinc-950',
    indigo: 'bg-indigo-500 text-white',
  };

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <span className={cn('w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0', badgeColor[color])}>
          {number}
        </span>
        <div className={cn('p-1.5 rounded-lg border', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-200">{title}</p>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-zinc-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-600" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800/60">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}
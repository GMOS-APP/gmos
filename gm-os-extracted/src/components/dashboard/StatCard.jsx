import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon: Icon, accent = 'text-zinc-400' }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-zinc-800/50", accent)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-100">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
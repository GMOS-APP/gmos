import React from 'react';
import { Eye, Brain, Search, Shield, Heart, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STAT_COLS = [
  { key: 'passive_perception', label: 'PP', icon: Eye, color: 'text-violet-400' },
  { key: 'passive_insight', label: 'PI', icon: Brain, color: 'text-blue-400' },
  { key: 'passive_investigation', label: 'PInv', icon: Search, color: 'text-cyan-400' },
  { key: 'armor_class', label: 'AC', icon: Shield, color: 'text-amber-400' },
  { key: 'max_hit_points', label: 'HP', icon: Heart, color: 'text-rose-400' },
];

export default function PassiveStatsHub({ playerCharacters, campaignId }) {
  if (!playerCharacters || playerCharacters.length === 0) {
    return (
      <div className="bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-6 text-center">
        <p className="text-zinc-600 dark:text-zinc-600 text-sm">No player characters yet. Add PCs to see their stats here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/60">
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">
                Character
              </th>
              {STAT_COLS.map((c) => (
                <th key={c.key} className="text-center px-3 py-2.5">
                  <span className={`flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-widest ${c.color}`}>
                    <c.icon className="w-3 h-3" />
                    {c.label}
                  </span>
                </th>
              ))}
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Languages
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {playerCharacters.map((pc) => {
              const ex = pc.extra_data || {};
              return (
                <tr key={pc.id} className="border-b border-zinc-200 dark:border-zinc-800/30 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                   <td className="px-4 py-3">
                     <Link
                       to={createPageUrl('EntityDetail') + `?id=${pc.id}&campaign_id=${campaignId}`}
                       className="group flex items-center gap-3"
                     >
                       {pc.image_url && (
                         <img 
                           src={pc.image_url} 
                           alt={pc.name}
                           className="w-10 h-12 rounded object-cover border border-zinc-300 dark:border-zinc-700 flex-shrink-0"
                         />
                       )}
                       <div>
                         <p className="font-medium text-zinc-900 dark:text-zinc-200 text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{pc.name}</p>
                         {ex.class && <p className="text-[11px] text-zinc-600 dark:text-zinc-600 mt-0.5">{ex.class}</p>}
                       </div>
                     </Link>
                   </td>
                  {STAT_COLS.map((c) => (
                    <td key={c.key} className="text-center px-3 py-3">
                      <span className={`text-lg font-bold tabular-nums ${ex[c.key] ? c.color : 'text-zinc-400 dark:text-zinc-700'}`}>
                        {ex[c.key] || '—'}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    {ex.languages
                      ? <p className="text-xs text-zinc-700 dark:text-zinc-400">{ex.languages}</p>
                      : <span className="text-zinc-400 dark:text-zinc-700 text-sm">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
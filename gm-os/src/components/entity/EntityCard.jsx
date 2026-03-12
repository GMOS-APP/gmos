import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, MapPin, Shield, Waypoints, Package, Sparkles, Scroll, BookOpen, Eye, EyeOff, AlertTriangle, Swords, Church, Flame, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeIcons = {
  npc: Users,
  creature: Swords,
  location: MapPin,
  faction: Shield,
  thread: Waypoints,
  item: Package,
  player_character: Sparkles,
  event: Scroll,
  lore: BookOpen,
  deity: Church,
  encounter: Flame,
  shop: ShoppingBag,
};

const typeColors = {
  npc: 'dark:text-violet-400 text-violet-600 dark:border-violet-500/20 border-violet-200 dark:bg-violet-500/5 bg-violet-50',
  creature: 'dark:text-red-400 text-red-600 dark:border-red-500/20 border-red-200 dark:bg-red-500/5 bg-red-50',
  location: 'dark:text-emerald-400 text-emerald-600 dark:border-emerald-500/20 border-emerald-200 dark:bg-emerald-500/5 bg-emerald-50',
  faction: 'dark:text-rose-400 text-rose-600 dark:border-rose-500/20 border-rose-200 dark:bg-rose-500/5 bg-rose-50',
  thread: 'dark:text-blue-400 text-blue-600 dark:border-blue-500/20 border-blue-200 dark:bg-blue-500/5 bg-blue-50',
  item: 'dark:text-amber-400 text-amber-600 dark:border-amber-500/20 border-amber-200 dark:bg-amber-500/5 bg-amber-50',
  player_character: 'dark:text-cyan-400 text-cyan-600 dark:border-cyan-500/20 border-cyan-200 dark:bg-cyan-500/5 bg-cyan-50',
  event: 'dark:text-pink-400 text-pink-600 dark:border-pink-500/20 border-pink-200 dark:bg-pink-500/5 bg-pink-50',
  lore: 'dark:text-orange-400 text-orange-600 dark:border-orange-500/20 border-orange-200 dark:bg-orange-500/5 bg-orange-50',
  deity: 'dark:text-yellow-400 text-yellow-600 dark:border-yellow-500/20 border-yellow-200 dark:bg-yellow-500/5 bg-yellow-50',
  encounter: 'dark:text-fuchsia-400 text-fuchsia-600 dark:border-fuchsia-500/20 border-fuchsia-200 dark:bg-fuchsia-500/5 bg-fuchsia-50',
  shop: 'dark:text-teal-400 text-teal-600 dark:border-teal-500/20 border-teal-200 dark:bg-teal-500/5 bg-teal-50',
};

const visibilityIcons = {
  dm_only: { icon: EyeOff, label: 'DM Only', class: 'text-zinc-500' },
  players_know: { icon: Eye, label: 'Known', class: 'text-green-500' },
  players_suspect: { icon: Eye, label: 'Suspected', class: 'text-yellow-500' },
  false_info: { icon: AlertTriangle, label: 'False', class: 'text-red-500' },
};

export default function EntityCard({ entity }) {
  const Icon = typeIcons[entity.entity_type] || Scroll;
  const colors = typeColors[entity.entity_type] || 'text-zinc-400 border-zinc-500/20 bg-zinc-500/5';
  const vis = visibilityIcons[entity.visibility] || visibilityIcons.dm_only;
  const VisIcon = vis.icon;

  return (
    <Link
      to={createPageUrl('EntityDetail') + `?id=${entity.id}&campaign_id=${entity.campaign_id}`}
      className={cn(
        "group block p-4 rounded-xl border transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-black/20 hover:shadow-gray-200/50",
        "dark:bg-zinc-900/40 dark:border-zinc-800/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg border", colors)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold dark:text-zinc-200 dark:group-hover:text-zinc-100 text-gray-900 group-hover:text-gray-950 truncate text-sm">
              {entity.name}
            </h3>
            <VisIcon className={cn("w-3 h-3 flex-shrink-0", vis.class)} />
          </div>
          {entity.summary && (
           <p className="text-xs dark:text-zinc-500 text-gray-600 mt-1 line-clamp-2">{entity.summary}</p>
          )}
          {entity.key_facts?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entity.key_facts.slice(0, 2).map((fact, i) => (
               <span key={i} className="text-[10px] px-1.5 py-0.5 rounded dark:bg-zinc-800 dark:text-zinc-500 bg-gray-200 text-gray-700 truncate max-w-[180px]">
                 {fact}
               </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {entity.status && entity.status !== 'active' && (
       <Badge variant="outline" className="mt-2 text-[10px] dark:border-zinc-700 dark:text-zinc-500 border-gray-300 text-gray-600 capitalize">
         {entity.status}
       </Badge>
      )}
    </Link>
  );
}
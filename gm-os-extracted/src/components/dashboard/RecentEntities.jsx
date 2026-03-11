import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, MapPin, Shield, Waypoints, Package, Sparkles, Scroll, BookOpen, Swords, Church, Flame, ShoppingBag } from 'lucide-react';
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
  npc: 'text-violet-400',
  creature: 'text-red-400',
  location: 'text-emerald-400',
  faction: 'text-rose-400',
  thread: 'text-blue-400',
  item: 'text-amber-400',
  player_character: 'text-cyan-400',
  event: 'text-pink-400',
  lore: 'text-orange-400',
  deity: 'text-yellow-400',
  encounter: 'text-fuchsia-400',
  shop: 'text-teal-400',
};

export default function RecentEntities({ entities = [] }) {
  if (entities.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-600 text-sm">
        No world entities yet. Start adding notes to build your world.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entities.slice(0, 8).map((entity) => {
        const Icon = typeIcons[entity.entity_type] || Scroll;
        const color = typeColors[entity.entity_type] || 'text-zinc-400';
        return (
          <Link
            key={entity.id}
            to={createPageUrl('EntityDetail') + `?id=${entity.id}&campaign_id=${entity.campaign_id}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
          >
            <Icon className={cn("w-4 h-4 flex-shrink-0", color)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 truncate">
                {entity.name}
              </p>
              {entity.summary && (
                <p className="text-xs text-zinc-600 truncate">{entity.summary}</p>
              )}
            </div>
            <span className={cn("text-[10px] uppercase tracking-wider font-medium", color)}>
              {entity.entity_type?.replace('_', ' ')}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
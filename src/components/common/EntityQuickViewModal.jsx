import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';
import { Users, MapPin, Shield, Waypoints, Package, Sparkles, Scroll, BookOpen, Swords, Church, Flame, ShoppingBag, StickyNote } from 'lucide-react';

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
  note: StickyNote,
};

const typeColors = {
  npc: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20',
  creature: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  location: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  faction: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
  thread: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  item: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  player_character: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20',
  event: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20',
  lore: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  deity: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20',
  encounter: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/20',
  shop: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20',
};

export default function EntityQuickViewModal({ entity, campaignId, open, onOpenChange }) {
  if (!entity) return null;

  const Icon = typeIcons[entity.entity_type] || Scroll;
  const colors = typeColors[entity.entity_type] || 'text-zinc-400 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700';
  const detailUrl = createPageUrl('EntityDetail') + `?id=${entity.id}&campaign_id=${campaignId || entity.campaign_id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 max-w-md p-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 p-5 pb-4 border-b border-gray-100 dark:border-zinc-800">
          {entity.image_url ? (
            <img
              src={entity.image_url}
              alt={entity.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-zinc-700"
            />
          ) : (
            <div className={`p-2.5 rounded-lg border flex-shrink-0 ${colors}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100 leading-tight">{entity.name}</h2>
            <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border mt-1 capitalize ${colors}`}>
              {entity.entity_type?.replace('_', ' ')}
            </span>
          </div>
          {entity.status && entity.status !== 'active' && (
            <span className="text-[10px] text-gray-500 dark:text-zinc-500 capitalize bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-2 py-0.5 rounded-full flex-shrink-0">
              {entity.status}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {entity.summary && (
            <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">{entity.summary}</p>
          )}

          {entity.key_facts?.length > 0 && (
            <ul className="space-y-1.5">
              {entity.key_facts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 flex-shrink-0 mt-1.5" />
                  {fact}
                </li>
              ))}
            </ul>
          )}

          {entity.description && (
            <div className="pt-1 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">Notes</p>
              <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap line-clamp-6">{entity.description}</p>
            </div>
          )}

          {!entity.summary && !entity.key_facts?.length && !entity.description && (
            <p className="text-sm text-gray-400 dark:text-zinc-600 italic">No details recorded yet.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60">
          <Link
            to={detailUrl}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open full page
          </Link>
        </div>

      </DialogContent>
    </Dialog>
  );
}

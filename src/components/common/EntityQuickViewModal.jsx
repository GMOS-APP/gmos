import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ExternalLink, X } from 'lucide-react';
import { Users, MapPin, Shield, Waypoints, Package, Sparkles, Scroll, BookOpen, Swords, Church, Flame, ShoppingBag, StickyNote } from 'lucide-react';

const typeIcons = {
  npc: Users, creature: Swords, location: MapPin, faction: Shield,
  thread: Waypoints, item: Package, player_character: Sparkles,
  event: Scroll, lore: BookOpen, deity: Church, encounter: Flame,
  shop: ShoppingBag, note: StickyNote,
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

const POPUP_WIDTH = 300;

export default function EntityQuickViewModal({ entity, campaignId, open, onOpenChange, anchorRect }) {
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOpenChange(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onOpenChange]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (!open || !entity) return null;

  // Position below anchor, flip up if too close to bottom
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0, left = 0;

  if (anchorRect) {
    const spaceBelow = vh - anchorRect.bottom;
    top = spaceBelow > 280 ? anchorRect.bottom + 6 : anchorRect.top - 6 - Math.min(280, vh * 0.5);
    left = Math.min(anchorRect.left, vw - POPUP_WIDTH - 12);
    left = Math.max(left, 12);
  } else {
    top = vh / 2 - 140;
    left = vw / 2 - POPUP_WIDTH / 2;
  }

  const Icon = typeIcons[entity.entity_type] || Scroll;
  const colors = typeColors[entity.entity_type] || 'text-zinc-400 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700';
  const detailUrl = createPageUrl('EntityDetail') + `?id=${entity.id}&campaign_id=${campaignId || entity.campaign_id}`;

  return createPortal(
    <div
      ref={ref}
      style={{ top, left, width: POPUP_WIDTH }}
      className="fixed z-[200] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 p-3.5 pb-3 border-b border-gray-100 dark:border-zinc-800">
        {entity.image_url ? (
          <img src={entity.image_url} alt={entity.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-zinc-700" />
        ) : (
          <div className={`p-1.5 rounded-lg border flex-shrink-0 ${colors}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 leading-tight truncate">{entity.name}</p>
          <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full border mt-0.5 capitalize ${colors}`}>
            {entity.entity_type?.replace('_', ' ')}
          </span>
        </div>
        <button onClick={() => onOpenChange(false)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 flex-shrink-0 mt-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2.5 max-h-56 overflow-y-auto">
        {entity.summary && (
          <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">{entity.summary}</p>
        )}
        {entity.key_facts?.length > 0 && (
          <ul className="space-y-1">
            {entity.key_facts.slice(0, 4).map((fact, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                <span className="w-1 h-1 rounded-full bg-amber-500/60 flex-shrink-0 mt-1.5" />
                {fact}
              </li>
            ))}
          </ul>
        )}
        {!entity.summary && !entity.key_facts?.length && (
          <p className="text-xs text-gray-400 dark:text-zinc-600 italic">No details recorded yet.</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-3.5 py-2.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60">
        <Link
          to={detailUrl}
          onClick={() => onOpenChange(false)}
          className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-medium transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open full page
        </Link>
      </div>
    </div>,
    document.body
  );
}

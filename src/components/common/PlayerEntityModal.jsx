import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getEntityColors } from '@/lib/entityColors';
import { Eye, EyeOff, Backpack, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIS = {
  players_know:    { label: 'Known',   Icon: Eye,    color: 'text-emerald-600 dark:text-emerald-400' },
  players_suspect: { label: 'Rumored', Icon: EyeOff, color: 'text-amber-600 dark:text-amber-400' },
};

const typeLabel = (t) => (t === 'npc' ? 'NPC' : (t || '').replace(/_/g, ' '));

/**
 * Read-only entity detail for the player views (in-app preview + public share).
 * Shows only player-safe fields: portrait, name, type, visibility, and summary.
 */
export default function PlayerEntityModal({ entity, open, onOpenChange, onAddToInventory, meta: metaProp }) {
  const [added, setAdded] = useState(false);
  if (!entity) return null;
  // Prefer meta passed by the caller (the public share view has no type registry
  // to resolve custom types); otherwise resolve via getEntityColors.
  const meta = metaProp || getEntityColors(entity.entity_type);
  const Icon = meta.Icon;
  const vis = VIS[entity.visibility];
  const canAdd = onAddToInventory && entity.entity_type === 'item';

  const addToInventory = () => {
    onAddToInventory(entity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        {/* Portrait / type banner */}
        {entity.image_url ? (
          <div className="h-44 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <img src={entity.image_url} alt={entity.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className={cn('h-24 w-full flex items-center justify-center', meta.bg)}>
            <Icon className={cn('w-9 h-9', meta.text)} />
          </div>
        )}

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize', meta.tag)}>
              <Icon className="w-3 h-3" /> {meta.labelSingular || typeLabel(entity.entity_type)}
            </span>
            {vis && (
              <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', vis.color)}>
                <vis.Icon className="w-3 h-3" /> {vis.label}
              </span>
            )}
          </div>

          <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
            {entity.name}
          </DialogTitle>

          {entity.summary ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mt-3 whitespace-pre-wrap">
              {entity.summary}
            </p>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-600 italic mt-3">
              Little is known about this yet.
            </p>
          )}

          {canAdd && (
            <button
              onClick={addToInventory}
              disabled={added}
              className={cn(
                'mt-4 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-colors',
                added
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
              )}
            >
              {added ? <><Check className="w-4 h-4" /> Added to party inventory</> : <><Backpack className="w-4 h-4" /> Add to party inventory</>}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

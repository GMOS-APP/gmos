import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { WorldEntity } from '@/api/entities';
import { Eye, EyeOff, AlertTriangle, ExternalLink, Link2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import EntityAvatar from '@/components/entity/EntityAvatar';

const visibilityIcons = {
  gm_only: { icon: EyeOff, label: 'DM Only', class: 'text-zinc-500', pill: '' },
  players_know: { icon: Eye, label: 'Known', class: 'text-emerald-500', pill: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  players_suspect: { icon: Eye, label: 'Suspected', class: 'text-amber-500', pill: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' },
  false_info: { icon: AlertTriangle, label: 'False', class: 'text-red-500', pill: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30' },
};

export default function EntityCard({ entity }) {
  const vis = visibilityIcons[entity.visibility] || visibilityIcons.gm_only;
  const VisIcon = vis.icon;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const href = createPageUrl('EntityDetail') + `?id=${entity.id}&campaign_id=${entity.campaign_id}`;
  const hidden = entity.visibility === 'gm_only';

  // Optimistic visibility toggle so the player-facing state flips instantly,
  // no edit/save round-trip.
  const setVisibility = useMutation({
    mutationFn: (visibility) => WorldEntity.update(entity.id, { visibility }),
    onMutate: async (visibility) => {
      await queryClient.cancelQueries({ queryKey: ['entities'] });
      const prev = queryClient.getQueriesData({ queryKey: ['entities'] });
      queryClient.setQueriesData({ queryKey: ['entities'] }, (old) =>
        Array.isArray(old) ? old.map((e) => (e.id === entity.id ? { ...e, visibility } : e)) : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev?.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['entities'] }),
  });

  const toggleVisibility = () => setVisibility.mutate(hidden ? 'players_know' : 'gm_only');

  const copyLink = () => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    navigator.clipboard?.writeText(`${window.location.origin}${base}${href}`);
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${entity.name}"? This can't be undone.`)) return;
    await WorldEntity.delete(entity.id);
    queryClient.invalidateQueries();
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link
          to={href}
          className={cn(
            "group block p-4 rounded-xl border transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-black/20 hover:shadow-zinc-200/50",
            "dark:bg-zinc-900/40 dark:border-zinc-800/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70 bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm dark:shadow-none"
          )}
        >
          <div className="flex items-start gap-3">
            <EntityAvatar entity={entity} size="md" boxed />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold dark:text-zinc-200 dark:group-hover:text-amber-400 text-zinc-900 group-hover:text-amber-700 truncate text-sm min-w-0 flex-1">
                  {entity.name}
                </h3>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleVisibility(); }}
                  disabled={setVisibility.isPending}
                  title={hidden ? 'Hidden from players — click to reveal' : `Visible to players (${vis.label}) — click to hide`}
                  aria-pressed={!hidden}
                  className={cn(
                    'flex items-center gap-1 text-[10px] font-medium pl-1.5 pr-2 py-0.5 rounded-full border transition-colors flex-shrink-0',
                    hidden
                      ? 'border-zinc-200 dark:border-zinc-700/70 text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300'
                      : vis.pill
                  )}
                >
                  <VisIcon className="w-3 h-3" />
                  {hidden ? 'Hidden' : 'Players'}
                </button>
              </div>
              {entity.summary && (
               <p className="text-xs dark:text-zinc-500 text-zinc-600 mt-1 line-clamp-2">{entity.summary}</p>
              )}
              {entity.key_facts?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entity.key_facts.slice(0, 2).map((fact) => (
                   <span key={fact} className="text-[10px] px-1.5 py-0.5 rounded dark:bg-zinc-800 dark:text-zinc-500 bg-zinc-200 text-zinc-700 truncate max-w-[180px]">
                     {fact}
                   </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {entity.status && entity.status !== 'active' && (
           <Badge variant="outline" className="mt-2 text-[10px] dark:border-zinc-700 dark:text-zinc-500 border-zinc-300 text-zinc-600 capitalize">
             {entity.status}
           </Badge>
          )}
        </Link>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={() => navigate(href)}>
          <ExternalLink className="w-3.5 h-3.5 mr-2" /> Open
        </ContextMenuItem>
        <ContextMenuItem onSelect={toggleVisibility}>
          {hidden
            ? <><Eye className="w-3.5 h-3.5 mr-2" /> Reveal to players</>
            : <><EyeOff className="w-3.5 h-3.5 mr-2" /> Hide from players</>}
        </ContextMenuItem>
        <ContextMenuItem onSelect={copyLink}>
          <Link2 className="w-3.5 h-3.5 mr-2" /> Copy link
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={remove}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

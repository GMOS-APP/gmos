import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  gm_only: { icon: EyeOff, label: 'DM Only', class: 'text-zinc-500' },
  players_know: { icon: Eye, label: 'Known', class: 'text-green-500' },
  players_suspect: { icon: Eye, label: 'Suspected', class: 'text-yellow-500' },
  false_info: { icon: AlertTriangle, label: 'False', class: 'text-red-500' },
};

export default function EntityCard({ entity }) {
  const vis = visibilityIcons[entity.visibility] || visibilityIcons.gm_only;
  const VisIcon = vis.icon;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const href = createPageUrl('EntityDetail') + `?id=${entity.id}&campaign_id=${entity.campaign_id}`;
  const hidden = entity.visibility === 'gm_only';

  const toggleVisibility = async () => {
    await WorldEntity.update(entity.id, { visibility: hidden ? 'players_know' : 'gm_only' });
    queryClient.invalidateQueries();
  };

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
                <h3 className="font-semibold dark:text-zinc-200 dark:group-hover:text-amber-400 text-zinc-900 group-hover:text-amber-700 truncate text-sm">
                  {entity.name}
                </h3>
                <VisIcon className={cn("w-3 h-3 flex-shrink-0", vis.class)} />
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

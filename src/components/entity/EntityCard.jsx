import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EntityAvatar from '@/components/entity/EntityAvatar';

const visibilityIcons = {
  dm_only: { icon: EyeOff, label: 'DM Only', class: 'text-zinc-500' },
  players_know: { icon: Eye, label: 'Known', class: 'text-green-500' },
  players_suspect: { icon: Eye, label: 'Suspected', class: 'text-yellow-500' },
  false_info: { icon: AlertTriangle, label: 'False', class: 'text-red-500' },
};

export default function EntityCard({ entity }) {
  const vis = visibilityIcons[entity.visibility] || visibilityIcons.dm_only;
  const VisIcon = vis.icon;

  return (
    <Link
      to={createPageUrl('EntityDetail') + `?id=${entity.id}&campaign_id=${entity.campaign_id}`}
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
  );
}
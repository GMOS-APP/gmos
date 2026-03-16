import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const RARITY_COLORS = {
  Common:      'dark:text-zinc-400 text-zinc-500',
  Uncommon:    'dark:text-green-400 text-green-600',
  Rare:        'dark:text-blue-400 text-blue-600',
  'Very Rare': 'dark:text-purple-400 text-purple-600',
  Legendary:   'dark:text-amber-400 text-amber-600',
  Artifact:    'dark:text-red-400 text-red-600',
};

export default function PartyInventory({ items, campaignId }) {
  const assigned = items.filter(i => i.extra_data?.holder);
  const unassigned = items.filter(i => !i.extra_data?.holder);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="w-8 h-8 dark:text-zinc-700 text-zinc-300 mb-2" />
        <p className="text-xs dark:text-zinc-600 text-zinc-400">No items tracked yet.</p>
      </div>
    );
  }

  const grouped = assigned.reduce((acc, item) => {
    const holder = item.extra_data.holder;
    if (!acc[holder]) acc[holder] = [];
    acc[holder].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([holder, holderItems]) => (
        <div key={holder}>
          <p className="text-xs font-semibold dark:text-zinc-400 text-zinc-600 mb-1.5">{holder}</p>
          <div className="space-y-1">
            {holderItems.map(item => (
              <ItemRow key={item.id} item={item} campaignId={campaignId} />
            ))}
          </div>
        </div>
      ))}

      {unassigned.length > 0 && (
        <div>
          <p className="text-xs font-semibold dark:text-zinc-500 text-zinc-400 mb-1.5">Unassigned</p>
          <div className="space-y-1">
            {unassigned.map(item => (
              <ItemRow key={item.id} item={item} campaignId={campaignId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, campaignId }) {
  const rarity = item.extra_data?.rarity;
  return (
    <Link
      to={createPageUrl('EntityDetail') + `?id=${item.id}&campaign_id=${campaignId}`}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg dark:hover:bg-zinc-800/50 hover:bg-zinc-50 transition-colors group"
    >
      <Package className="w-3.5 h-3.5 dark:text-zinc-600 text-zinc-400 flex-shrink-0" />
      <span className="text-sm dark:text-zinc-300 text-zinc-700 flex-1 truncate group-hover:dark:text-zinc-100">{item.name}</span>
      {rarity && (
        <span className={cn('text-xs font-medium', RARITY_COLORS[rarity] || 'dark:text-zinc-500 text-zinc-400')}>
          {rarity}
        </span>
      )}
    </Link>
  );
}

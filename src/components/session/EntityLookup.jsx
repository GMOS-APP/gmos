import React, { useState } from 'react';
import { getEntityTypeLabel } from '@/lib/entityColors';
import { useQuery } from '@tanstack/react-query';
import { WorldEntity } from '@/api/entities';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EntityLookup({ campaignId }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const { data: entities = [] } = useQuery({
    queryKey: ['entities-lookup', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId }, '-updated_date', 200),
    enabled: !!campaignId,
  });

  const filtered = query.length >= 1
    ? entities.filter((e) =>
        e.name?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Quick lookup..."
          className="pl-9 bg-zinc-900/80 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 text-sm h-9"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filtered.map((e) => (
            <Link
              key={e.id}
              to={createPageUrl('EntityDetail') + `?id=${e.id}&campaign_id=${campaignId}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 hover:bg-zinc-800/50 border-b border-zinc-800/50 last:border-0"
            >
              <p className="text-sm text-zinc-200">{e.name}</p>
              <p className="text-[10px] text-zinc-600 capitalize">{getEntityTypeLabel(e.entity_type)}{e.summary ? ` · ${e.summary}` : ''}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
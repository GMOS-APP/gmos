import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import EntityCard from '@/components/entity/EntityCard';
import { cn } from '@/lib/utils';

const entityTypes = [
  { value: '', label: 'All' },
  { value: 'npc', label: 'NPCs' },
  { value: 'location', label: 'Locations' },
  { value: 'faction', label: 'Factions' },
  { value: 'thread', label: 'Threads' },
  { value: 'item', label: 'Items' },
  { value: 'player_character', label: 'PCs' },
  { value: 'event', label: 'Events' },
  { value: 'lore', label: 'Lore' },
];

export default function EntityBrowser() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const campaignId = params.get('campaign_id');
  const initialType = params.get('type') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(initialType);

  // Sync typeFilter when URL changes (sidebar navigation)
  useEffect(() => {
    setTypeFilter(initialType);
    setSearchQuery('');
  }, [location.search]);

  const query = { campaign_id: campaignId };
  if (typeFilter) query.entity_type = typeFilter;

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ['entities', campaignId, typeFilter],
    queryFn: () => base44.entities.WorldEntity.filter(query, '-updated_date', 100),
    enabled: !!campaignId,
  });

  const filtered = searchQuery
    ? entities.filter((e) =>
        e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : entities;

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold dark:text-zinc-100 text-gray-900">World Entities</h1>
        <Link to={createPageUrl('EntityDetail') + `?campaign_id=${campaignId}&new=true${typeFilter ? `&type=${typeFilter}` : ''}`}>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Entity
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-zinc-500 text-gray-400" />
          <Input
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {entityTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                typeFilter === t.value
                  ? "dark:bg-amber-500/10 dark:text-amber-400 dark:border dark:border-amber-500/20 bg-amber-100 text-amber-700 border border-amber-300"
                  : "dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50 text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 dark:text-zinc-600 text-gray-500">
         <p className="text-sm">{searchQuery ? 'No entities match your search.' : 'No entities yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((entity) => (
            <EntityCard key={entity.id} entity={entity} />
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { usePageParams } from '@/lib/usePageParams';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WorldEntity, Relationship } from '@/api/entities';
import { Network, Calendar, Plus, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RelationshipGraph from '@/components/relationships/RelationshipGraph';
import RelationshipTimeline from '@/components/relationships/RelationshipTimeline';
import RelationshipDialog from '@/components/relationships/RelationshipDialog';
import { useCampaignEntityTypes } from '@/lib/entityTypes';

const RELATIONSHIP_TYPES = [
  'allied_with', 'enemy_of', 'located_in', 'member_of', 'owns', 'seeks',
  'knows', 'loves', 'hates', 'fears', 'owes', 'employed_by', 'rivals',
  'mentors', 'parent_of', 'sibling_of', 'married_to', 'betrayed_by',
];

const STATUSES = ['active', 'broken', 'secret', 'suspected', 'historical'];

function formatLabel(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function toggleInSet(set, value) {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
}

export default function RelationshipMap() {
  const params = usePageParams();
  const campaignId = params.get('campaign_id');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRel, setEditingRel] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeEntityTypes, setActiveEntityTypes] = useState(new Set());
  const [activeRelTypes, setActiveRelTypes] = useState(new Set());
  const [activeStatuses, setActiveStatuses] = useState(new Set());
  const queryClient = useQueryClient();
  const { types } = useCampaignEntityTypes(campaignId);
  const entityTypeFilters = types.map((t) => ({ value: t.key, label: t.labelSingular }));

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', campaignId, 'all'],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const { data: relationships = [] } = useQuery({
    queryKey: ['relationships', campaignId],
    queryFn: () => Relationship.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const openDialog = (rel = null) => {
    setEditingRel(rel);
    setDialogOpen(true);
  };

  const handleDialogClose = (open) => {
    setDialogOpen(open);
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ['relationships', campaignId] });
    }
  };

  // Filtering
  const filteredEntities = activeEntityTypes.size === 0
    ? entities
    : entities.filter(e => activeEntityTypes.has(e.entity_type));

  const filteredEntityIds = new Set(filteredEntities.map(e => e.id));

  const filteredRelationships = relationships.filter(r => {
    const typeOk = activeRelTypes.size === 0 || activeRelTypes.has(r.relationship_type);
    const statusOk = activeStatuses.size === 0 || activeStatuses.has(r.status);
    const entitiesOk = filteredEntityIds.has(r.source_entity_id) && filteredEntityIds.has(r.target_entity_id);
    return typeOk && statusOk && entitiesOk;
  });

  const activeFilterCount = activeEntityTypes.size + activeRelTypes.size + activeStatuses.size;

  const clearFilters = () => {
    setActiveEntityTypes(new Set());
    setActiveRelTypes(new Set());
    setActiveStatuses(new Set());
  };

  return (
    <div className="p-6 lg:p-8 h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900">Relationship Map</h1>
          <p className="text-sm dark:text-zinc-500 text-zinc-600">Visualize connections and narrative web</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(o => !o)}
            className="relative dark:border-zinc-700 dark:text-zinc-300"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-amber-500 text-zinc-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            onClick={() => openDialog()}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Relationship
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="mb-4 p-4 rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/50 bg-zinc-50 border-zinc-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500">Filters</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          <div>
            <p className="text-xs dark:text-zinc-500 text-zinc-500 mb-1.5">Entity Type</p>
            <div className="flex flex-wrap gap-1.5">
              {entityTypeFilters.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setActiveEntityTypes(s => toggleInSet(s, value))}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                    activeEntityTypes.has(value)
                      ? 'bg-amber-500 border-amber-500 text-zinc-950'
                      : 'dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 border-zinc-300 text-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs dark:text-zinc-500 text-zinc-500 mb-1.5">Relationship Type</p>
            <div className="flex flex-wrap gap-1.5">
              {RELATIONSHIP_TYPES.map(value => (
                <button
                  key={value}
                  onClick={() => setActiveRelTypes(s => toggleInSet(s, value))}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                    activeRelTypes.has(value)
                      ? 'bg-amber-500 border-amber-500 text-zinc-950'
                      : 'dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 border-zinc-300 text-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {formatLabel(value)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs dark:text-zinc-500 text-zinc-500 mb-1.5">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(value => (
                <button
                  key={value}
                  onClick={() => setActiveStatuses(s => toggleInSet(s, value))}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                    activeStatuses.has(value)
                      ? 'bg-amber-500 border-amber-500 text-zinc-950'
                      : 'dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 border-zinc-300 text-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {formatLabel(value)}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <p className="text-xs dark:text-zinc-500 text-zinc-500">
              Showing {filteredEntities.length} of {entities.length} entities · {filteredRelationships.length} of {relationships.length} relationships
            </p>
          )}
        </div>
      )}

      <Tabs defaultValue="graph" className="flex-1 flex flex-col h-[calc(100%-5rem)]">
        <TabsList className="dark:bg-zinc-900 dark:border dark:border-zinc-800 bg-zinc-100 border border-zinc-300 mb-4">
          <TabsTrigger value="graph" className="dark:data-[state=active]:bg-zinc-800 data-[state=active]:bg-white">
            <Network className="w-4 h-4 mr-2" />
            Graph View
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-zinc-800">
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="flex-1 m-0">
          {/* Mobile: flat list (graph is illegible on small screens) */}
          <div className="block sm:hidden overflow-y-auto h-full rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/30 bg-zinc-50 border-zinc-200">
            {filteredRelationships.length === 0 ? (
              <p className="text-center text-sm dark:text-zinc-600 text-zinc-400 py-12">No relationships yet.</p>
            ) : (
              <div className="divide-y dark:divide-zinc-800 divide-zinc-200">
                {filteredRelationships.map((r) => {
                  const from = entities.find(e => e.id === r.source_entity_id);
                  const to = entities.find(e => e.id === r.target_entity_id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => openDialog(r)}
                      className="w-full text-left px-4 py-3 hover:dark:bg-zinc-800/40 hover:bg-zinc-100 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium dark:text-zinc-200 text-zinc-900">{from?.name ?? '?'}</span>
                        <span className="text-xs dark:text-zinc-500 text-zinc-400 px-1.5 py-0.5 rounded-full dark:bg-zinc-800 bg-zinc-200">
                          {formatLabel(r.relationship_type)}
                        </span>
                        <span className="text-sm font-medium dark:text-zinc-200 text-zinc-900">{to?.name ?? '?'}</span>
                      </div>
                      {r.notes && <p className="text-xs dark:text-zinc-500 text-zinc-500 mt-0.5 truncate">{r.notes}</p>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {/* Desktop: graph */}
          <div className="hidden sm:block h-full">
            <RelationshipGraph
              entities={filteredEntities}
              relationships={filteredRelationships}
              onEditRelationship={openDialog}
            />
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="flex-1 m-0">
          <RelationshipTimeline
            relationships={filteredRelationships}
            onEditRelationship={openDialog}
          />
        </TabsContent>
      </Tabs>

      <RelationshipDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        relationship={editingRel}
        campaignId={campaignId}
        entities={entities}
      />
    </div>
  );
}

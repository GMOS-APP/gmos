import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link as LinkIcon, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ENTITY_ICONS = {
  npc: '👤',
  location: '📍',
  faction: '⚔️',
  item: '💎',
  creature: '🐉',
  shop: '🏪',
};

export default function EntityLinker({ session, campaignId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [context, setContext] = useState('');
  const queryClient = useQueryClient();

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', campaignId],
    queryFn: () => base44.entities.WorldEntity.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const linkedEntities = session?.linked_entities || [];

  const linkMutation = useMutation({
    mutationFn: async () => {
      const newLinked = [
        ...linkedEntities,
        {
          entity_id: selectedEntity.id,
          entity_name: selectedEntity.name,
          entity_type: selectedEntity.entity_type,
          context: context,
        }
      ];
      return base44.entities.Session.update(session.id, { linked_entities: newLinked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      setDialogOpen(false);
      setSelectedEntity(null);
      setContext('');
      setSearch('');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (entityId) => {
      const newLinked = linkedEntities.filter(e => e.entity_id !== entityId);
      return base44.entities.Session.update(session.id, { linked_entities: newLinked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const filteredEntities = entities.filter(e => 
    !linkedEntities.some(le => le.entity_id === e.id) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
          Linked Entities ({linkedEntities.length})
        </label>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-zinc-800 text-zinc-500 hover:text-zinc-300">
              <Plus className="w-3 h-3 mr-1.5" />
              Link Entity
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Link Entity to Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!selectedEntity ? (
                <>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search entities..."
                    className="bg-zinc-950 border-zinc-800 text-zinc-200"
                    autoFocus
                  />
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {filteredEntities.map(entity => (
                      <button
                        key={entity.id}
                        onClick={() => setSelectedEntity(entity)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-left"
                      >
                        <span className="text-2xl">{ENTITY_ICONS[entity.entity_type] || '📌'}</span>
                        <div className="flex-1">
                          <div className="font-medium text-zinc-200">{entity.name}</div>
                          <div className="text-xs text-zinc-500 capitalize">{entity.entity_type.replace('_', ' ')}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950">
                    <span className="text-2xl">{ENTITY_ICONS[selectedEntity.entity_type] || '📌'}</span>
                    <div className="flex-1">
                      <div className="font-medium text-zinc-200">{selectedEntity.name}</div>
                      <div className="text-xs text-zinc-500 capitalize">{selectedEntity.entity_type.replace('_', ' ')}</div>
                    </div>
                    <button
                      onClick={() => setSelectedEntity(null)}
                      className="text-zinc-600 hover:text-zinc-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Context (optional)</label>
                    <Textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="How did this entity appear in the session? What happened?"
                      rows={3}
                      className="bg-zinc-950 border-zinc-800 text-zinc-200"
                    />
                  </div>
                  <Button
                    onClick={() => linkMutation.mutate()}
                    disabled={linkMutation.isPending}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Link to Session
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {linkedEntities.map((le) => (
          <div
            key={le.entity_id}
            className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 group hover:border-zinc-700"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{ENTITY_ICONS[le.entity_type] || '📌'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={createPageUrl('EntityDetail') + `?id=${le.entity_id}&campaign_id=${campaignId}`}
                    className="font-medium text-zinc-200 hover:text-amber-400"
                  >
                    {le.entity_name}
                  </Link>
                  <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 capitalize">
                    {le.entity_type.replace('_', ' ')}
                  </Badge>
                </div>
                {le.context && (
                  <p className="text-xs text-zinc-500">{le.context}</p>
                )}
              </div>
              <button
                onClick={() => unlinkMutation.mutate(le.entity_id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {linkedEntities.length === 0 && (
          <div className="text-center py-8 text-zinc-600 text-sm">
            No entities linked yet
          </div>
        )}
      </div>
    </div>
  );
}
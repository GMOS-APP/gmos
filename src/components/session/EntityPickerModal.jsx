import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorldEntity } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Loader2, Check } from 'lucide-react';

export default function EntityPickerModal({ open, onClose, campaignId, entityType, entities = [], linkedIds = [], onLink, onUnlink }) {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();

  const filtered = entities.filter(e =>
    e.entity_type === entityType &&
    e.name?.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (name) => WorldEntity.create({
      campaign_id: campaignId,
      name,
      entity_type: entityType,
      status: 'active',
      visibility: 'dm_only',
    }),
    onSuccess: (newEntity) => {
      queryClient.invalidateQueries({ queryKey: ['entities', campaignId] });
      onLink(newEntity);
      setNewName('');
      setCreating(false);
    },
  });

  const handleClose = () => {
    setSearch('');
    setCreating(false);
    setNewName('');
    onClose();
  };

  const displayType = entityType.replace(/_/g, ' ');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">Add {displayType}</DialogTitle>
        </DialogHeader>

        {!creating ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${displayType}s...`}
                className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {filtered.map(entity => {
                const isLinked = linkedIds.includes(entity.id);
                return (
                  <button
                    key={entity.id}
                    onClick={() => isLinked ? onUnlink(entity) : onLink(entity)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-sm transition-all ${
                      isLinked
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                        : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{entity.name}</p>
                      {entity.summary && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{entity.summary}</p>}
                    </div>
                    {isLinked && <Check className="w-4 h-4 text-amber-400 flex-shrink-0 ml-2" />}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-zinc-600 text-center py-6">No {displayType}s found in your world.</p>
              )}
            </div>

            <Button
              onClick={() => setCreating(true)}
              variant="outline"
              className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              <Plus className="w-4 h-4 mr-2" /> Create New {displayType}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">Create a new {displayType} and link it to this session.</p>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`${displayType} name...`}
              className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) createMutation.mutate(newName.trim());
              }}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate(newName.trim())}
                disabled={!newName.trim() || createMutation.isPending}
                className="flex-1 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-medium"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create & Link'}
              </Button>
              <Button
                onClick={() => { setCreating(false); setNewName(''); }}
                variant="outline"
                className="border-zinc-700 text-zinc-400"
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
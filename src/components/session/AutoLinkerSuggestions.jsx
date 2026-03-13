import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Session } from '@/api/entities';
import { Link2, X, Check } from 'lucide-react';

const LINKABLE_TYPES = ['npc', 'location', 'creature', 'faction', 'item', 'event'];

export default function AutoLinkerSuggestions({ notes, entities, session }) {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(new Set());

  const alreadyLinkedIds = useMemo(
    () => new Set((session?.linked_entities || []).map((e) => e.entity_id)),
    [session?.linked_entities]
  );

  const suggestions = useMemo(() => {
    if (!notes || !entities?.length) return [];
    const lowerNotes = notes.toLowerCase();
    return entities.filter((entity) => {
      if (!LINKABLE_TYPES.includes(entity.entity_type)) return false;
      if (alreadyLinkedIds.has(entity.id)) return false;
      if (dismissed.has(entity.id)) return false;
      // Match whole-word occurrences
      const escaped = entity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(lowerNotes);
    });
  }, [notes, entities, alreadyLinkedIds, dismissed]);

  const linkMutation = useMutation({
    mutationFn: (entity) => {
      const existing = session?.linked_entities || [];
      return Session.update(session.id, {
        linked_entities: [
          ...existing,
          { entity_id: entity.id, entity_name: entity.name, entity_type: entity.entity_type, context: 'auto-linked from notes' },
        ],
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session'] }),
  });

  if (!suggestions.length) return null;

  return (
    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
        <Link2 className="w-3.5 h-3.5" />
        Auto-link suggestions
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((entity) => (
          <div
            key={entity.id}
            className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs"
          >
            <span className="text-zinc-300">{entity.name}</span>
            <span className="text-zinc-600 capitalize">{entity.entity_type}</span>
            <button
              onClick={() => linkMutation.mutate(entity)}
              className="ml-1 text-emerald-400 hover:text-emerald-300"
              title="Link entity"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, entity.id]))}
              className="text-zinc-600 hover:text-zinc-400"
              title="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-zinc-600">
        These entities were mentioned in your notes. Click ✓ to link them to this session.
      </p>
    </div>
  );
}
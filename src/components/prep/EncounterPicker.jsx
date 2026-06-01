import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorldEntity } from '@/api/entities';
import { Swords, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function EncounterPicker({ campaignId, selectedIds = [], onChange }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data: allEncounters = [] } = useQuery({
    queryKey: ['encounters', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId, entity_type: 'encounter' }),
    enabled: !!campaignId,
  });

  const selectedEncounters = allEncounters.filter((enc) => selectedIds.includes(enc.id));
  const filteredEncounters = allEncounters.filter(
    (enc) => !selectedIds.includes(enc.id) && enc.name.toLowerCase().includes(search.toLowerCase())
  );

  const addEncounter = (encId) => {
    onChange([...selectedIds, encId]);
    setSearch('');
  };

  const removeEncounter = (encId) => {
    onChange(selectedIds.filter((id) => id !== encId));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedEncounters.map((enc) => (
          <Badge key={enc.id} variant="outline" className="border-zinc-700 text-zinc-300 pl-2 pr-1 py-1 gap-1">
            <Swords className="w-3 h-3" />
            {enc.name}
            <button onClick={() => removeEncounter(enc.id)} className="hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-500 hover:text-zinc-300">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Encounter
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] bg-zinc-900 border-zinc-800 p-3">
          <div className="space-y-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search encounters..."
              className="bg-zinc-950 border-zinc-800 text-zinc-200 text-sm h-8"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredEncounters.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-4">No encounters found</p>
              )}
              {filteredEncounters.map((enc) => (
                <button
                  key={enc.id}
                  onClick={() => {
                    addEncounter(enc.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-zinc-800 text-left text-sm text-zinc-300"
                >
                  <Swords className="w-3.5 h-3.5 text-zinc-600" />
                  <div className="flex-1">
                    <div className="font-medium">{enc.name}</div>
                    {enc.summary && <div className="text-xs text-zinc-600 line-clamp-1">{enc.summary}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
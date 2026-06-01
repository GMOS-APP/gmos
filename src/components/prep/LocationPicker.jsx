import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorldEntity } from '@/api/entities';
import { MapPin, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function LocationPicker({ campaignId, selectedIds = [], onChange }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data: allLocations = [] } = useQuery({
    queryKey: ['locations', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId, entity_type: 'location' }),
    enabled: !!campaignId,
  });

  const selectedLocations = allLocations.filter((loc) => selectedIds.includes(loc.id));
  const filteredLocations = allLocations.filter(
    (loc) => !selectedIds.includes(loc.id) && loc.name.toLowerCase().includes(search.toLowerCase())
  );

  const addLocation = (locId) => {
    onChange([...selectedIds, locId]);
    setSearch('');
  };

  const removeLocation = (locId) => {
    onChange(selectedIds.filter((id) => id !== locId));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedLocations.map((loc) => (
          <Badge key={loc.id} variant="outline" className="border-zinc-700 text-zinc-300 pl-2 pr-1 py-1 gap-1">
            <MapPin className="w-3 h-3" />
            {loc.name}
            <button onClick={() => removeLocation(loc.id)} className="hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-500 hover:text-zinc-300">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Location
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] bg-zinc-900 border-zinc-800 p-3">
          <div className="space-y-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search locations..."
              className="bg-zinc-950 border-zinc-800 text-zinc-200 text-sm h-8"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredLocations.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-4">No locations found</p>
              )}
              {filteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    addLocation(loc.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-zinc-800 text-left text-sm text-zinc-300"
                >
                  <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                  <div className="flex-1">
                    <div className="font-medium">{loc.name}</div>
                    {loc.summary && <div className="text-xs text-zinc-600 line-clamp-1">{loc.summary}</div>}
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
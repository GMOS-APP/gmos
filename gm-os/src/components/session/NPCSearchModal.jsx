import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Search, MapPin, Users } from 'lucide-react';

export default function NPCSearchModal({ campaignId, isOpen, onOpenChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedNPC, setSelectedNPC] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['npcSearch', debouncedSearchTerm, campaignId],
    queryFn: async () => {
      const results = await base44.entities.WorldEntity.filter(
        { campaign_id: campaignId, entity_type: 'npc' },
        'name',
        50
      );
      return results.filter(npc => 
        npc.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    },
    enabled: !!campaignId && debouncedSearchTerm.length > 0,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Search NPCs</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Search NPCs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="bg-zinc-950 border-zinc-800 text-zinc-100"
          />
          
          <div className="max-h-80 overflow-y-auto space-y-1">
            {searchTerm.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-4">Start typing to search...</p>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-4">No NPCs found</p>
            ) : (
              searchResults.map((npc) => (
                <button
                  key={npc.id}
                  onClick={() => {
                    setSelectedNPC(npc);
                    setSearchTerm('');
                  }}
                  className="w-full text-left p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-800 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-zinc-200 group-hover:text-amber-400">{npc.name}</p>
                      {npc.summary && (
                        <p className="text-xs text-zinc-500 mt-0.5">{npc.summary}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {selectedNPC && (
            <div className="border-t border-zinc-800 pt-4 mt-4">
              <div className="bg-zinc-800/40 rounded-lg p-3 space-y-2">
                <h4 className="font-semibold text-zinc-200">{selectedNPC.name}</h4>
                {selectedNPC.summary && (
                  <p className="text-xs text-zinc-400">{selectedNPC.summary}</p>
                )}
                {selectedNPC.key_facts && selectedNPC.key_facts.length > 0 && (
                  <div className="text-xs text-zinc-500 space-y-1">
                    {selectedNPC.key_facts.slice(0, 3).map((fact, i) => (
                      <p key={i}>• {fact}</p>
                    ))}
                  </div>
                )}
                <Button
                  onClick={() => {
                    const note = `🎭 ${selectedNPC.name}: ${selectedNPC.summary || selectedNPC.name}`;
                    navigator.clipboard.writeText(note);
                    setSelectedNPC(null);
                  }}
                  size="sm"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs mt-2"
                >
                  Copy to Notes
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
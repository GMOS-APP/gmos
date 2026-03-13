import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorldEntity, InvokeLLM } from '@/api/entities';
import { Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CharacterHooks({ campaignId, hooks, onChange }) {
  const { data: pcs = [] } = useQuery({
    queryKey: ['pcs', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId, entity_type: 'player_character' }),
    enabled: !!campaignId,
  });

  const [generating, setGenerating] = React.useState(null);

  const getHook = (name) => hooks.find(h => h.character_name === name)?.hook || '';

  const setHook = (name, value) => {
    const updated = hooks.filter(h => h.character_name !== name);
    if (value.trim()) updated.push({ character_name: name, hook: value });
    onChange(updated);
  };

  const generateHook = async (pc) => {
    setGenerating(pc.name);
    const result = await InvokeLLM({
      prompt: `Generate a specific, compelling session hook for this D&D player character:

Character: ${pc.name}
Description: ${pc.summary || pc.description || 'No details available'}
Campaign: ${campaignId}

Write a single, actionable hook (1-2 sentences) that:
- Connects to their backstory or goals
- Gives them a personal stake in this session
- Creates a memorable moment just for them

Keep it short and punchy. No preamble.`,
    });
    setHook(pc.name, result.trim());
    setGenerating(null);
  };

  if (pcs.length === 0) {
    return (
      <p className="text-sm text-zinc-600 italic">
        No Player Characters found. Add them as entities with type "player_character".
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 mb-3">
        For each character: what hook will draw them personally into this session?
      </p>
      {pcs.map(pc => (
        <div key={pc.id} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-300 w-28 flex-shrink-0 truncate">{pc.name}</span>
            <Input
              value={getHook(pc.name)}
              onChange={(e) => setHook(pc.name, e.target.value)}
              placeholder="What's their personal hook this session?"
              className="bg-zinc-950/60 border-zinc-800 text-zinc-200 text-sm placeholder:text-zinc-600"
            />
            <Button
              onClick={() => generateHook(pc)}
              disabled={generating === pc.name}
              size="sm"
              variant="ghost"
              className="text-purple-400 hover:text-purple-300 flex-shrink-0"
            >
              {generating === pc.name ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
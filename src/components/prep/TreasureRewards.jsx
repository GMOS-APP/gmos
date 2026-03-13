import React, { useState } from 'react';
import { InvokeLLM } from '@/api/entities';
import { Sparkles, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function TreasureRewards({ notes, onChange, campaign }) {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    const result = await InvokeLLM({
      prompt: `Generate treasure and magic item rewards for a D&D 5e session.

Campaign: ${campaign?.name || 'Unknown'}
Setting: ${campaign?.setting || 'Standard fantasy'}

Following the Sly Flourish Lazy DM approach:
- Mix specific items chosen for characters with some random loot
- Include consumables (potions, scrolls) and possibly one permanent magic item
- Keep amounts appropriate for a mid-tier adventure
- Mention 2-3 specific magic items with brief descriptions
- Note any story-relevant treasure (e.g., villain's signet ring, ancient map fragment)

Format as a concise, practical list. Keep it brief.`,
    });
    onChange(result);
    setGenerating(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          What loot might the players discover? Mix character-specific items with random rewards.
        </p>
        <Button
          onClick={generate}
          disabled={generating}
          size="sm"
          variant="outline"
          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 flex-shrink-0"
        >
          {generating ? (
            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-3 h-3 mr-1.5" /> Generate Loot</>
          )}
        </Button>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Potion of Healing x2, +1 Shortsword (fits the rogue), 50gp in coins, villain's encrypted journal..."
        rows={4}
        className="bg-zinc-950/60 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 text-sm resize-y"
      />
    </div>
  );
}
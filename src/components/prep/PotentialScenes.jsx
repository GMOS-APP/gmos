import React, { useState } from 'react';
import { InvokeLLM } from '@/api/entities';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AiGate from '@/components/ui/AiGate';
import { useCampaign } from '@/lib/CampaignContext';

export default function PotentialScenes({ scenes, onChange, campaign, threads }) {
  const { system } = useCampaign();
  const [newScene, setNewScene] = useState('');
  const [generating, setGenerating] = useState(false);

  const add = () => {
    if (newScene.trim()) {
      onChange([...scenes, newScene.trim()]);
      setNewScene('');
    }
  };

  const remove = (i) => onChange(scenes.filter((_, idx) => idx !== i));

  const generate = async () => {
    setGenerating(true);
    const result = await InvokeLLM({
      prompt: `Generate 5 potential scenes for a ${system.promptName} session using the Sly Flourish Lazy DM method.

Campaign: ${campaign?.name || 'Unknown'}
Setting: ${campaign?.setting || 'Standard fantasy'}
Active threads: ${threads?.map(t => t.name).join(', ') || 'None'}

Rules:
- Keep each scene BRIEF: just a short sentence or phrase
- These are possibilities, not a script — the players may skip them entirely
- Cover a mix of: social encounters, exploration, combat, mystery, downtime
- Think of them as potential beats or set-pieces the DM is ready for
- They can be linear OR branching based on player choices

Return 5 scenes as a JSON array of short strings.`,
      response_json_schema: {
        type: 'object',
        properties: {
          scenes: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    onChange([...scenes, ...(result.scenes || [])]);
    setGenerating(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 mb-2">
        Brief list of scenes that <em>might</em> occur — keep it short. Be ready to throw these away if players go elsewhere.
      </p>

      <AiGate>
        <Button
          onClick={generate}
          disabled={generating}
          size="sm"
          variant="outline"
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 mb-2"
        >
          {generating ? (
            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-3 h-3 mr-1.5" /> Suggest Scenes</>
          )}
        </Button>
      </AiGate>

      <div className="space-y-2">
        {scenes.map((scene, i) => (
          <div key={i} className="flex items-start gap-2 group bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
            <span className="text-xs text-zinc-600 font-mono w-5 flex-shrink-0 mt-0.5">{i + 1}.</span>
            <span className="text-sm text-zinc-300 flex-1">{scene}</span>
            <button onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newScene}
          onChange={(e) => setNewScene(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="e.g. Players arrive at the haunted mill at dusk..."
          className="bg-zinc-950/60 border-zinc-800 text-zinc-200 text-sm placeholder:text-zinc-600"
        />
        <Button onClick={add} size="sm" variant="ghost" className="text-zinc-500">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
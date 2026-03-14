import React, { useState } from 'react';
import { WorldEntity, InvokeLLM } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Save, Check } from 'lucide-react';
import AiGate from '@/components/ui/AiGate';

export default function RandomNPCGenerator({ campaignId }) {
  const [generating, setGenerating] = useState(false);
  const [generatedNPC, setGeneratedNPC] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveNPC = async () => {
    if (!campaignId || !generatedNPC) return;
    setSaving(true);
    await WorldEntity.create({
      campaign_id: campaignId,
      name: generatedNPC.name,
      entity_type: 'npc',
      summary: generatedNPC.summary,
      description: `${generatedNPC.personality}\n\nSecret: ${generatedNPC.secret}\n\nHook: ${generatedNPC.hook}`,
      npc_data: {
        race: generatedNPC.race,
        class: generatedNPC.class,
        traits: generatedNPC.personality,
      },
      status: 'active',
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generateNPC = async () => {
    setGenerating(true);
    try {
      const response = await InvokeLLM({
        prompt: `Generate a random D&D 5e NPC with the following JSON schema:
{
  "name": "A unique fantasy NPC name",
  "race": "D&D 5e race",
  "class": "D&D 5e class or profession",
  "summary": "One sentence description",
  "personality": "Brief personality traits",
  "secret": "A hidden secret or motivation",
  "hook": "A plot hook or reason to interact with this NPC"
}

Make the NPC interesting and ready to roleplay with immediately.`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            race: { type: 'string' },
            class: { type: 'string' },
            summary: { type: 'string' },
            personality: { type: 'string' },
            secret: { type: 'string' },
            hook: { type: 'string' },
          },
        },
      });
      setGeneratedNPC(response);
    } catch (err) {
      console.error('Failed to generate NPC', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <AiGate>
      <Button
        onClick={generateNPC}
        disabled={generating}
        size="sm"
        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs"
      >
        {generating ? (
          <>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            Generating NPC...
          </>
        ) : (
          <>
            <Wand2 className="w-3 h-3 mr-1.5" />
            Generate Random NPC
          </>
        )}
      </Button>
      </AiGate>

      {generatedNPC && (
        <div className="dark:bg-zinc-800/40 dark:border-zinc-800 bg-gray-100 border-gray-300 rounded-lg p-3 space-y-2 border">
          <h4 className="font-semibold dark:text-zinc-200 text-gray-900">{generatedNPC.name}</h4>
          <div className="text-xs dark:text-zinc-400 text-gray-700 space-y-1.5">
            <p><span className="dark:text-zinc-500 text-gray-500">Race:</span> {generatedNPC.race}</p>
            <p><span className="dark:text-zinc-500 text-gray-500">Class:</span> {generatedNPC.class}</p>
            <p><span className="dark:text-zinc-500 text-gray-500">Summary:</span> {generatedNPC.summary}</p>
            <p><span className="dark:text-zinc-500 text-gray-500">Personality:</span> {generatedNPC.personality}</p>
            <p><span className="dark:text-zinc-500 text-gray-500">Secret:</span> {generatedNPC.secret}</p>
            <p><span className="dark:text-zinc-500 text-gray-500">Hook:</span> {generatedNPC.hook}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                const note = `🎭 ${generatedNPC.name} (${generatedNPC.race} ${generatedNPC.class})\n${generatedNPC.summary}\nHook: ${generatedNPC.hook}`;
                navigator.clipboard.writeText(note);
              }}
              size="sm"
              variant="outline"
              className="flex-1 text-xs dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-gray-300 text-gray-600 hover:text-gray-900"
            >
              Copy
            </Button>
            <Button
              onClick={generateNPC}
              size="sm"
              variant="outline"
              className="flex-1 text-xs dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-gray-300 text-gray-600 hover:text-gray-900"
            >
              Regenerate
            </Button>
            {campaignId && (
              <Button
                onClick={saveNPC}
                disabled={saving || saved}
                size="sm"
                variant="outline"
                className="flex-1 text-xs dark:border-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-200 border-emerald-600 text-emerald-700 hover:text-emerald-900"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <><Check className="w-3 h-3 mr-1" />Saved!</> : <><Save className="w-3 h-3 mr-1" />Save NPC</>}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
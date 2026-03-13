import React, { useState } from 'react';
import { InvokeLLM } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquare } from 'lucide-react';

export default function QuickDialogueGenerator() {
  const [generating, setGenerating] = useState(false);
  const [npcName, setNpcName] = useState('');
  const [context, setContext] = useState('');
  const [dialogue, setDialogue] = useState('');

  const generateDialogue = async () => {
    if (!npcName.trim()) return;
    
    setGenerating(true);
    try {
      const response = await InvokeLLM({
        prompt: `Generate quick dialogue for an NPC in a D&D 5e session.

NPC Name: ${npcName}
Context: ${context || 'General conversation'}

Generate 2-3 short dialogue lines (30-50 words total) that the NPC might say. Include their personality and speaking style. Format as:

"[Dialogue line 1]"

"[Dialogue line 2]"

Make it immediately usable for a DM to speak aloud.`,
      });
      setDialogue(response);
    } catch (err) {
      console.error('Failed to generate dialogue', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Input
          placeholder="NPC name..."
          value={npcName}
          onChange={(e) => setNpcName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generateDialogue()}
          className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 text-xs"
        />
        <Textarea
          placeholder="Context (optional) - what's happening?"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 text-xs resize-none h-16"
        />
      </div>

      <Button
        onClick={generateDialogue}
        disabled={generating || !npcName.trim()}
        size="sm"
        className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs"
      >
        {generating ? (
          <>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <MessageSquare className="w-3 h-3 mr-1.5" />
            Generate Dialogue
          </>
        )}
      </Button>

      {dialogue && (
        <div className="dark:bg-zinc-800/40 dark:border-zinc-800 bg-gray-100 border-gray-300 rounded-lg p-3 space-y-2 border">
          <p className="text-xs dark:text-zinc-500 text-gray-500 font-semibold">{npcName}'s Dialogue:</p>
          <p className="text-xs dark:text-zinc-300 text-gray-800 whitespace-pre-wrap italic">{dialogue}</p>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(dialogue);
              }}
              size="sm"
              variant="outline"
              className="flex-1 text-xs dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-gray-300 text-gray-600 hover:text-gray-900"
            >
              Copy
            </Button>
            <Button
              onClick={generateDialogue}
              size="sm"
              variant="outline"
              className="flex-1 text-xs dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-gray-300 text-gray-600 hover:text-gray-900"
              disabled={generating}
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
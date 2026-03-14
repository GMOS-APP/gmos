import React, { useState } from 'react';
import { InvokeLLM, Campaign, WorldEntity } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import AiGate from '@/components/ui/AiGate';

export default function RawImportDialog({ open, onOpenChange, onImported }) {
  const [rawText, setRawText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | processing | done
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleBuild = async () => {
    if (!rawText.trim()) return;
    setStatus('processing');
    setLog([]);

    addLog('Analyzing raw data...');

    let result;
    try {
      result = await InvokeLLM({
      prompt: `You are a D&D campaign organizer. The user has pasted raw campaign notes, wiki content, or world-building text below. Extract and structure this into a full campaign with entities.

RAW DATA:
${rawText}

Extract:
- A campaign name and description
- A world setting description
- All NPCs, locations, factions, creatures, items, plot threads, events, lore entries, and any other world entities you can identify

For entity_type, use ONLY one of: npc, creature, location, faction, thread, item, player_character, event, lore, deity, encounter, shop

Be thorough — extract every named person, place, organization, creature, item, or plot element you can find.`,
      response_json_schema: {
        type: 'object',
        properties: {
          campaign: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              setting: { type: 'string' },
            },
          },
          entities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                entity_type: { type: 'string' },
                summary: { type: 'string' },
                description: { type: 'string' },
                key_facts: { type: 'array', items: { type: 'string' } },
                tags: { type: 'array', items: { type: 'string' } },
                status: { type: 'string' },
              },
            },
          },
        },
      },
    });
    } catch (err) {
      addLog(`Error: ${err.message || 'AI call failed'}`);
      setStatus('idle');
      return;
    }

    addLog(`Creating campaign: "${result.campaign.name}"...`);
    const campaign = await Campaign.create({
      name: result.campaign.name,
      description: result.campaign.description,
      setting: result.campaign.setting,
      status: 'active',
    });

    addLog(`Building ${result.entities?.length || 0} world entities...`);
    if (result.entities?.length) {
      await Promise.all(
        result.entities.map((e) =>
          WorldEntity.create({
            ...e,
            campaign_id: campaign.id,
            status: e.status || 'active',
            visibility: 'dm_only',
          })
        )
      );
    }

    addLog('Done!');
    setStatus('done');
    onImported?.();
  };

  const handleClose = () => {
    setRawText('');
    setStatus('idle');
    setLog([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Import from Raw Data
          </DialogTitle>
        </DialogHeader>

        {status === 'idle' && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Paste any campaign notes, wiki content, world-building text, or session notes. The AI will auto-build your campaign with entities, NPCs, locations, and more.
            </p>
            <Textarea
              placeholder="Paste your raw campaign data here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={12}
              className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none font-mono text-xs"
            />
          </div>
        )}

        {(status === 'processing' || status === 'done') && (
          <div className="py-4 space-y-2 min-h-[200px]">
            {log.map((line, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {i === log.length - 1 && status === 'processing' ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                )}
                <span className={i === log.length - 1 && status === 'processing' ? 'text-zinc-400' : 'text-zinc-600 dark:text-zinc-400'}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} className="text-zinc-600 dark:text-zinc-400">
            {status === 'done' ? 'Close' : 'Cancel'}
          </Button>
          {status === 'idle' && (
            <AiGate>
              <Button
                onClick={handleBuild}
                disabled={!rawText.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Build Campaign
              </Button>
            </AiGate>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
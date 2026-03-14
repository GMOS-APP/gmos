import React, { useState } from 'react';
import { InvokeLLM } from '@/api/entities';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AiGate from '@/components/ui/AiGate';

const SECRET_TYPES = ['Character', 'Villain', 'Story', 'NPC', 'Location'];

export default function SecretsClues({ campaignId, secrets, onChange, campaign, threads }) {
  const [newSecret, setNewSecret] = useState('');
  const [generating, setGenerating] = useState(false);

  const add = () => {
    if (newSecret.trim()) {
      onChange([...secrets, newSecret.trim()]);
      setNewSecret('');
    }
  };

  const remove = (i) => onChange(secrets.filter((_, idx) => idx !== i));

  const generateSecrets = async () => {
    setGenerating(true);
    const result = await InvokeLLM({
      prompt: `Generate 10 secrets and clues for a D&D session using the Sly Flourish Lazy DM method.

Campaign: ${campaign?.name || 'Unknown'}
Active plot threads: ${threads?.map(t => t.name + ': ' + (t.summary || '')).join('\n') || 'None'}
Campaign setting: ${campaign?.setting || 'Standard fantasy'}

Rules for secrets & clues:
- Each is SHORT: 1-2 sentences max
- They reveal interesting information (history, villain plans, NPC motivations, location lore)
- They are ABSTRACTED from HOW they're discovered (the DM decides that at the table)
- Cover a mix of: character secrets, villain secrets, story secrets, NPC secrets, location secrets
- Make them feel meaningful and interconnected

Return exactly 10 secrets as a JSON array of strings.`,
      response_json_schema: {
        type: 'object',
        properties: {
          secrets: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    onChange([...secrets, ...(result.secrets || [])].slice(0, 10));
    setGenerating(false);
  };

  const remaining = Math.max(0, 10 - secrets.length);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="text-xs text-zinc-500 max-w-lg">
          Write up to <span className="text-amber-400 font-semibold">10 secrets</span> — short, abstracted clues players might discover. Don't decide how they're found; improvise that at the table.
        </p>
        <AiGate>
          <Button
            onClick={generateSecrets}
            disabled={generating}
            size="sm"
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 flex-shrink-0"
          >
            {generating ? (
              <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-3 h-3 mr-1.5" /> Generate 10 Secrets</>
            )}
          </Button>
        </AiGate>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-2">
        {SECRET_TYPES.map(t => (
          <Badge key={t} variant="outline" className="text-[10px] border-zinc-700 text-zinc-600">{t}</Badge>
        ))}
      </div>

      <div className="space-y-2">
        {secrets.map((s, i) => (
          <div key={i} className="flex items-start gap-2 group bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
            <span className="text-xs text-zinc-600 font-mono w-5 flex-shrink-0 mt-0.5">{i + 1}.</span>
            <span className="text-sm text-zinc-300 flex-1">{s}</span>
            <button onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {secrets.length < 10 && (
        <div className="flex gap-2">
          <Input
            value={newSecret}
            onChange={(e) => setNewSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder={`Add secret ${secrets.length + 1} of 10...`}
            className="bg-zinc-950/60 border-zinc-800 text-zinc-200 text-sm placeholder:text-zinc-600"
          />
          <Button onClick={add} size="sm" variant="ghost" className="text-zinc-500">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {remaining > 0 && (
        <p className="text-xs text-zinc-600">{remaining} more secret{remaining !== 1 ? 's' : ''} recommended</p>
      )}
    </div>
  );
}
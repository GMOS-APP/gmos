import React, { useState, useRef, useEffect } from 'react';
import { InvokeLLM } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquare, X } from 'lucide-react';
import AiGate from '@/components/ui/AiGate';
import { useCampaign } from '@/lib/CampaignContext';

const ENTITY_TYPES = ['npc', 'creature', 'player_character', 'faction', 'deity'];

export default function QuickDialogueGenerator({ entities = [] }) {
  const { system } = useCampaign();
  const [generating, setGenerating] = useState(false);
  const [nameQuery, setNameQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [context, setContext] = useState('');
  const [dialogue, setDialogue] = useState('');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const npcName = selectedEntity?.name || nameQuery;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const suggestions = nameQuery.trim().length > 0
    ? entities
        .filter((e) => ENTITY_TYPES.includes(e.entity_type))
        .filter((e) => e.name.toLowerCase().includes(nameQuery.toLowerCase()))
        .slice(0, 6)
    : [];

  const handleNameChange = (val) => {
    setNameQuery(val);
    setSelectedEntity(null);
    setShowSuggestions(true);
    setDialogue('');
  };

  const selectEntity = (entity) => {
    setSelectedEntity(entity);
    setNameQuery(entity.name);
    setShowSuggestions(false);
    setDialogue('');
  };

  const clearEntity = () => {
    setSelectedEntity(null);
    setNameQuery('');
    setDialogue('');
    inputRef.current?.focus();
  };

  const buildPrompt = () => {
    const contextLine = context.trim() ? `Context / Situation: ${context.trim()}` : 'Context: General conversation';

    if (selectedEntity) {
      const d = selectedEntity.extra_data || {};
      const lines = [
        `Generate in-character dialogue for the following NPC in a ${system.promptName} session.`,
        '',
        `Name: ${selectedEntity.name}`,
        selectedEntity.summary            ? `Summary: ${selectedEntity.summary}` : null,
        d.race || d.class                 ? `Race/Role: ${[d.race, d.class].filter(Boolean).join(', ')}` : null,
        d.alignment                       ? `Alignment: ${d.alignment}` : null,
        d.appearance                      ? `Appearance: ${d.appearance}` : null,
        d.traits                          ? `Personality: ${d.traits}` : null,
        d.motives                         ? `Motives & Goals: ${d.motives}` : null,
        d.sample_dialogue                 ? `Established Voice / Sample Lines:\n${d.sample_dialogue}` : null,
        '',
        contextLine,
        '',
        'Generate 2–3 short dialogue lines (30–50 words total) that this specific character would say.',
        'Match their voice, personality, and motivations exactly.',
        'Format as:',
        '',
        '"[Dialogue line 1]"',
        '',
        '"[Dialogue line 2]"',
        '',
        'Make it immediately usable for a GM to speak aloud at the table.',
      ].filter((l) => l !== null).join('\n');
      return lines;
    }

    return `Generate quick dialogue for an NPC in a ${system.promptName} session.

NPC Name: ${npcName}
${contextLine}

Generate 2-3 short dialogue lines (30-50 words total) that the NPC might say. Include their personality and speaking style. Format as:

"[Dialogue line 1]"

"[Dialogue line 2]"

Make it immediately usable for a DM to speak aloud.`;
  };

  const generateDialogue = async () => {
    if (!npcName.trim()) return;
    setGenerating(true);
    try {
      const response = await InvokeLLM({ prompt: buildPrompt() });
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
        {/* NPC name field with entity autocomplete */}
        <div className="relative">
          <div className="relative flex items-center">
            <Input
              ref={inputRef}
              placeholder="NPC name... (type to search entities)"
              value={nameQuery}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => nameQuery.trim() && setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !showSuggestions) generateDialogue();
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              className={`dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 text-xs pr-6 ${selectedEntity ? 'dark:border-purple-500/40 border-purple-400/50' : ''}`}
            />
            {(nameQuery || selectedEntity) && (
              <button
                onClick={clearEntity}
                className="absolute right-2 dark:text-zinc-600 dark:hover:text-zinc-300 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Selected entity badge */}
          {selectedEntity && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] dark:text-purple-400 text-purple-600 font-medium">Linked:</span>
              <span className="text-[10px] dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30 bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5 capitalize">
                {selectedEntity.entity_type.replace('_', ' ')}
              </span>
              {selectedEntity.extra_data?.traits && (
                <span className="text-[10px] dark:text-zinc-600 text-zinc-400 truncate max-w-[120px]" title={selectedEntity.extra_data.traits}>
                  has personality
                </span>
              )}
            </div>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border dark:border-zinc-700 dark:bg-zinc-900 bg-white border-zinc-200 shadow-lg overflow-hidden"
            >
              {suggestions.map((entity) => (
                <button
                  key={entity.id}
                  onMouseDown={(e) => { e.preventDefault(); selectEntity(entity); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left dark:hover:bg-zinc-800 hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-xs dark:text-zinc-200 text-zinc-900 font-medium flex-1 truncate">{entity.name}</span>
                  <span className="text-[10px] dark:text-zinc-500 text-zinc-400 capitalize flex-shrink-0">
                    {entity.entity_type.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Textarea
          placeholder="Context (optional) — what's happening?"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 text-xs resize-none h-16"
        />
      </div>

      <AiGate>
        <Button
          onClick={generateDialogue}
          disabled={generating || !npcName.trim()}
          size="sm"
          className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs"
        >
          {generating ? (
            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating...</>
          ) : (
            <><MessageSquare className="w-3 h-3 mr-1.5" /> Generate Dialogue</>
          )}
        </Button>
      </AiGate>

      {dialogue && (
        <div className="dark:bg-zinc-800/40 dark:border-zinc-800 bg-zinc-100 border-zinc-300 rounded-lg p-3 space-y-2 border">
          <p className="text-xs dark:text-zinc-500 text-zinc-500 font-semibold">{npcName}'s Dialogue:</p>
          <p className="text-xs dark:text-zinc-300 text-zinc-800 whitespace-pre-wrap italic">{dialogue}</p>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => navigator.clipboard.writeText(dialogue)}
              size="sm"
              variant="outline"
              className="flex-1 text-xs dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-zinc-300 text-zinc-600 hover:text-zinc-900"
            >
              Copy
            </Button>
            <Button
              onClick={generateDialogue}
              size="sm"
              variant="outline"
              className="flex-1 text-xs dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-zinc-300 text-zinc-600 hover:text-zinc-900"
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

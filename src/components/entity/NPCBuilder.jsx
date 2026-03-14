import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Loader2 } from 'lucide-react';
import { InvokeLLM } from '@/api/entities';
import AiGate from '@/components/ui/AiGate';

const SRD_RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
const SRD_CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
const SRD_ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];

const CLASS_PRIORITIES = {
  'Barbarian': ['STR', 'CON', 'DEX', 'WIS', 'CHA', 'INT'],
  'Bard': ['CHA', 'DEX', 'CON', 'WIS', 'INT', 'STR'],
  'Cleric': ['WIS', 'CON', 'STR', 'CHA', 'DEX', 'INT'],
  'Druid': ['WIS', 'CON', 'DEX', 'INT', 'CHA', 'STR'],
  'Fighter': ['STR', 'CON', 'DEX', 'WIS', 'CHA', 'INT'],
  'Monk': ['DEX', 'WIS', 'CON', 'STR', 'CHA', 'INT'],
  'Paladin': ['STR', 'CHA', 'CON', 'WIS', 'DEX', 'INT'],
  'Ranger': ['DEX', 'WIS', 'CON', 'STR', 'INT', 'CHA'],
  'Rogue': ['DEX', 'INT', 'CHA', 'CON', 'WIS', 'STR'],
  'Sorcerer': ['CHA', 'CON', 'DEX', 'INT', 'WIS', 'STR'],
  'Warlock': ['CHA', 'CON', 'DEX', 'INT', 'WIS', 'STR'],
  'Wizard': ['INT', 'DEX', 'CON', 'WIS', 'CHA', 'STR'],
};

const rollStats = () => {
  const rolls = [];
  for (let i = 0; i < 6; i++) {
    const fourDice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
    fourDice.sort((a, b) => b - a);
    rolls.push(fourDice[0] + fourDice[1] + fourDice[2]);
  }
  return rolls.sort((a, b) => b - a);
};

export default function NPCBuilder({ npcData, onUpdate }) {
  const [data, setData] = useState(npcData || {
    gender: '',
    race: '',
    class: '',
    alignment: '',
    appearance: '',
    traits: '',
    rumors: '',
    quests: '',
    motives: '',
    sample_dialogue: '',
  });
  const [generating, setGenerating] = useState(null);

  const handleChange = (field, value) => {
    setData({ ...data, [field]: value });
    onUpdate({ ...data, [field]: value });
  };

  const generateField = async (field) => {
    setGenerating(field);
    
    const prompts = {
      appearance: `Generate a vivid physical appearance description for a ${data.gender || ''} ${data.race || 'humanoid'} ${data.class || 'NPC'} (${data.alignment || 'neutral'}). Include distinctive features, clothing style, and first impression details. Keep it 2-3 sentences.`,
      traits: `Generate personality traits for a ${data.gender || ''} ${data.race || 'humanoid'} ${data.class || 'NPC'} (${data.alignment || 'neutral'}). Include mannerisms, speech patterns, and behavioral quirks. Keep it 2-3 sentences.`,
      rumors: `Generate 3 rumors about a ${data.gender || ''} ${data.race || 'humanoid'} ${data.class || 'NPC'} (${data.alignment || 'neutral'}). One true, one false, one partially true. Format as a bulleted list.`,
      quests: `Generate 2-3 potential quest hooks involving a ${data.gender || ''} ${data.race || 'humanoid'} ${data.class || 'NPC'} (${data.alignment || 'neutral'}). Format as a bulleted list with brief descriptions.`,
      motives: `Generate the hidden motives and goals for a ${data.gender || ''} ${data.race || 'humanoid'} ${data.class || 'NPC'} (${data.alignment || 'neutral'}). What do they really want? What are they hiding? Keep it 2-3 sentences.`,
      sample_dialogue: `Generate sample dialogue for when the party first meets a ${data.gender || ''} ${data.race || 'humanoid'} ${data.class || 'NPC'} (${data.alignment || 'neutral'}). Include their greeting and a few lines of conversation that reveal their personality. Format as quotes.`,
    };

    try {
      const result = await InvokeLLM({
        prompt: prompts[field],
      });
      handleChange(field, result);
    } catch (error) {
      console.error('Generation failed:', error);
    }
    
    setGenerating(null);
  };

  const generateAllFields = async () => {
    const fields = ['appearance', 'traits', 'rumors', 'quests', 'motives', 'sample_dialogue'];
    for (const field of fields) {
      await generateField(field);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Gender</label>
          <Input
            value={data.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            placeholder="Male, Female, Non-binary, etc."
            className="bg-gray-100 border-gray-300 text-gray-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Race</label>
          <Select value={data.race} onValueChange={(v) => handleChange('race', v)}>
            <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200">
              <SelectValue placeholder="Select race" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
              {SRD_RACES.map((r) => (
                <SelectItem key={r} value={r} className="text-zinc-300">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Class</label>
          <Select value={data.class} onValueChange={(v) => handleChange('class', v)}>
            <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
              {SRD_CLASSES.map((c) => (
                <SelectItem key={c} value={c} className="text-zinc-300">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Alignment</label>
          <Select value={data.alignment} onValueChange={(v) => handleChange('alignment', v)}>
            <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200">
              <SelectValue placeholder="Select alignment" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
              {SRD_ALIGNMENTS.map((a) => (
                <SelectItem key={a} value={a} className="text-zinc-300">{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generate All Button */}
      <AiGate>
        <Button
          onClick={generateAllFields}
          disabled={generating !== null}
          variant="outline"
          className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
          ) : (
            <><Wand2 className="w-4 h-4 mr-2" /> Generate All NPC Details</>
          )}
        </Button>
      </AiGate>

      {/* Appearance */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Appearance</label>
          <AiGate>
            <Button
              onClick={() => generateField('appearance')}
              disabled={generating !== null}
              size="sm"
              variant="ghost"
              className="text-zinc-500 hover:text-blue-400 h-7 text-xs"
            >
              {generating === 'appearance' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            </Button>
          </AiGate>
        </div>
        <Textarea
          value={data.appearance}
          onChange={(e) => handleChange('appearance', e.target.value)}
          placeholder="Physical description, clothing, distinctive features..."
          rows={3}
          className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm"
        />
      </div>

      {/* Traits */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Traits</label>
          <AiGate>
            <Button
              onClick={() => generateField('traits')}
              disabled={generating !== null}
              size="sm"
              variant="ghost"
              className="text-zinc-500 hover:text-blue-400 h-7 text-xs"
            >
              {generating === 'traits' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            </Button>
          </AiGate>
        </div>
        <Textarea
          value={data.traits}
          onChange={(e) => handleChange('traits', e.target.value)}
          placeholder="Personality traits, mannerisms, speech patterns..."
          rows={3}
          className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm"
        />
      </div>

      {/* Rumors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Rumors</label>
          <AiGate>
            <Button
              onClick={() => generateField('rumors')}
              disabled={generating !== null}
              size="sm"
              variant="ghost"
              className="text-zinc-500 hover:text-blue-400 h-7 text-xs"
            >
              {generating === 'rumors' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            </Button>
          </AiGate>
        </div>
        <Textarea
          value={data.rumors}
          onChange={(e) => handleChange('rumors', e.target.value)}
          placeholder="Rumors about this NPC (true, false, or partially true)..."
          rows={3}
          className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm"
        />
      </div>

      {/* Quests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Quests</label>
          <AiGate>
            <Button
              onClick={() => generateField('quests')}
              disabled={generating !== null}
              size="sm"
              variant="ghost"
              className="text-zinc-500 hover:text-blue-400 h-7 text-xs"
            >
              {generating === 'quests' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            </Button>
          </AiGate>
        </div>
        <Textarea
          value={data.quests}
          onChange={(e) => handleChange('quests', e.target.value)}
          placeholder="Potential quest hooks involving this NPC..."
          rows={3}
          className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm"
        />
      </div>

      {/* Motives */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Motives</label>
          <AiGate>
            <Button
              onClick={() => generateField('motives')}
              disabled={generating !== null}
              size="sm"
              variant="ghost"
              className="text-zinc-500 hover:text-blue-400 h-7 text-xs"
            >
              {generating === 'motives' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            </Button>
          </AiGate>
        </div>
        <Textarea
          value={data.motives}
          onChange={(e) => handleChange('motives', e.target.value)}
          placeholder="Hidden goals, secret agendas, true motivations..."
          rows={3}
          className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm"
        />
      </div>

      {/* Sample Dialogue */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Sample Dialogue</label>
          <AiGate>
            <Button
              onClick={() => generateField('sample_dialogue')}
              disabled={generating !== null}
              size="sm"
              variant="ghost"
              className="text-zinc-500 hover:text-blue-400 h-7 text-xs"
            >
              {generating === 'sample_dialogue' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            </Button>
          </AiGate>
        </div>
        <Textarea
          value={data.sample_dialogue}
          onChange={(e) => handleChange('sample_dialogue', e.target.value)}
          placeholder="First meeting dialogue, example quotes..."
          rows={4}
          className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm font-mono"
        />
      </div>
    </div>
  );
}
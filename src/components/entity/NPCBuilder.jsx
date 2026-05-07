import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCampaign } from '@/lib/CampaignContext';

const SRD_RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
const SRD_CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
const SRD_ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];

export default function NPCBuilder({ npcData, onUpdate }) {
  const { system } = useCampaign();
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

  const handleChange = (field, value) => {
    setData({ ...data, [field]: value });
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Gender</label>
          <Input
            value={data.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            placeholder="Male, Female, Non-binary, etc."
            className="bg-zinc-100 border-zinc-300 text-zinc-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200"
          />
        </div>

        {system.hasAbilityScores ? (
          <>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">{system.characterFields.species}</label>
              <Select value={data.race} onValueChange={(v) => handleChange('race', v)}>
                <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200">
                  <SelectValue placeholder={`Select ${system.characterFields.species.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
                  {SRD_RACES.map((r) => (
                    <SelectItem key={r} value={r} className="text-zinc-300">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">{system.characterFields.role}</label>
              <Select value={data.class} onValueChange={(v) => handleChange('class', v)}>
                <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200">
                  <SelectValue placeholder={`Select ${system.characterFields.role.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
                  {SRD_CLASSES.map((c) => (
                    <SelectItem key={c} value={c} className="text-zinc-300">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Alignment</label>
              <Select value={data.alignment} onValueChange={(v) => handleChange('alignment', v)}>
                <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200">
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent className="bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
                  {SRD_ALIGNMENTS.map((a) => (
                    <SelectItem key={a} value={a} className="text-zinc-300">{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Background</label>
              <Input
                value={data.race}
                onChange={(e) => handleChange('race', e.target.value)}
                placeholder="Origin, species, background..."
                className="bg-zinc-100 border-zinc-300 text-zinc-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Role / Occupation</label>
              <Input
                value={data.class}
                onChange={(e) => handleChange('class', e.target.value)}
                placeholder="Role, occupation, job..."
                className="bg-zinc-100 border-zinc-300 text-zinc-900 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200"
              />
            </div>
          </>
        )}
      </div>

      {/* Appearance */}
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Appearance</label>
        <EntityMentionTextarea
          value={data.appearance}
          onChange={(v) => handleChange('appearance', v)}
          placeholder="Physical description, clothing, distinctive features..."
          rows={3}
          className="bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm"
        />
      </div>

      {/* Traits */}
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Traits</label>
        <EntityMentionTextarea
          value={data.traits}
          onChange={(v) => handleChange('traits', v)}
          placeholder="Personality traits, mannerisms, speech patterns..."
          rows={3}
          className="bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm"
        />
      </div>

      {/* Rumors */}
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Rumors</label>
        <EntityMentionTextarea
          value={data.rumors}
          onChange={(v) => handleChange('rumors', v)}
          placeholder="Rumors about this NPC (true, false, or partially true)..."
          rows={3}
          className="bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm"
        />
      </div>

      {/* Quests */}
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Quests</label>
        <EntityMentionTextarea
          value={data.quests}
          onChange={(v) => handleChange('quests', v)}
          placeholder="Potential quest hooks involving this NPC..."
          rows={3}
          className="bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm"
        />
      </div>

      {/* Motives */}
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Motives</label>
        <EntityMentionTextarea
          value={data.motives}
          onChange={(v) => handleChange('motives', v)}
          placeholder="Hidden goals, secret agendas, true motivations..."
          rows={3}
          className="bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm"
        />
      </div>

      {/* Sample Dialogue */}
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">Sample Dialogue</label>
        <EntityMentionTextarea
          value={data.sample_dialogue}
          onChange={(v) => handleChange('sample_dialogue', v)}
          placeholder="First meeting dialogue, example quotes..."
          rows={4}
          className="bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 text-sm font-mono"
        />
      </div>
    </div>
  );
}

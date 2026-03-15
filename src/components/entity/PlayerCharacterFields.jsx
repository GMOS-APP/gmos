import React from 'react';
import { Input } from '@/components/ui/input';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import { ExternalLink } from 'lucide-react';
import { useCampaign } from '@/lib/CampaignContext';

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <Input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(type === 'number' ? (Number(e.target.value) || 0) : e.target.value)}
      placeholder={placeholder}
      className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <EntityMentionTextarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 resize-none"
    />
  );
}

function SectionDivider({ label }) {
  return (
    <div className="md:col-span-2 flex items-center gap-3 pt-3">
      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

const ABILITY_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const ABILITY_ABBR = { strength: 'STR', dexterity: 'DEX', constitution: 'CON', intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA' };

function AbilityScoreBox({ name, value, onChange }) {
  const score = parseInt(value) || 10;
  const mod = Math.floor((score - 10) / 2);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg border border-zinc-800 bg-zinc-900/40">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{ABILITY_ABBR[name]}</span>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={1} max={30}
        className="w-full text-center text-xl font-bold bg-transparent border-none p-0 h-8 text-zinc-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-sm font-semibold text-amber-400">{modStr}</span>
    </div>
  );
}

export default function PlayerCharacterFields({ extraData, onChange }) {
  const { system } = useCampaign();
  const fields = system.characterFields;
  const get = (key) => extraData?.[key] ?? '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  const abilities = extraData?.ability_scores || {};
  const setAbility = (name, val) => onChange({
    ...(extraData || {}),
    ability_scores: { ...abilities, [name]: val },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Avatar */}
      <div className="md:col-span-2">
        <Field label="Avatar Image">
          <div className="flex gap-4 items-start">
            {get('image_url') && (
              <div className="flex-shrink-0">
                <img src={get('image_url')} alt="Character avatar" className="w-24 h-24 rounded-lg object-cover border border-zinc-800" />
              </div>
            )}
            <div className="flex-1">
                      <TextInput value={get('image_url')} onChange={(v) => set('image_url', v)} placeholder="Image URL" />
              <p className="text-xs text-zinc-600 mt-2">Paste an image URL for the character.</p>
            </div>
          </div>
        </Field>
      </div>

      {/* Identity */}
      <SectionDivider label="Identity" />
      <Field label="Player Name">
        <TextInput value={get('player_name')} onChange={(v) => set('player_name', v)} placeholder="Real name of the player" />
      </Field>
      <Field label={fields.species}>
        <TextInput value={get('race')} onChange={(v) => set('race', v)} placeholder={`e.g. ${fields.species}`} />
      </Field>
      <Field label={fields.role}>
        <TextInput value={get('class')} onChange={(v) => set('class', v)} placeholder={`e.g. ${fields.role}`} />
      </Field>
      <Field label="Level">
        <TextInput type="number" value={get('level')} onChange={(v) => set('level', v)} placeholder="e.g. 5" />
      </Field>
      <Field label={fields.background}>
        <TextInput value={get('background')} onChange={(v) => set('background', v)} placeholder={`e.g. ${fields.background}`} />
      </Field>
      <Field label="Gender">
        <TextInput value={get('gender')} onChange={(v) => set('gender', v)} placeholder="e.g. Male, Female, Non-binary" />
      </Field>
      {system.hasDndBeyondImport && (
        get('dndbeyond_id') ? (
          <Field label="D&D Beyond">
            <a
              href={`https://www.dndbeyond.com/characters/${get('dndbeyond_id')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Character Sheet
            </a>
          </Field>
        ) : (
          <Field label="D&D Beyond ID">
            <TextInput value={get('dndbeyond_id')} onChange={(v) => set('dndbeyond_id', v)} placeholder="e.g. 155724296" />
          </Field>
        )
      )}

      {/* Combat Stats */}
      <SectionDivider label="Combat Stats" />
      <Field label="Max Hit Points">
        <TextInput type="number" value={get('max_hit_points')} onChange={(v) => set('max_hit_points', v)} placeholder="e.g. 28" />
      </Field>
      <Field label="Armor Class">
        <TextInput type="number" value={get('armor_class')} onChange={(v) => set('armor_class', v)} placeholder="e.g. 15" />
      </Field>
      <Field label="Walking Speed (ft)">
        <TextInput type="number" value={get('walking_speed')} onChange={(v) => set('walking_speed', v)} placeholder="e.g. 30" />
      </Field>

      {/* Ability Scores — D&D/PF2e only */}
      {system.hasAbilityScores && (
        <>
          <SectionDivider label="Ability Scores" />
          <div className="md:col-span-2 grid grid-cols-3 md:grid-cols-6 gap-3">
            {ABILITY_NAMES.map((name) => (
              <AbilityScoreBox
                key={name}
                name={name}
                value={abilities[name]}
                onChange={(val) => setAbility(name, val)}
              />
            ))}
          </div>

          <SectionDivider label="Passive Skills" />
          <Field label="Passive Perception">
            <TextInput type="number" value={get('passive_perception')} onChange={(v) => set('passive_perception', v)} placeholder="e.g. 14" />
          </Field>
          <Field label="Passive Investigation">
            <TextInput type="number" value={get('passive_investigation')} onChange={(v) => set('passive_investigation', v)} placeholder="e.g. 11" />
          </Field>
          <Field label="Passive Insight">
            <TextInput type="number" value={get('passive_insight')} onChange={(v) => set('passive_insight', v)} placeholder="e.g. 13" />
          </Field>
        </>
      )}

      <Field label="Languages">
        <TextInput value={get('languages')} onChange={(v) => set('languages', v)} placeholder="e.g. Common, Elvish, Draconic" />
      </Field>

      {/* Personality */}
      <SectionDivider label="Personality" />
      <div className="md:col-span-2">
        <Field label="Personality Traits">
          <TextArea value={get('personality_traits')} onChange={(v) => set('personality_traits', v)} placeholder="How do they act? What are their defining habits and mannerisms?" />
        </Field>
      </div>
      <Field label="Ideals">
        <TextArea value={get('ideals')} onChange={(v) => set('ideals', v)} placeholder="What do they believe in deeply?" />
      </Field>
      <Field label="Bonds">
        <TextArea value={get('bonds')} onChange={(v) => set('bonds', v)} placeholder="Who or what do they care about most?" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Flaws">
          <TextArea value={get('flaws')} onChange={(v) => set('flaws', v)} placeholder="What weaknesses or vices hold them back?" />
        </Field>
      </div>

      {/* Campaign Notes */}
      <SectionDivider label="Campaign Notes" />
      <div className="md:col-span-2">
        <Field label="Character Arc & Goals">
          <TextArea value={get('arc')} onChange={(v) => set('arc', v)} placeholder="Where are they headed? What do they ultimately want?" rows={3} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Personal Quest Hooks">
          <TextArea value={get('hooks')} onChange={(v) => set('hooks', v)} placeholder="What backstory threads can be woven into the campaign?" rows={3} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Relationships with Other PCs">
          <TextArea value={get('relationships')} onChange={(v) => set('relationships', v)} placeholder="How do they relate to the rest of the party?" rows={3} />
        </Field>
      </div>

    </div>
  );
}
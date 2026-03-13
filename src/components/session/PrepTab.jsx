import React, { useState } from 'react';
import { InvokeLLM } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Users, Swords, Flame, Scroll, Gem, X } from 'lucide-react';
import AIGenerateTextarea from './AIGenerateTextarea';
import EntityPickerModal from './EntityPickerModal';

function buildSessionContext(campaign, session, entities) {
  const linkedEntities = entities
    .filter(e => [
      ...(session?.npc_ids || []),
      ...(session?.planned_encounters || []),
      ...(session?.creature_ids || []),
      ...(session?.planned_locations || []),
    ].includes(e.id))
    .map(e => `${e.name} (${e.entity_type}): ${e.summary || ''}`)
    .join('\n');

  return `Campaign: ${campaign?.name || 'Unknown'}
Setting: ${campaign?.setting || 'Standard fantasy'}
Session #${session?.session_number || '?'}
Previous Recap: ${session?.previous_session_recap || 'None'}
Strong Start: ${session?.strong_start || 'Not written yet'}
NPC Notes: ${session?.npc_notes || 'None'}
Monster Notes: ${session?.monster_notes || 'None'}
Linked Entities:\n${linkedEntities || 'None yet'}`;
}

function LinkedEntityBadge({ entity, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
      {entity.name}
      <button onClick={() => onRemove(entity)} className="text-zinc-600 hover:text-zinc-300 ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function LinkedEntitiesSection({ title, icon: Icon, color, entityType, linkedIds, setLinkedIds, entities, campaignId, session, campaign }) {
  const [modalOpen, setModalOpen] = useState(false);
  const linkedEntities = entities.filter(e => linkedIds.includes(e.id));

  const handleLink = (entity) => {
    if (!linkedIds.includes(entity.id)) setLinkedIds(prev => [...prev, entity.id]);
  };
  const handleUnlink = (entity) => {
    setLinkedIds(prev => prev.filter(id => id !== entity.id));
  };

  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${colorClasses[color].split(' ')[0]}`}>
          <Icon className="w-3.5 h-3.5" />{title}
        </label>
        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          variant="outline"
          className="border-zinc-700 text-zinc-400 hover:text-zinc-200 h-7 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      {linkedEntities.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {linkedEntities.map(e => (
            <LinkedEntityBadge key={e.id} entity={e} onRemove={handleUnlink} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 italic">None linked yet.</p>
      )}
      <EntityPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        campaignId={campaignId}
        entityType={entityType}
        entities={entities}
        linkedIds={linkedIds}
        onLink={handleLink}
        onUnlink={handleUnlink}
      />
    </div>
  );
}

export default function PrepTab({ session, campaign, entities, formData, setFormData, campaignId }) {
  const ctx = () => buildSessionContext(campaign, { ...session, ...formData }, entities);

  const setField = (key) => (val) => setFormData(prev => ({ ...prev, [key]: val }));
  const setIds = (key) => (updater) => setFormData(prev => ({
    ...prev,
    [key]: typeof updater === 'function' ? updater(prev[key] || []) : updater,
  }));

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Previously On */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Previously On...</h3>
        <AIGenerateTextarea
          value={formData.previous_session_recap || ''}
          onChange={setField('previous_session_recap')}
          placeholder="What happened last session? This is read aloud to set the stage..."
          rows={4}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `Write a short "previously on" recap (2-3 sentences, past tense, dramatic tone) for a D&D session.
${ctx()}
Base it on the previous session recap if available, otherwise use campaign context.`,
            });
            return result;
          }}
        />
      </section>

      {/* Strong Start */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500/80">Strong Start</h3>
        <p className="text-xs text-zinc-600">Drop players into action, tension, or an interesting choice immediately.</p>
        <AIGenerateTextarea
          value={formData.strong_start || ''}
          onChange={setField('strong_start')}
          placeholder="Read-aloud opening scene. Something is already happening when players arrive..."
          rows={5}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `Generate a strong session opening for a D&D game using the Sly Flourish Lazy DM method.
${ctx()}
The strong start should:
- Open with "something happening" — not a monologue or recap
- Drop players immediately into action, tension, or an interesting choice
- Connect naturally to previous events
- Be written as present-tense narration the DM reads aloud
Keep it punchy: 2 short paragraphs max.`,
            });
            return result;
          }}
        />
      </section>

      {/* Relevant Encounters */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Encounters & Creatures</h3>
        <LinkedEntitiesSection
          title="Encounters"
          icon={Flame}
          color="rose"
          entityType="encounter"
          linkedIds={formData.planned_encounters || []}
          setLinkedIds={setIds('planned_encounters')}
          entities={entities}
          campaignId={campaignId}
          session={session}
          campaign={campaign}
        />
        <LinkedEntitiesSection
          title="Creatures"
          icon={Swords}
          color="rose"
          entityType="creature"
          linkedIds={formData.creature_ids || []}
          setLinkedIds={setIds('creature_ids')}
          entities={entities}
          campaignId={campaignId}
          session={session}
          campaign={campaign}
        />
        <AIGenerateTextarea
          value={formData.monster_notes || ''}
          onChange={setField('monster_notes')}
          placeholder={`e.g.\n- 4x Bandits + 1 Bandit Captain (ambush on the road)\n- Boss: Vampire Spawn Voss`}
          rows={4}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `Generate a list of relevant monsters/encounters for a D&D session, formatted as bullet points.
${ctx()}
Focus on monsters that fit the setting and current story threads. Include quantity and brief encounter context.`,
            });
            return result;
          }}
        />
      </section>

      {/* Relevant Locations */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Locations</h3>
        <LinkedEntitiesSection
          title="Locations"
          icon={MapPin}
          color="amber"
          entityType="location"
          linkedIds={formData.planned_locations || []}
          setLinkedIds={setIds('planned_locations')}
          entities={entities}
          campaignId={campaignId}
          session={session}
          campaign={campaign}
        />
        <AIGenerateTextarea
          value={formData.location_notes || ''}
          onChange={setField('location_notes')}
          placeholder="e.g. Bridge of Teeth — crumbling stone, troll-carved faces, rushing rapids below..."
          rows={3}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `Generate 2-3 evocative fantastic locations for a D&D session, with brief descriptive bullet points (name + 2-3 sensory details each).
${ctx()}`,
            });
            return result;
          }}
        />
      </section>

      {/* Relevant NPCs */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">NPCs</h3>
        <LinkedEntitiesSection
          title="NPCs"
          icon={Users}
          color="cyan"
          entityType="npc"
          linkedIds={formData.npc_ids || []}
          setLinkedIds={setIds('npc_ids')}
          entities={entities}
          campaignId={campaignId}
          session={session}
          campaign={campaign}
        />
        <AIGenerateTextarea
          value={formData.npc_notes || ''}
          onChange={setField('npc_notes')}
          placeholder={`e.g.\n- Lady Voss (gravelly voice, never makes eye contact) — wants the deed to the mill`}
          rows={4}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `Generate a list of 3-5 important NPCs for a D&D session, formatted as bullet points.
${ctx()}
For each NPC include: name, one physical/vocal trait, and their motivation in this session.`,
            });
            return result;
          }}
        />
      </section>

      {/* Rumors */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
          <Scroll className="w-3.5 h-3.5" /> Rumors
        </h3>
        <AIGenerateTextarea
          value={formData.rumors || ''}
          onChange={setField('rumors')}
          placeholder="Rumors the players might hear around town, from travelers, in taverns..."
          rows={4}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `Generate 4-6 interesting rumors for a D&D session, as bullet points. Mix true, false, and half-true rumors.
${ctx()}
Each rumor should be 1-2 sentences and feel like something a local or traveler would say.`,
            });
            return result;
          }}
        />
      </section>

      {/* Treasure & Magic Items */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500/80 flex items-center gap-1.5">
          <Gem className="w-3.5 h-3.5" /> Loot & Magic Items
        </h3>
        <AIGenerateTextarea
          value={formData.treasure_notes || ''}
          onChange={setField('treasure_notes')}
          placeholder="Treasure hoards, magic items, story rewards..."
          rows={4}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `Generate appropriate treasure and magic item rewards for a D&D session, as bullet points.
${ctx()}
Include a mix of: coin/gems, consumables (potions, scrolls), and 1-2 interesting magic items that fit the current story.`,
            });
            return result;
          }}
        />
      </section>

    </div>
  );
}
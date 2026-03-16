import React from 'react';
import { InvokeLLM } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Swords, Flame, Gem, X, CalendarDays, Zap, GitBranch } from 'lucide-react';
import AIGenerateTextarea from './AIGenerateTextarea';
import EntityPickerModal from './EntityPickerModal';
import { useCampaign } from '@/lib/CampaignContext';

function buildSessionContext(campaign, session, entities, systemName) {
  const linkedEntities = entities
    .filter(e => [
      ...(session?.npc_ids || []),
      ...(session?.planned_encounters || []),
      ...(session?.creature_ids || []),
      ...(session?.planned_locations || []),
      ...(session?.planned_events || []),
      ...(session?.thread_ids || []),
    ].includes(e.id))
    .map(e => `${e.name} (${e.entity_type}): ${e.summary || ''}`)
    .join('\n');

  return `System: ${systemName}
Campaign: ${campaign?.name || 'Unknown'}
Setting: ${campaign?.setting || 'Standard fantasy'}
Session #${session?.session_number || '?'}
Recap: ${session?.previous_session_recap || 'None'}
Session Intro: ${session?.strong_start || 'Not written yet'}
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

function LinkedEntitiesSection({ title, icon: Icon, color, entityType, linkedIds, setLinkedIds, entities, campaignId }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const linkedEntities = entities.filter(e => linkedIds.includes(e.id));

  const handleLink = (entity) => {
    if (!linkedIds.includes(entity.id)) setLinkedIds(prev => [...prev, entity.id]);
  };
  const handleUnlink = (entity) => {
    setLinkedIds(prev => prev.filter(id => id !== entity.id));
  };

  const colorClasses = {
    cyan: 'text-cyan-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${colorClasses[color] || 'text-zinc-400'}`}>
          <Icon className="w-3.5 h-3.5" />{title}
        </label>
        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          variant="outline"
          className="border-zinc-700 text-zinc-400 hover:text-zinc-200 h-7 text-xs"
        >
          + Add
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

export default function PrepTab({ session, campaign, entities, formData, setFormData, campaignId, previousSession }) {
  const { system } = useCampaign();
  const ctx = () => buildSessionContext(campaign, { ...session, ...formData }, entities, system.promptName);

  const setField = (key) => (val) => setFormData(prev => ({ ...prev, [key]: val }));
  const setIds = (key) => (updater) => setFormData(prev => ({
    ...prev,
    [key]: typeof updater === 'function' ? updater(prev[key] || []) : updater,
  }));

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Play Date */}
      <section className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 whitespace-nowrap">
          <CalendarDays className="w-3.5 h-3.5" /> Play Date
        </label>
        <input
          type="date"
          value={formData.date || ''}
          onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className="bg-transparent border-b border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/60 pb-0.5 dark:[color-scheme:dark]"
        />
      </section>

      {/* Recap */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Recap</h3>
        <p className="text-xs text-zinc-600">Open the previous session's debrief. Identify the last major action, the most important discovery, and the cliffhanger where the session ended.</p>
        <AIGenerateTextarea
          value={formData.previous_session_recap || ''}
          onChange={setField('previous_session_recap')}
          placeholder="Last session: the party discovered the map was a forgery, Harrow escaped through the sewer gate, and the players are now framed for the theft..."
          rows={4}
          onGenerate={async () => {
            const keyEventLines = previousSession?.key_events?.length
              ? previousSession.key_events.map((e, i) => `${i + 1}. ${e}`).join('\n')
              : null;
            const prevSummary = previousSession?.summary || previousSession?.next_session_primer || null;

            const result = await InvokeLLM({
              prompt: `Write a "Previously on..." recap for a ${system.promptName} session (2-3 sentences, past tense, dramatic tone).
Identify the three most critical takeaways: the last major action taken, the most important discovery made, and the exact cliffhanger or hook where the session ended.
${keyEventLines ? `\nKey events from the previous session — use ONLY these as your source of truth, do not invent events:\n${keyEventLines}` : ''}
${prevSummary ? `\nPrevious session summary for additional context:\n${prevSummary}` : ''}
${ctx()}`,
            });
            return result;
          }}
        />
      </section>

      {/* Intro */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500/80">Intro</h3>
        <p className="text-xs text-zinc-600">Draft a sensory-rich opening scene with a specific inciting incident to snap the players into character without delay.</p>
        <AIGenerateTextarea
          value={formData.strong_start || ''}
          onChange={setField('strong_start')}
          placeholder="Read-aloud opening scene. Something is already in motion when the players arrive — a knock at the door, a sudden change in weather, an NPC who needs them right now..."
          rows={5}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `Write a brief, sensory-rich narrative to open a ${system.promptName} session.
Focus on the immediate environment and include a specific inciting incident — a knock at the door, a sudden change in weather, or an NPC initiating a conversation — to snap the players into character without delay.
${ctx()}
Written as present-tense narration the GM reads aloud. 2 short paragraphs max.`,
            });
            return result;
          }}
        />
      </section>

      {/* Events */}
      <section className="space-y-3">
        <LinkedEntitiesSection
          title="Events"
          icon={Zap}
          color="purple"
          entityType="event"
          linkedIds={formData.planned_events || []}
          setLinkedIds={setIds('planned_events')}
          entities={entities}
          campaignId={campaignId}
        />
        <p className="text-xs text-zinc-600">World-level occurrences and timed triggers that happen during this session regardless of player action.</p>
        <AIGenerateTextarea
          value={formData.event_notes || ''}
          onChange={setField('event_notes')}
          placeholder={`e.g.\n- Dawn: the city gates close for the harvest festival — no one enters or leaves\n- Midnight: Lord Caine's bounty hunters arrive at the inn\n- The eclipse begins — the cult's ritual can only be performed now`}
          rows={4}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `List 3-5 world-level events or timed triggers occurring during this ${system.promptName} session.
These are things that happen regardless of player action: a changing of the guard, a scheduled festival, the deadline for a villain's plan, a patrol route, a weather shift.
${ctx()}
Format as bullet points. Each event should move the world forward and create pressure or opportunity.`,
            });
            return result;
          }}
        />
      </section>

      {/* Locations */}
      <section className="space-y-3">
        <LinkedEntitiesSection
          title="Locations"
          icon={MapPin}
          color="amber"
          entityType="location"
          linkedIds={formData.planned_locations || []}
          setLinkedIds={setIds('planned_locations')}
          entities={entities}
          campaignId={campaignId}
        />
        <p className="text-xs text-zinc-600">Select primary and secondary settings. Note one distinct sensory detail for each to make scene transitions feel visceral.</p>
        <AIGenerateTextarea
          value={formData.location_notes || ''}
          onChange={setField('location_notes')}
          placeholder={`e.g.\n- The Ashmarket: reeks of burning tallow, crows picking at carcasses overhead\n- Undercroft of St. Veth: knee-deep black water, distant dripping echoes`}
          rows={3}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `Describe the primary and secondary settings for this ${system.promptName} session.
For each location, note one distinct sensory detail — a specific smell, sound, or quality of light — to make scene transitions feel visceral and distinct.
${ctx()}
Format as a concise list: location name + 1 sensory detail.`,
            });
            return result;
          }}
        />
      </section>

      {/* NPCs */}
      <section className="space-y-3">
        <LinkedEntitiesSection
          title="NPCs"
          icon={Users}
          color="cyan"
          entityType="npc"
          linkedIds={formData.npc_ids || []}
          setLinkedIds={setIds('npc_ids')}
          entities={entities}
          campaignId={campaignId}
        />
        <p className="text-xs text-zinc-600">Choose the characters appearing tonight. Define each one's immediate goal and a quick roleplay quirk to keep their performance consistent.</p>
        <AIGenerateTextarea
          value={formData.npc_notes || ''}
          onChange={setField('npc_notes')}
          placeholder={`e.g.\n- Lady Voss | GOAL: hide the forged deed | QUIRK: never makes eye contact, addresses the room not the person\n- Ser Aldric | GOAL: get the players out of town quickly | QUIRK: cracks knuckles before lying`}
          rows={4}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `List the key NPCs appearing in this ${system.promptName} session as bullet points.
For each: name, their immediate goal in this encounter (e.g. "to get information" or "to hide a secret"), and one roleplay quirk to keep their performance consistent at the table.
${ctx()}`,
            });
            return result;
          }}
        />
      </section>

      {/* Encounters */}
      <section className="space-y-3">
        <LinkedEntitiesSection
          title="Encounters"
          icon={Flame}
          color="rose"
          entityType="encounter"
          linkedIds={formData.planned_encounters || []}
          setLinkedIds={setIds('planned_encounters')}
          entities={entities}
          campaignId={campaignId}
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
        />
        <p className="text-xs text-zinc-600">Determine the specific challenges — combat, social negotiations, or environmental hazards. Link entities so stat blocks and DC checks are ready to go.</p>
        <AIGenerateTextarea
          value={formData.monster_notes || ''}
          onChange={setField('monster_notes')}
          placeholder={`e.g.\n- 4x Guild Thugs + 1 Enforcer (ambush in the alley, DC 14 Perception to notice)\n- Social: Magistrate Holt wants a bribe or evidence — Persuasion DC 16 or Deception DC 12`}
          rows={4}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `List the specific challenges for this ${system.promptName} session as bullet points.
Include combat encounters, social negotiations, and environmental hazards. Note quantities, brief context, and any relevant DCs or stat references.
${ctx()}`,
            });
            return result;
          }}
        />
      </section>

      {/* Threads */}
      <section className="space-y-3">
        <LinkedEntitiesSection
          title="Threads"
          icon={GitBranch}
          color="purple"
          entityType="lore"
          linkedIds={formData.thread_ids || []}
          setLinkedIds={setIds('thread_ids')}
          entities={entities}
          campaignId={campaignId}
        />
        <p className="text-xs text-zinc-600">Note which ongoing plot hooks and mysteries are active tonight. Track current progress and how much closer players get to resolution.</p>
        <AIGenerateTextarea
          value={formData.thread_notes || ''}
          onChange={setField('thread_notes')}
          placeholder={`e.g.\n- The Missing Shipment: players are one step from the warehouse — tonight they can find the manifest\n- Harrow's Identity: do NOT reveal yet; plant the signet ring as a clue for next session`}
          rows={4}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `Summarize the active plot hooks and mysteries for this ${system.promptName} session.
For each thread: what is its current status, how much closer will players get tonight, and exactly what information should be revealed — or withheld — to build toward resolution.
${ctx()}
Format as bullet points.`,
            });
            return result;
          }}
        />
      </section>

      {/* Rewards */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500/80 flex items-center gap-1.5">
          <Gem className="w-3.5 h-3.5" /> Rewards
        </h3>
        <p className="text-xs text-zinc-600">List physical loot and narrative boons available this session — items found in locations, plus contacts, faction rep, or secrets players can earn.</p>
        <AIGenerateTextarea
          value={formData.treasure_notes || ''}
          onChange={setField('treasure_notes')}
          placeholder={`e.g.\n- PHYSICAL: 80gp in coin, Potion of Healing, the Warden's personal sword (+1, silvered)\n- NARRATIVE: introduction to the Merchant's Guild fence; knowledge of the governor's blackmail secret`}
          rows={4}
          onGenerate={async () => {
            const result = await InvokeLLM({
              prompt: `List the specific rewards available in this ${system.promptName} session as bullet points.
Include both physical rewards (items, currency, equipment found in locations) and narrative rewards (a secret piece of information, a new contact, a boost in faction reputation, a favor owed).
${ctx()}`,
            });
            return result;
          }}
        />
      </section>

    </div>
  );
}

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Users, Swords, Flame, Gem, X, CalendarDays, Zap, GitBranch } from 'lucide-react';
import EntityPickerModal from './EntityPickerModal';

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

export default function PrepTab({ session, campaign, entities, formData, setFormData, campaignId }) {
  const setField = (key) => (val) => setFormData(prev => ({ ...prev, [key]: val }));
  const setIds = (key) => (updater) => setFormData(prev => ({
    ...prev,
    [key]: typeof updater === 'function' ? updater(prev[key] || []) : updater,
  }));

  const fieldProps = (key, rows = 4, placeholder = '') => ({
    value: formData[key] || '',
    onChange: (e) => setField(key)(e.target.value),
    rows,
    placeholder,
    className: 'dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 resize-none text-sm',
  });

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
        <Textarea
          {...fieldProps('previous_session_recap', 4, 'Last session: the party discovered the map was a forgery, Harrow escaped through the sewer gate, and the players are now framed for the theft...')}
        />
      </section>

      {/* Intro */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500/80">Intro</h3>
        <p className="text-xs text-zinc-600">Draft a sensory-rich opening scene with a specific inciting incident to snap the players into character without delay.</p>
        <Textarea
          {...fieldProps('strong_start', 5, 'Read-aloud opening scene. Something is already in motion when the players arrive — a knock at the door, a sudden change in weather, an NPC who needs them right now...')}
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
        <Textarea
          {...fieldProps('event_notes', 4, 'e.g.\n- Dawn: the city gates close for the harvest festival — no one enters or leaves\n- Midnight: Lord Caine\'s bounty hunters arrive at the inn')}
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
        <Textarea
          {...fieldProps('location_notes', 3, 'e.g.\n- The Ashmarket: reeks of burning tallow, crows picking at carcasses overhead\n- Undercroft of St. Veth: knee-deep black water, distant dripping echoes')}
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
        <Textarea
          {...fieldProps('npc_notes', 4, 'e.g.\n- Lady Voss | GOAL: hide the forged deed | QUIRK: never makes eye contact\n- Ser Aldric | GOAL: get the players out of town | QUIRK: cracks knuckles before lying')}
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
        <Textarea
          {...fieldProps('monster_notes', 4, 'e.g.\n- 4x Guild Thugs + 1 Enforcer (ambush in the alley, DC 14 Perception to notice)\n- Social: Magistrate Holt wants a bribe or evidence — Persuasion DC 16 or Deception DC 12')}
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
        <Textarea
          {...fieldProps('thread_notes', 4, 'e.g.\n- The Missing Shipment: players are one step from the warehouse — tonight they can find the manifest\n- Harrow\'s Identity: do NOT reveal yet; plant the signet ring as a clue for next session')}
        />
      </section>

      {/* Rewards */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500/80 flex items-center gap-1.5">
          <Gem className="w-3.5 h-3.5" /> Rewards
        </h3>
        <p className="text-xs text-zinc-600">List physical loot and narrative boons available this session — items found in locations, plus contacts, faction rep, or secrets players can earn.</p>
        <Textarea
          {...fieldProps('treasure_notes', 4, 'e.g.\n- PHYSICAL: 80gp in coin, Potion of Healing, the Warden\'s personal sword (+1, silvered)\n- NARRATIVE: introduction to the Merchant\'s Guild fence; knowledge of the governor\'s blackmail secret')}
        />
      </section>

    </div>
  );
}

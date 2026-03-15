import React from 'react';
import ReactMarkdown from 'react-markdown';

function Section({ title, children }) {
  if (!children) return null;
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function MDText({ text }) {
  if (!text) return null;
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 dark:text-zinc-300 text-gray-700 leading-relaxed text-sm">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 dark:text-zinc-300 text-gray-700 text-sm ml-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 dark:text-zinc-300 text-gray-700 text-sm ml-2">{children}</ol>,
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        strong: ({ children }) => <strong className="dark:text-white text-gray-900 font-semibold">{children}</strong>,
        em: ({ children }) => <em className="dark:text-zinc-400 text-gray-500 italic">{children}</em>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}


function EntityChips({ ids, entityMap }) {
  const entities = (ids || []).map(id => entityMap[id]).filter(Boolean);
  if (!entities.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {entities.map(e => (
        <span key={e.id} className="text-xs px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 bg-gray-200 border-gray-300 text-gray-700">
          {e.name}
        </span>
      ))}
    </div>
  );
}

export default function SessionNotesDisplay({ session, entities = [] }) {
  if (!session) return null;

  const entityMap = Object.fromEntries(entities.map(e => [e.id, e]));

  const hasContent = session.strong_start || session.previous_session_recap ||
    session.location_notes || session.npc_notes || session.monster_notes ||
    session.event_notes || session.thread_notes || session.treasure_notes ||
    (session.npc_ids?.length > 0) || (session.creature_ids?.length > 0) ||
    (session.planned_locations?.length > 0) || (session.planned_encounters?.length > 0) ||
    (session.planned_events?.length > 0) || (session.thread_ids?.length > 0);

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-48 dark:text-zinc-500 text-gray-400 gap-2">
        <p className="text-sm">No prep data yet.</p>
        <p className="text-xs dark:text-zinc-600 text-gray-400">Fill in the Prep tab to see your session notes here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-1">

      {session.previous_session_recap && (
        <Section title="📜 Previously...">
          <MDText text={session.previous_session_recap} />
        </Section>
      )}

      {session.strong_start && (
        <Section title="⚡ Strong Start">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <MDText text={session.strong_start} />
          </div>
        </Section>
      )}

      {(session.planned_events?.length > 0 || session.event_notes) && (
        <Section title="⚡ Events">
          <EntityChips ids={session.planned_events} entityMap={entityMap} />
          {session.event_notes && <MDText text={session.event_notes} />}
        </Section>
      )}

      {(session.planned_locations?.length > 0 || session.location_notes) && (
        <Section title="🗺️ Locations">
          <EntityChips ids={session.planned_locations} entityMap={entityMap} />
          {session.location_notes && <MDText text={session.location_notes} />}
        </Section>
      )}

      {(session.npc_ids?.length > 0 || session.npc_notes) && (
        <Section title="👤 NPCs">
          <EntityChips ids={session.npc_ids} entityMap={entityMap} />
          {session.npc_notes && <MDText text={session.npc_notes} />}
        </Section>
      )}

      {(session.planned_encounters?.length > 0 || session.creature_ids?.length > 0 || session.monster_notes) && (
        <Section title="⚔️ Encounters & Creatures">
          <EntityChips ids={session.planned_encounters} entityMap={entityMap} />
          <EntityChips ids={session.creature_ids} entityMap={entityMap} />
          {session.monster_notes && <MDText text={session.monster_notes} />}
        </Section>
      )}

      {(session.thread_ids?.length > 0 || session.thread_notes) && (
        <Section title="🧵 Threads">
          <EntityChips ids={session.thread_ids} entityMap={entityMap} />
          {session.thread_notes && <MDText text={session.thread_notes} />}
        </Section>
      )}

      {session.treasure_notes && (
        <Section title="💰 Rewards">
          <MDText text={session.treasure_notes} />
        </Section>
      )}

    </div>
  );
}
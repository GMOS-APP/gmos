import React from 'react';
import ReactMarkdown from 'react-markdown';

function Section({ title, children }) {
  if (!children) return null;
  return (
    <div className="py-5 border-b border-gray-100 dark:border-zinc-800/60 last:border-b-0">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 dark:text-amber-400 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function MDText({ text }) {
  if (!text) return null;
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 dark:text-zinc-300 text-gray-700 leading-relaxed text-sm">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 dark:text-zinc-300 text-gray-700 text-sm space-y-0.5 ml-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 dark:text-zinc-300 text-gray-700 text-sm space-y-0.5 ml-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="dark:text-white text-gray-900 font-semibold">{children}</strong>,
        em: ({ children }) => <em className="dark:text-zinc-400 text-gray-500 italic">{children}</em>,
        h1: ({ children }) => <h1 className="text-base font-bold dark:text-zinc-100 text-gray-900 mb-2 mt-3 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold dark:text-zinc-200 text-gray-800 mb-1.5 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-semibold dark:text-zinc-300 text-gray-700 mb-1 mt-2 first:mt-0">{children}</h3>,
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
    <div className="flex flex-wrap gap-1.5 mb-3">
      {entities.map(e => (
        <span
          key={e.id}
          className="text-xs px-2.5 py-1 rounded-full border dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 bg-gray-100 border-gray-200 text-gray-700 font-medium"
        >
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
    <div className="px-5">

      {session.previous_session_recap && (
        <Section title="📜 Previously…">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800">
            <MDText text={session.previous_session_recap} />
          </div>
        </Section>
      )}

      {session.strong_start && (
        <Section title="⚡ Strong Start">
          <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25">
            <MDText text={session.strong_start} />
          </div>
        </Section>
      )}

      {(session.planned_events?.length > 0 || session.event_notes) && (
        <Section title="🗓 Events">
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

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

function BulletList({ items, emptyMsg }) {
  if (!items || items.length === 0) {
    return emptyMsg ? <p className="dark:text-zinc-600 text-gray-400 text-xs italic">{emptyMsg}</p> : null;
  }
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm dark:text-zinc-300 text-gray-700">
          <span className="text-amber-500 mt-1 flex-shrink-0">◆</span>
          <span>{typeof item === 'object' ? (item.text || item.hook || JSON.stringify(item)) : item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SessionNotesDisplay({ session, entities = [] }) {
  if (!session) return null;

  const entityMap = Object.fromEntries(entities.map(e => [e.id, e]));

  const hasContent = session.strong_start || session.previous_session_recap || 
    session.rumors || session.location_notes || session.npc_notes ||
    session.monster_notes || session.treasure_notes ||
    (session.potential_scenes?.length > 0) || (session.secrets_and_clues?.length > 0) ||
    (session.session_goals?.length > 0) || (session.character_hooks?.length > 0) ||
    (session.npc_ids?.length > 0) || (session.creature_ids?.length > 0);

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-48 dark:text-zinc-500 text-gray-400 gap-2">
        <p className="text-sm">No prep data yet.</p>
        <p className="text-xs dark:text-zinc-600 text-gray-400">Fill in the Prep tab to see your session notes here.</p>
      </div>
    );
  }

  const linkedNPCs = (session.npc_ids || []).map(id => entityMap[id]).filter(Boolean);
  const linkedCreatures = (session.creature_ids || []).map(id => entityMap[id]).filter(Boolean);

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

      {session.session_goals?.length > 0 && (
        <Section title="🎯 Session Goals">
          <ul className="space-y-1.5">
            {session.session_goals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 flex-shrink-0 ${goal.completed ? 'text-emerald-500' : 'dark:text-zinc-600 text-gray-400'}`}>
                  {goal.completed ? '✓' : '○'}
                </span>
                <span className={goal.completed ? 'dark:text-zinc-500 text-gray-400 line-through' : 'dark:text-zinc-300 text-gray-700'}>{goal.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {session.potential_scenes?.length > 0 && (
        <Section title="🎬 Potential Scenes">
          <BulletList items={session.potential_scenes} />
        </Section>
      )}

      {session.secrets_and_clues?.length > 0 && (
        <Section title="🔍 Secrets & Clues">
          <BulletList items={session.secrets_and_clues} />
        </Section>
      )}

      {session.character_hooks?.length > 0 && (
        <Section title="🪝 Character Hooks">
          <ul className="space-y-2">
            {session.character_hooks.map((h, i) => (
              <li key={i} className="text-sm">
                <span className="text-amber-400 font-semibold">{h.character_name}: </span>
                <span className="dark:text-zinc-300 text-gray-700">{h.hook}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(linkedNPCs.length > 0 || session.npc_notes) && (
        <Section title="👤 NPCs">
          {linkedNPCs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {linkedNPCs.map(npc => (
                <span key={npc.id} className="text-xs px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 bg-gray-200 border-gray-300 text-gray-700">
                  {npc.name}
                </span>
              ))}
            </div>
          )}
          {session.npc_notes && <MDText text={session.npc_notes} />}
        </Section>
      )}

      {(linkedCreatures.length > 0 || session.monster_notes) && (
        <Section title="🐉 Monsters & Creatures">
          {linkedCreatures.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {linkedCreatures.map(c => (
                <span key={c.id} className="text-xs px-2 py-0.5 rounded-full dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 bg-gray-200 border-gray-300 text-gray-700">
                  {c.name}
                </span>
              ))}
            </div>
          )}
          {session.monster_notes && <MDText text={session.monster_notes} />}
        </Section>
      )}

      {session.location_notes && (
        <Section title="🗺️ Locations">
          <MDText text={session.location_notes} />
        </Section>
      )}

      {session.rumors && (
        <Section title="💬 Rumors">
          <MDText text={session.rumors} />
        </Section>
      )}

      {session.treasure_notes && (
        <Section title="💰 Treasure & Rewards">
          <MDText text={session.treasure_notes} />
        </Section>
      )}

    </div>
  );
}
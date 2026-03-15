import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Parses [[entity_id|entity_name]] markers in text and renders them as
 * hoverable, clickable links with a tooltip showing summary + key facts.
 */
export default function EntityMentionRenderer({ text, entities = [], campaignId, className }) {
  if (!text) return null;

  // Build a lookup map from entity id → entity data
  const entityMap = {};
  entities.forEach((e) => { entityMap[e.id] = e; });

  // Split text on [[id|name]] markers
  const parts = [];
  const regex = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', content: text.slice(last, match.index) });
    }
    parts.push({ type: 'mention', id: match[1], name: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ type: 'text', content: text.slice(last) });
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part.content}</span>;
        }
        const entity = entityMap[part.id];
        return (
          <EntityMentionLink
            key={i}
            entityId={part.id}
            entityName={part.name}
            entity={entity}
            campaignId={campaignId}
          />
        );
      })}
    </span>
  );
}

function EntityMentionLink({ entityId, entityName, entity, campaignId }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setShowTooltip(true), 300);
  };
  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setShowTooltip(false);
  };

  const url = createPageUrl('EntityDetail') + `?id=${entityId}&campaign_id=${campaignId}`;
  const isDeleted = !entity;

  return (
    <span className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {isDeleted ? (
        <span className="text-zinc-600 line-through cursor-default" title="Entity no longer exists">
          @{entityName}
        </span>
      ) : (
        <Link
          to={url}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 underline decoration-dotted underline-offset-2 font-medium"
        >
          @{entity.name}
        </Link>
      )}

      {/* Tooltip */}
      {showTooltip && entity && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-2xl p-3 pointer-events-none">
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{entity.name}</p>
            <span className="text-[10px] text-gray-500 dark:text-zinc-500 capitalize bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
              {entity.entity_type?.replace('_', ' ')}
            </span>
          </div>
          {entity.summary && (
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2 leading-relaxed">{entity.summary}</p>
          )}
          {entity.key_facts?.length > 0 && (
            <ul className="space-y-0.5">
              {entity.key_facts.slice(0, 3).map((fact, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-400 dark:text-zinc-500">
                  <span className="w-1 h-1 rounded-full bg-amber-500/50 flex-shrink-0 mt-1.5" />
                  {fact}
                </li>
              ))}
              {entity.key_facts.length > 3 && (
                <li className="text-[11px] text-gray-400 dark:text-zinc-600 pl-2.5">
                  +{entity.key_facts.length - 3} more
                </li>
              )}
            </ul>
          )}
          {entity.status && entity.status !== 'active' && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-zinc-800">
              <span className="text-[10px] text-gray-400 dark:text-zinc-600 capitalize">{entity.status}</span>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
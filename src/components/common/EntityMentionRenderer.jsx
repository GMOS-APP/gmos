import React, { useState } from 'react';
import EntityQuickViewModal from '@/components/common/EntityQuickViewModal';

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
  const [modalOpen, setModalOpen] = useState(false);
  const isDeleted = !entity;

  return (
    <>
      {isDeleted ? (
        <span className="text-zinc-600 line-through cursor-default" title="Entity no longer exists">
          @{entityName}
        </span>
      ) : (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalOpen(true); }}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 underline decoration-dotted underline-offset-2 font-medium cursor-pointer"
        >
          @{entity.name}
        </button>
      )}

      {entity && (
        <EntityQuickViewModal
          entity={entity}
          campaignId={campaignId}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </>
  );
}
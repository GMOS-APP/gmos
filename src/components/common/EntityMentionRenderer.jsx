import React, { useState, useRef } from 'react';
import EntityQuickViewModal from '@/components/common/EntityQuickViewModal';

/**
 * Parses [[entity_id|entity_name]] markers in text and renders them as
 * hoverable, clickable links with a tooltip showing summary + key facts.
 *
 * @param {object} props
 * @param {string} [props.text] Text containing mention markers; renders nothing when empty.
 * @param {any[]} [props.entities] Campaign entities used to resolve mentions by id.
 * @param {string} [props.campaignId]
 * @param {string} [props.className] Classes for the wrapping span.
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

/**
 * A single rendered mention. Shows a struck-through label when the entity no
 * longer exists, otherwise a button that opens the quick-view modal.
 *
 * @param {object} props
 * @param {string} props.entityId Id from the mention marker (not used for rendering yet).
 * @param {string} props.entityName Name from the mention marker, shown if the entity is gone.
 * @param {any} [props.entity] The resolved entity, or undefined if deleted.
 * @param {string} [props.campaignId]
 */
function EntityMentionLink({ entityName, entity, campaignId }) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const btnRef = useRef(null);
  const isDeleted = !entity;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorRect(btnRef.current?.getBoundingClientRect());
    setOpen(true);
  };

  return (
    <>
      {isDeleted ? (
        <span className="text-zinc-600 line-through cursor-default" title="Entity no longer exists">
          @{entityName}
        </span>
      ) : (
        <button
          ref={btnRef}
          onClick={handleClick}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 underline decoration-dotted underline-offset-2 font-medium cursor-pointer"
        >
          @{entity.name}
        </button>
      )}

      {entity && (
        <EntityQuickViewModal
          entity={entity}
          campaignId={campaignId}
          open={open}
          onOpenChange={setOpen}
          anchorRect={anchorRect}
        />
      )}
    </>
  );
}
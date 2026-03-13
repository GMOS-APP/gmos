import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorldEntity } from '@/api/entities';
import { AtSign, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A textarea that supports @-mentions for WorldEntity records.
 * Stores content as plain text with [[entity_id|entity_name]] markers.
 */
export default function EntityMentionTextarea({
  value,
  onChange,
  campaignId,
  placeholder,
  rows = 8,
  className,
}) {
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [atIndex, setAtIndex] = useState(-1); // caret position where @ was typed
  const [creating, setCreating] = useState(false);

  // Fetch all entities for this campaign (cached)
  const { data: allEntities = [] } = useQuery({
    queryKey: ['entities', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
    staleTime: 30000,
  });

  // Filter by query
  const filtered = query.length === 0
    ? allEntities.slice(0, 8)
    : allEntities
        .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8);

  const showCreateOption = query.trim().length > 1 && !allEntities.some(
    (e) => e.name.toLowerCase() === query.toLowerCase()
  );

  // Calculate dropdown position using a mirror div technique
  const computeDropdownPos = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const rect = ta.getBoundingClientRect();
    const containerRect = ta.offsetParent?.getBoundingClientRect() || rect;
    // Approximate: place below textarea for simplicity
    setDropdownPos({
      top: rect.bottom - containerRect.top + 4,
      left: rect.left - containerRect.left,
    });
  }, []);

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'Escape') {
      setShowDropdown(false);
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const text = e.target.value;
    onChange(text);

    const caret = e.target.selectionStart;
    // Find the last @ before caret that isn't already part of a link marker
    const before = text.slice(0, caret);
    const atPos = before.lastIndexOf('@');

    if (atPos === -1) {
      setShowDropdown(false);
      return;
    }

    // Make sure there's no space between @ and caret (i.e., it's an active mention)
    const fragment = before.slice(atPos + 1);
    if (fragment.includes(' ') || fragment.includes('\n')) {
      setShowDropdown(false);
      return;
    }

    setAtIndex(atPos);
    setQuery(fragment);
    computeDropdownPos();
    setShowDropdown(true);
  };

  const insertMention = useCallback((entity) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const text = value;
    const marker = `[[${entity.id}|${entity.name}]]`;
    const before = text.slice(0, atIndex);
    const afterAtSearch = text.slice(atIndex + 1 + query.length);
    const newText = before + marker + afterAtSearch;

    onChange(newText);
    setShowDropdown(false);
    setQuery('');

    // Restore focus & move caret after inserted marker
    setTimeout(() => {
      ta.focus();
      const newCaret = before.length + marker.length;
      ta.setSelectionRange(newCaret, newCaret);
    }, 0);
  }, [value, atIndex, query, onChange]);

  const createAndInsert = async () => {
    if (!query.trim() || !campaignId) return;
    setCreating(true);
    const newEntity = await WorldEntity.create({
      campaign_id: campaignId,
      name: query.trim(),
      entity_type: 'npc',
      summary: '',
    });
    setCreating(false);
    insertMention(newEntity);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        textareaRef.current && !textareaRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          'w-full dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:ring-amber-500/50 bg-gray-100 border-gray-300 border text-gray-900 placeholder:text-gray-500 text-sm p-3 resize-y focus:outline-none focus:ring-1 focus:ring-amber-600/50 font-mono',
          className
        )}
      />

      {/* Hint */}
      <div className="flex items-center gap-1 mt-1.5 text-[11px] dark:text-zinc-500 text-gray-600">
        <AtSign className="w-3 h-3" />
        <span>Type @ to link a world entity</span>
      </div>

      {/* Mention Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          className="absolute z-50 w-72 dark:bg-zinc-900 dark:border-zinc-700 bg-white border-gray-300 border rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="px-3 py-2 dark:border-b dark:border-zinc-800 border-b border-gray-200 flex items-center gap-2">
            <AtSign className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs dark:text-zinc-400 text-gray-600">
              {query ? `"${query}"` : 'All entities'}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && !showCreateOption && (
              <p className="text-xs dark:text-zinc-600 text-gray-600 p-3">No entities found</p>
            )}

            {filtered.map((entity) => (
              <button
                key={entity.id}
                onMouseDown={(e) => { e.preventDefault(); insertMention(entity); }}
                className="w-full text-left px-3 py-2.5 dark:hover:bg-zinc-800 hover:bg-gray-100 flex items-start gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm dark:text-zinc-200 dark:group-hover:text-amber-400 text-gray-900 group-hover:text-amber-600 font-medium truncate">
                    {entity.name}
                  </p>
                  <p className="text-[11px] dark:text-zinc-500 text-gray-600 capitalize truncate">
                    {entity.entity_type}{entity.summary ? ` · ${entity.summary}` : ''}
                  </p>
                </div>
              </button>
            ))}

            {showCreateOption && (
              <button
                onMouseDown={(e) => { e.preventDefault(); createAndInsert(); }}
                disabled={creating}
                className="w-full text-left px-3 py-2.5 dark:hover:bg-zinc-800/80 dark:border-t dark:border-zinc-800 hover:bg-gray-100 border-t border-gray-200 flex items-center gap-2"
              >
                {creating ? (
                  <Loader2 className="w-3.5 h-3.5 text-green-400 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-green-400" />
                )}
                <span className="text-sm text-green-400">
                  Create "{query}" as new entity
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
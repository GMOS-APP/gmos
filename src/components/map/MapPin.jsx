import React, { useState, useRef } from 'react';
import { MapPin as MapPinIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';

const colorClasses = {
  amber: 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]',
  rose: 'text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.6)]',
  blue: 'text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]',
  green: 'text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]',
  purple: 'text-purple-400 drop-shadow-[0_0_6px_rgba(196,181,253,0.6)]',
  cyan: 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]',
};

export default function MapPinMarker({ pin, entity, campaignId, onRemove, editMode }) {
  const [hovered, setHovered] = useState(false);

  const color = colorClasses[pin.color] || colorClasses.amber;
  const keyFacts = entity?.key_facts || [];
  const summary = entity?.summary || '';

  // Determine tooltip direction based on position
  const tooltipLeft = pin.x > 70;
  const tooltipTop = pin.y > 65;

  return (
    <div
      className="absolute"
      style={{
        left: `${pin.x}%`,
        top: `${pin.y}%`,
        transform: 'translate(-50%, -100%)',
        zIndex: hovered ? 50 : 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Remove button in edit mode */}
      {editMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(pin.entity_id); }}
          className="absolute -top-2 -right-2 z-20 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}

      {/* Pin icon */}
      <MapPinIcon className={cn('w-6 h-6 cursor-pointer transition-transform hover:scale-125', color)} />

      {/* Tooltip */}
      {hovered && entity && (
        <div
          className={cn(
            'absolute z-50 w-56 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl pointer-events-none',
            tooltipLeft ? 'right-7' : 'left-7',
            tooltipTop ? 'bottom-0' : 'top-0'
          )}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPinIcon className={cn('w-3 h-3', colorClasses[pin.color])} />
            <p className="text-xs font-semibold text-zinc-100 truncate">{entity.name}</p>
          </div>
          {summary && (
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">{summary}</p>
          )}
          {keyFacts.length > 0 && (
            <ul className="space-y-0.5">
              {keyFacts.slice(0, 4).map((fact, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px] text-zinc-500">
                  <span className="text-zinc-700 mt-0.5">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 pt-2 border-t border-zinc-800">
            <a
              href={createPageUrl('EntityDetail') + `?campaign_id=${campaignId}&id=${entity.id}`}
              className="text-[10px] text-amber-400 hover:text-amber-300 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              View full details →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
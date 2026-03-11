import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const COLORS = ['amber', 'rose', 'blue', 'green', 'purple', 'cyan'];
const colorDots = {
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  blue: 'bg-blue-400',
  green: 'bg-green-400',
  purple: 'bg-purple-400',
  cyan: 'bg-cyan-400',
};

export default function PinLocationPicker({ locations, pinnedIds, onPick, pendingColor, onColorChange }) {
  const [search, setSearch] = useState('');

  const available = locations.filter(
    (l) => !pinnedIds.has(l.id) &&
      (search === '' || l.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-56 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-3 border-b border-zinc-800">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">Click map to place</p>
        <div className="flex gap-1.5 flex-wrap mb-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className={cn('w-4 h-4 rounded-full transition-transform', colorDots[c],
                pendingColor === c ? 'ring-2 ring-white scale-125' : 'opacity-60 hover:opacity-100'
              )}
            />
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="pl-7 h-7 text-xs bg-zinc-950 border-zinc-800 text-zinc-200"
          />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {available.length === 0 ? (
          <p className="text-xs text-zinc-600 p-3 text-center">No locations to pin</p>
        ) : (
          available.map((loc) => (
            <button
              key={loc.id}
              onClick={() => onPick(loc)}
              className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-zinc-800/60 group"
            >
              <MapPin className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-300 group-hover:text-zinc-100 truncate">{loc.name}</p>
                {loc.summary && (
                  <p className="text-[10px] text-zinc-600 truncate">{loc.summary}</p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export default function PrepInfoPanel({ session }) {
  const [openSections, setOpenSections] = useState({
    recap: true,
    strongStart: false,
    npc: false,
    monsters: false,
    locations: false,
    rumors: false,
    treasure: false,
  });

  const toggle = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderSection = (title, content, key) => {
    if (!content) return null;
    
    return (
      <Collapsible key={key} open={openSections[key]} onOpenChange={() => toggle(key)}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg dark:hover:bg-zinc-800/50 hover:bg-gray-100 dark:border dark:border-zinc-800/40 border border-gray-300 transition-colors">
          <ChevronDown className={`w-4 h-4 transition-transform dark:text-zinc-500 text-gray-600 ${openSections[key] ? 'rotate-180' : ''}`} />
          <span className="text-xs font-semibold dark:text-zinc-400 text-gray-700 uppercase tracking-widest">{title}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 p-3 rounded-lg dark:bg-zinc-900/30 dark:border dark:border-zinc-800/40 bg-gray-50 border border-gray-300">
          <p className="text-sm dark:text-zinc-300 text-gray-900 whitespace-pre-wrap leading-relaxed">{content}</p>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-2 mb-6 pb-6 dark:border-b dark:border-zinc-800/40 border-b border-gray-300">
      <p className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-widest font-semibold px-3">Prep Overview</p>
      <div className="space-y-2">
        {renderSection('Previous Session Recap', session?.previous_session_recap, 'recap')}
        {renderSection('Strong Start', session?.strong_start, 'strongStart')}
        {renderSection('NPC Notes', session?.npc_notes, 'npc')}
        {renderSection('Monster Notes', session?.monster_notes, 'monsters')}
        {renderSection('Location Notes', session?.location_notes, 'locations')}
        {renderSection('Rumors', session?.rumors, 'rumors')}
        {renderSection('Treasure & Rewards', session?.treasure_notes, 'treasure')}
      </div>
    </div>
  );
}
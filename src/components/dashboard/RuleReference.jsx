import React, { useState } from 'react';
import { BookOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { useCampaign } from '@/lib/CampaignContext';

const CONDITIONS = [
  { name: 'Blinded', desc: "Can't see. Attacks against you have advantage; your attacks have disadvantage." },
  { name: 'Charmed', desc: "Can't attack the charmer. Charmer has advantage on social ability checks against you." },
  { name: 'Deafened', desc: "Can't hear. Automatically fail hearing-based Perception checks." },
  { name: 'Exhaustion', desc: 'Lvl 1: disadv. checks. Lvl 2: speed halved. Lvl 3: disadv. attacks & saves. Lvl 4: HP max halved. Lvl 5: speed 0. Lvl 6: death.' },
  { name: 'Frightened', desc: "Disadv. on ability checks & attacks while source is visible. Can't move closer to source." },
  { name: 'Grappled', desc: "Speed becomes 0. Ends if grappler is incapacitated or you're moved beyond their reach." },
  { name: 'Incapacitated', desc: "Can't take actions or reactions." },
  { name: 'Invisible', desc: 'Impossible to see without magic. Attacks against you have disadvantage; your attacks have advantage.' },
  { name: 'Paralyzed', desc: "Incapacitated. Fail STR & DEX saves. Attacks auto-crit from within 5 ft." },
  { name: 'Petrified', desc: 'Turned to stone. Incapacitated, unaware of surroundings. Resist all damage, immune poison & disease.' },
  { name: 'Poisoned', desc: 'Disadvantage on attack rolls and ability checks.' },
  { name: 'Prone', desc: 'Moving costs double. Melee attacks within 5 ft have advantage; all other attacks have disadvantage.' },
  { name: 'Restrained', desc: 'Speed 0. Attacks against have advantage; your attacks have disadvantage. Disadv. on DEX saves.' },
  { name: 'Stunned', desc: "Incapacitated. Fail STR & DEX saves. Attacks against you have advantage." },
  { name: 'Unconscious', desc: "Incapacitated, drops everything, falls prone. Attacks auto-crit from within 5 ft." },
];

const DC_SCALE = [
  { dc: 5,  label: 'Very Easy',  color: 'text-emerald-400' },
  { dc: 10, label: 'Easy',       color: 'text-green-400' },
  { dc: 15, label: 'Medium',     color: 'text-amber-400' },
  { dc: 20, label: 'Hard',       color: 'text-orange-400' },
  { dc: 25, label: 'Very Hard',  color: 'text-red-400' },
  { dc: 30, label: 'Impossible', color: 'text-rose-600' },
];

function CollapsibleCondition({ condition }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} className="w-full text-left">
      <div className="flex items-center gap-1.5 py-1 hover:text-zinc-200 transition-colors">
        {open
          ? <ChevronDown className="w-3 h-3 flex-shrink-0 text-zinc-500" />
          : <ChevronRight className="w-3 h-3 flex-shrink-0 text-zinc-500" />
        }
        <span className="text-xs font-semibold text-zinc-300">{condition.name}</span>
      </div>
      {open && (
        <p className="text-[11px] text-zinc-500 pl-4 pb-1.5 leading-relaxed text-left">{condition.desc}</p>
      )}
    </button>
  );
}

export default function RuleReference() {
  const { system } = useCampaign();
  const [activeTab, setActiveTab] = useState('conditions');

  if (!system.hasSrdConditions) return null;

  const tabs = [
    { id: 'conditions', label: 'Conditions' },
    { id: 'dc',         label: 'DC Scale' },
    { id: 'cover',      label: 'Cover' },
  ];

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Quick Rules</h3>
      </div>

      <div className="flex gap-1 mb-3 bg-zinc-800/50 rounded-lg p-1 flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 text-[11px] font-medium py-1 rounded-md transition-colors ${
              activeTab === t.id ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto flex-1">
        {activeTab === 'conditions' && (
          <div className="space-y-0.5">
            {CONDITIONS.map((c) => <CollapsibleCondition key={c.name} condition={c} />)}
          </div>
        )}

        {activeTab === 'dc' && (
          <div className="space-y-2.5 py-1">
            {DC_SCALE.map((d) => (
              <div key={d.dc} className="flex items-center gap-3">
                <span className={`text-xl font-bold w-8 tabular-nums ${d.color}`}>{d.dc}</span>
                <div>
                  <p className="text-xs font-medium text-zinc-300">{d.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'cover' && (
          <div className="space-y-3 text-xs text-zinc-400 leading-relaxed py-1">
            <div>
              <p className="font-semibold text-zinc-200 mb-1">Half Cover <span className="text-amber-400 font-bold">+2 AC & DEX saves</span></p>
              <p>Low wall, large creature, thick tree trunk blocks half your body.</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-200 mb-1">Three-Quarters Cover <span className="text-orange-400 font-bold">+5 AC & DEX saves</span></p>
              <p>Portcullis, arrow slit, thick tree — most of your body is blocked.</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-200 mb-1">Total Cover <span className="text-red-400 font-bold">Can't be targeted</span></p>
              <p>Completely behind obstacle. Cannot be targeted by attacks or spells — AoE can still reach.</p>
            </div>
            <div className="pt-2 border-t border-zinc-800">
              <p className="font-semibold text-zinc-200 mb-1">Hiding</p>
              <p>Needs heavy obscurement or solid cover. Roll Stealth vs. Passive Perception. Revealed by: attacking, casting a spell, or moving out of cover.</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-zinc-600 mt-2 flex-shrink-0">
        <a href="https://dnd.wizards.com/resources/systems-reference-document" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 underline underline-offset-2">D&amp;D SRD 5.1</a>
        {' · © Wizards of the Coast LLC · '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 underline underline-offset-2">CC BY 4.0</a>
      </p>
    </div>
  );
}
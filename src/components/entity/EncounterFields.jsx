import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCampaign } from '@/lib/CampaignContext';

// D&D 5e XP thresholds per character level [Easy, Medium, Hard, Deadly]
const XP_THRESHOLDS = {
  1:  [25,   50,   75,   100],  2:  [50,   100,  150,  200],
  3:  [75,   150,  225,  400],  4:  [125,  250,  375,  500],
  5:  [250,  500,  750,  1100], 6:  [300,  600,  900,  1400],
  7:  [350,  750,  1100, 1700], 8:  [450,  900,  1400, 2100],
  9:  [550,  1100, 1600, 2400], 10: [600,  1200, 1900, 2800],
  11: [800,  1600, 2400, 3600], 12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100], 14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400], 16: [1600, 3200, 4800, 7200],
  17: [2000, 3900, 5900, 8800], 18: [2100, 4200, 6300, 9500],
  19: [2400, 4900, 7300, 10900],20: [2800, 5700, 8500, 12700],
};

// CR to XP
const CR_XP = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
  '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
  '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
  '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
  '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
  '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
};

const CR_LIST = ['0','1/8','1/4','1/2','1','2','3','4','5','6','7','8','9','10',
  '11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30'];

function getMultiplier(count) {
  if (count === 1) return 1;
  if (count === 2) return 1.5;
  if (count <= 6)  return 2;
  if (count <= 10) return 2.5;
  if (count <= 14) return 3;
  return 4;
}

function fmt(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function EncounterBalancer() {
  const [open, setOpen] = useState(false);
  const [partySize, setPartySize] = useState('4');
  const [partyLevel, setPartyLevel] = useState('5');
  const [monsters, setMonsters] = useState([{ cr: '3', count: '1' }]);

  const level = parseInt(partyLevel) || 1;
  const size  = parseInt(partySize)  || 1;
  const thresholds = XP_THRESHOLDS[Math.min(20, Math.max(1, level))] || XP_THRESHOLDS[1];

  const partyThresholds = thresholds.map(t => t * size);

  const rawXP = monsters.reduce((sum, m) => {
    const xp  = CR_XP[m.cr] || 0;
    const cnt = parseInt(m.count) || 1;
    return sum + xp * cnt;
  }, 0);

  const totalMonsters = monsters.reduce((s, m) => s + (parseInt(m.count) || 1), 0);
  const multiplier    = getMultiplier(totalMonsters);
  const adjustedXP    = Math.round(rawXP * multiplier);

  const difficulty =
    adjustedXP < partyThresholds[0] ? { label: 'Trivial',  color: 'text-zinc-400' } :
    adjustedXP < partyThresholds[1] ? { label: 'Easy',     color: 'text-emerald-400' } :
    adjustedXP < partyThresholds[2] ? { label: 'Medium',   color: 'text-yellow-400' } :
    adjustedXP < partyThresholds[3] ? { label: 'Hard',     color: 'text-orange-400' } :
                                       { label: 'Deadly',   color: 'text-red-400' };

  const addMonster   = () => setMonsters(m => [...m, { cr: '1', count: '1' }]);
  const removeMonster = (i) => setMonsters(m => m.filter((_, idx) => idx !== i));
  const updateMonster = (i, key, val) => setMonsters(m => m.map((mon, idx) => idx === i ? { ...mon, [key]: val } : mon));

  return (
    <div className="md:col-span-2 mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest dark:text-zinc-500 text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-700 transition-colors mb-2"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        XP Budget Calculator
      </button>

      {open && (
        <div className="rounded-lg dark:bg-zinc-900/60 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 p-3 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-widest dark:text-zinc-500 text-zinc-500 font-semibold block mb-1">Party Size</label>
              <Input value={partySize} onChange={e => setPartySize(e.target.value)} type="number" min={1} max={10}
                className="h-8 text-xs bg-zinc-900/60 border-zinc-800 text-zinc-200" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-widest dark:text-zinc-500 text-zinc-500 font-semibold block mb-1">Avg Level</label>
              <Input value={partyLevel} onChange={e => setPartyLevel(e.target.value)} type="number" min={1} max={20}
                className="h-8 text-xs bg-zinc-900/60 border-zinc-800 text-zinc-200" />
            </div>
          </div>

          {/* XP thresholds */}
          <div className="grid grid-cols-4 gap-1 text-center">
            {['Easy', 'Medium', 'Hard', 'Deadly'].map((label, i) => (
              <div key={label} className="rounded dark:bg-zinc-800/60 bg-zinc-100 px-1.5 py-1">
                <p className="text-[9px] uppercase tracking-wider dark:text-zinc-500 text-zinc-500">{label}</p>
                <p className="text-xs font-mono font-semibold dark:text-zinc-300 text-zinc-700">{fmt(partyThresholds[i])}</p>
              </div>
            ))}
          </div>

          {/* Monsters */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest dark:text-zinc-500 text-zinc-500 font-semibold block">Monsters</label>
            {monsters.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Select value={m.cr} onValueChange={v => updateMonster(i, 'cr', v)}>
                  <SelectTrigger className="flex-1 h-7 text-xs bg-zinc-900/60 border-zinc-800 text-zinc-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 max-h-48">
                    {CR_LIST.map(cr => <SelectItem key={cr} value={cr} className="text-zinc-300 text-xs">CR {cr} ({fmt(CR_XP[cr])} XP)</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-xs dark:text-zinc-500 text-zinc-500">×</span>
                <Input value={m.count} onChange={e => updateMonster(i, 'count', e.target.value)} type="number" min={1}
                  className="w-14 h-7 text-xs bg-zinc-900/60 border-zinc-800 text-zinc-200" />
                <button onClick={() => removeMonster(i)} className="dark:text-zinc-600 text-zinc-400 hover:dark:text-red-400 hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={addMonster} className="flex items-center gap-1 text-xs dark:text-zinc-600 text-zinc-400 hover:dark:text-amber-400 hover:text-amber-500 transition-colors">
              <Plus className="w-3 h-3" /> Add monster
            </button>
          </div>

          {/* Result */}
          {rawXP > 0 && (
            <div className="flex items-center justify-between pt-2 border-t dark:border-zinc-800 border-zinc-200">
              <div className="text-xs dark:text-zinc-500 text-zinc-500">
                {fmt(rawXP)} XP × {multiplier} = <span className="dark:text-zinc-300 text-zinc-700 font-semibold">{fmt(adjustedXP)} XP</span>
              </div>
              <span className={cn('text-sm font-bold', difficulty.color)}>{difficulty.label}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <EntityMentionTextarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 resize-none"
    />
  );
}

function SectionDivider({ label }) {
  return (
    <div className="md:col-span-2 flex items-center gap-3 pt-3">
      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

const DIFFICULTIES = ['Trivial', 'Easy', 'Medium', 'Hard', 'Deadly'];

export default function EncounterFields({ extraData, onChange }) {
  const { system } = useCampaign();
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Overview" />
      <Field label="Difficulty">
        <Select value={get('difficulty')} onValueChange={(v) => set('difficulty', v)}>
          <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-700 text-sm h-9 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
          <SelectContent className="bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            {DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="text-zinc-300 text-xs">{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      {system.hasXpCrSystem && (
        <Field label="XP Budget"><TextInput value={get('xp')} onChange={(v) => set('xp', v)} placeholder="e.g. 1,800 XP" /></Field>
      )}

      <SectionDivider label="Setup" />
      <div className="md:col-span-2"><Field label="Enemy Composition"><TextArea value={get('enemies')} onChange={(v) => set('enemies', v)} placeholder="What enemies? How many? Variants?" /></Field></div>
      <div className="md:col-span-2"><Field label="Terrain & Environment"><TextArea value={get('terrain')} onChange={(v) => set('terrain', v)} placeholder="Where does this take place? Environmental hazards, features?" /></Field></div>
      <div className="md:col-span-2"><Field label="Enemy Tactics"><TextArea value={get('tactics')} onChange={(v) => set('tactics', v)} placeholder="How do enemies fight? Morale? Retreat conditions?" /></Field></div>

      {system.hasXpCrSystem && <EncounterBalancer />}

      <SectionDivider label="Presentation" />
      <div className="md:col-span-2"><Field label="Read-Aloud Description"><TextArea value={get('read_aloud')} onChange={(v) => set('read_aloud', v)} placeholder="The text you read to players when the encounter begins..." /></Field></div>
      <div className="md:col-span-2"><Field label="Treasure & Rewards"><TextArea value={get('treasure')} onChange={(v) => set('treasure', v)} placeholder="Loot, magic items, information rewards..." /></Field></div>
    </div>
  );
}
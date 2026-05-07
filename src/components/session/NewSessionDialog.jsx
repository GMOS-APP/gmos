import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Session, Campaign } from '@/api/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import { Wand2, PenLine, ChevronRight, ChevronLeft, Plus, X, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const WIZARD_STEPS = ['Basics', 'Goals', 'Opening', 'Scenes'];

const LAZY_STEPS = [
  { title: 'Basics',         hint: null },
  { title: 'Characters',     hint: 'Review your player characters. What do they want to accomplish? Any arcs, backstory hooks, or desires to weave into this session?' },
  { title: 'Strong Start',   hint: 'How does the session open? Start in the middle of the action — when in doubt, start with a fight.' },
  { title: 'Scenes',         hint: 'A few scenes that might develop during play. Expect 1–2 scenes per hour. Be ready to throw these away.' },
  { title: 'Secrets & Clues', hint: 'Short sentences describing discoverable information. Keep them abstract from where they\'re found. Aim for ~10.' },
  { title: 'Locations',      hint: 'Evocative locations with a short title and 3 fantastic aspects each. Prepped locations can appear in future sessions too.' },
  { title: 'NPCs',           hint: 'Name, their connection to the adventure, and a character archetype. Only prep those critical to the story.' },
  { title: 'Monsters',       hint: 'Creatures appropriate to the locations and situations. Consider the relationship between CR and character level.' },
  { title: 'Rewards',        hint: 'Magic items that impact characters and deliver story. Mix random picks with choices tied to character desires.' },
];

const EMPTY_FORM = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  session_goals: [],
  strong_start: '',
  potential_scenes: [],
  secrets_and_clues: [],
  location_notes: '',
  npc_notes: '',
  monster_notes: '',
  treasure_notes: '',
};

export default function NewSessionDialog({ open, onClose, campaignId, campaign }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null); // null | 'lazy' | 'wizard' | 'manual'
  const [step, setStep] = useState(0);
  const nextSessionNum = (campaign?.current_session_number || 0) + 1;

  const [form, setForm] = useState(EMPTY_FORM);
  const [goalInput, setGoalInput] = useState('');
  const [sceneInput, setSceneInput] = useState('');
  const [clueInput, setClueInput] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const session = await Session.create({
        campaign_id: campaignId,
        session_number: nextSessionNum,
        status: 'planned',
        title: form.title || `Session ${nextSessionNum}`,
        date: form.date,
        session_goals: form.session_goals.map(t => ({ text: t, completed: false })),
        strong_start: form.strong_start,
        potential_scenes: form.potential_scenes,
        secrets_and_clues: form.secrets_and_clues,
        location_notes: form.location_notes,
        npc_notes: form.npc_notes,
        monster_notes: form.monster_notes,
        treasure_notes: form.treasure_notes,
      });
      await Campaign.update(campaignId, { current_session_number: nextSessionNum });
      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries();
      navigate(createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${session.id}`);
      handleClose();
    },
    onError: (err) => {
      console.error('Failed to create session:', err);
    },
  });

  const handleClose = () => {
    setMode(null);
    setStep(0);
    setForm(EMPTY_FORM);
    setGoalInput('');
    setSceneInput('');
    setClueInput('');
    onClose();
  };

  const addGoal = () => {
    if (!goalInput.trim()) return;
    setForm(f => ({ ...f, session_goals: [...f.session_goals, goalInput.trim()] }));
    setGoalInput('');
  };

  const addScene = () => {
    if (!sceneInput.trim()) return;
    setForm(f => ({ ...f, potential_scenes: [...f.potential_scenes, sceneInput.trim()] }));
    setSceneInput('');
  };

  const addClue = () => {
    if (!clueInput.trim()) return;
    setForm(f => ({ ...f, secrets_and_clues: [...f.secrets_and_clues, clueInput.trim()] }));
    setClueInput('');
  };

  // ── Mode selection ────────────────────────────────────────────────
  if (!mode) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-100">New Session #{nextSessionNum}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <ModeCard
              onClick={() => setMode('lazy')}
              icon={<BookOpen className="w-5 h-5 text-emerald-400" />}
              iconBg="bg-emerald-500/10 group-hover:bg-emerald-500/20"
              border="dark:hover:border-emerald-500/50 hover:border-emerald-400 dark:hover:bg-emerald-500/5 hover:bg-emerald-50"
              label="Lazy RPG Prep"
              desc="8-step guided prep — the Sly Flourish method"
            />
            <ModeCard
              onClick={() => setMode('wizard')}
              icon={<Wand2 className="w-5 h-5 text-amber-500" />}
              iconBg="bg-amber-500/10 group-hover:bg-amber-500/20"
              border="dark:hover:border-amber-500/50 hover:border-amber-400 dark:hover:bg-amber-500/5 hover:bg-amber-50"
              label="Quick Wizard"
              desc="4-step guided setup — goals, opening, scenes"
            />
            <ModeCard
              onClick={() => navigate(createPageUrl('SessionPage') + `?id=${campaignId}&new=true`)}
              icon={<PenLine className="w-5 h-5 dark:text-zinc-400 text-zinc-600" />}
              iconBg="dark:bg-zinc-800 bg-zinc-100 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
              border="dark:hover:border-zinc-500 hover:border-zinc-400 dark:hover:bg-zinc-800/50 hover:bg-zinc-50"
              label="Manual"
              desc="Open a blank session"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Lazy RPG Prep wizard ──────────────────────────────────────────
  if (mode === 'lazy') {
    const totalSteps = LAZY_STEPS.length;
    const { title: stepTitle, hint } = LAZY_STEPS[step];
    const isLast = step === totalSteps - 1;

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider mb-0.5">Lazy RPG Prep · Step {step + 1}/{totalSteps}</p>
                <DialogTitle className="dark:text-zinc-100">{stepTitle}</DialogTitle>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {LAZY_STEPS.map((_, i) => (
                  <div key={i} className={cn("h-1.5 rounded-full transition-all", i < step ? "w-4 bg-emerald-500" : i === step ? "w-6 bg-emerald-400" : "w-4 dark:bg-zinc-700 bg-zinc-200")} />
                ))}
              </div>
            </div>
          </DialogHeader>

          <div className="mt-2 space-y-4 min-h-[220px]">
            {hint && <p className="text-xs dark:text-zinc-500 text-zinc-500 leading-relaxed">{hint}</p>}

            {/* Step 0: Basics */}
            {step === 0 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium dark:text-zinc-400 text-zinc-600 mb-1.5 block">Session Title</label>
                  <Input placeholder={`Session ${nextSessionNum}`} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" />
                </div>
                <div>
                  <label className="text-xs font-medium dark:text-zinc-400 text-zinc-600 mb-1.5 block">Planned Date</label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" />
                </div>
              </div>
            )}

            {/* Step 1: Characters → session goals */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Add a player goal or arc..." value={goalInput} onChange={e => setGoalInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGoal()} className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" />
                  <Button size="icon" variant="outline" onClick={addGoal} className="dark:border-zinc-700 flex-shrink-0"><Plus className="w-4 h-4" /></Button>
                </div>
                <ItemList items={form.session_goals} onRemove={i => setForm(f => ({ ...f, session_goals: f.session_goals.filter((_, j) => j !== i) }))} empty="No goals yet" />
              </div>
            )}

            {/* Step 2: Strong Start */}
            {step === 2 && (
              <EntityMentionTextarea
                placeholder="The players find themselves..."
                value={form.strong_start}
                onChange={v => setForm(f => ({ ...f, strong_start: v }))}
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 h-36 resize-none"
              />
            )}

            {/* Step 3: Scenes */}
            {step === 3 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Add a scene..." value={sceneInput} onChange={e => setSceneInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addScene()} className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" />
                  <Button size="icon" variant="outline" onClick={addScene} className="dark:border-zinc-700 flex-shrink-0"><Plus className="w-4 h-4" /></Button>
                </div>
                <ItemList items={form.potential_scenes} onRemove={i => setForm(f => ({ ...f, potential_scenes: f.potential_scenes.filter((_, j) => j !== i) }))} empty="No scenes yet" />
              </div>
            )}

            {/* Step 4: Secrets & Clues */}
            {step === 4 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Add a secret or clue..." value={clueInput} onChange={e => setClueInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addClue()} className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" />
                  <Button size="icon" variant="outline" onClick={addClue} className="dark:border-zinc-700 flex-shrink-0"><Plus className="w-4 h-4" /></Button>
                </div>
                <ItemList items={form.secrets_and_clues} onRemove={i => setForm(f => ({ ...f, secrets_and_clues: f.secrets_and_clues.filter((_, j) => j !== i) }))} empty="No secrets yet" />
              </div>
            )}

            {/* Step 5: Locations */}
            {step === 5 && (
              <EntityMentionTextarea
                placeholder={"Ruined Watchtower\n• Crumbling walls draped in bioluminescent moss\n• A shattered scrying mirror reflecting another place\n• Whispered voices from beneath the flagstones\n\nAdd more locations below..."}
                value={form.location_notes}
                onChange={v => setForm(f => ({ ...f, location_notes: v }))}
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 h-40 resize-none"
              />
            )}

            {/* Step 6: NPCs */}
            {step === 6 && (
              <EntityMentionTextarea
                placeholder={"Seraphine — the exiled court mage, seeking redemption (the reluctant mentor)\nThane Voss — blacksmith and secret fence, nervous around strangers\n\nAdd more NPCs below..."}
                value={form.npc_notes}
                onChange={v => setForm(f => ({ ...f, npc_notes: v }))}
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 h-40 resize-none"
              />
            )}

            {/* Step 7: Monsters */}
            {step === 7 && (
              <EntityMentionTextarea
                placeholder={"CR 3 — Manticore (ambush in the foothills)\nCR 1/2 — Cultists ×6 (ritual chamber, panicked)\nCR 5 — Werewolf champion (boss, lair in the mill)\n\nAdd more monsters below..."}
                value={form.monster_notes}
                onChange={v => setForm(f => ({ ...f, monster_notes: v }))}
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 h-40 resize-none"
              />
            )}

            {/* Step 8: Rewards */}
            {step === 8 && (
              <EntityMentionTextarea
                placeholder={"Cloak of Elvenkind — hidden in the watchtower, ties to Seraphine's past\n+1 Handaxe — mundane reward, but the inscription is a clue\n\nAdd more rewards below..."}
                value={form.treasure_notes}
                onChange={v => setForm(f => ({ ...f, treasure_notes: v }))}
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 h-40 resize-none"
              />
            )}
          </div>

          <div className="flex justify-between mt-4 pt-4 border-t dark:border-zinc-800 border-zinc-200">
            <Button variant="ghost" size="sm" onClick={() => step === 0 ? setMode(null) : setStep(s => s - 1)} className="dark:text-zinc-400">
              <ChevronLeft className="w-4 h-4 mr-1" />
              {step === 0 ? 'Back' : 'Previous'}
            </Button>
            {!isLast ? (
              <Button size="sm" onClick={() => setStep(s => s + 1)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                Create Session
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Quick Wizard ──────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="dark:text-zinc-100">Session #{nextSessionNum} — {WIZARD_STEPS[step]}</DialogTitle>
            <div className="flex gap-1">
              {WIZARD_STEPS.map((_, i) => (
                <div key={i} className={cn("w-6 h-1.5 rounded-full transition-colors", i <= step ? "bg-amber-500" : "dark:bg-zinc-700 bg-zinc-200")} />
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-4 min-h-[200px]">
          {step === 0 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium dark:text-zinc-400 text-zinc-600 mb-1.5 block">Session Title</label>
                <Input placeholder={`Session ${nextSessionNum}`} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" />
              </div>
              <div>
                <label className="text-xs font-medium dark:text-zinc-400 text-zinc-600 mb-1.5 block">Planned Date</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs dark:text-zinc-500 text-zinc-500">What should the players accomplish this session?</p>
              <div className="flex gap-2">
                <Input placeholder="Add a goal..." value={goalInput} onChange={e => setGoalInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGoal()} className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" />
                <Button size="icon" variant="outline" onClick={addGoal} className="dark:border-zinc-700 flex-shrink-0"><Plus className="w-4 h-4" /></Button>
              </div>
              <ItemList items={form.session_goals} onRemove={i => setForm(f => ({ ...f, session_goals: f.session_goals.filter((_, j) => j !== i) }))} empty="No goals yet" />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs dark:text-zinc-500 text-zinc-500">How does the session open? Start in the middle of the action.</p>
              <EntityMentionTextarea placeholder="The players find themselves..." value={form.strong_start} onChange={v => setForm(f => ({ ...f, strong_start: v }))} className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 h-32 resize-none" />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs dark:text-zinc-500 text-zinc-500">Brief outline of scenes that might occur.</p>
              <div className="flex gap-2">
                <Input placeholder="Add a scene..." value={sceneInput} onChange={e => setSceneInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addScene()} className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200" />
                <Button size="icon" variant="outline" onClick={addScene} className="dark:border-zinc-700 flex-shrink-0"><Plus className="w-4 h-4" /></Button>
              </div>
              <ItemList items={form.potential_scenes} onRemove={i => setForm(f => ({ ...f, potential_scenes: f.potential_scenes.filter((_, j) => j !== i) }))} empty="No scenes yet" />
            </div>
          )}
        </div>

        <div className="flex justify-between mt-4 pt-4 border-t dark:border-zinc-800 border-zinc-200">
          <Button variant="ghost" size="sm" onClick={() => step === 0 ? setMode(null) : setStep(s => s - 1)} className="dark:text-zinc-400">
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 0 ? 'Back' : 'Previous'}
          </Button>
          {step < WIZARD_STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Create Session
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeCard({ onClick, icon, iconBg, border, label, desc }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 w-full px-4 py-3.5 rounded-xl border-2 dark:border-zinc-700 border-zinc-200 transition-all group text-left",
        border
      )}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors", iconBg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm dark:text-zinc-200 text-zinc-900">{label}</p>
        <p className="text-xs dark:text-zinc-500 text-zinc-500 mt-0.5">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 dark:text-zinc-600 text-zinc-400 flex-shrink-0" />
    </button>
  );
}

function ItemList({ items, onRemove, empty }) {
  if (items.length === 0) {
    return <p className="text-xs dark:text-zinc-600 text-zinc-400 text-center py-4">{empty}</p>;
  }
  return (
    <div className="space-y-1.5 max-h-40 overflow-y-auto">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg dark:bg-zinc-800/50 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200">
          <span className="flex-1 text-sm dark:text-zinc-300 text-zinc-700">{item}</span>
          <button onClick={() => onRemove(i)} className="dark:text-zinc-600 text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

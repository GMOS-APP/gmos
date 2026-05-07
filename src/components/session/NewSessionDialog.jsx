import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Session, Campaign } from '@/api/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import { Wand2, PenLine, ChevronRight, ChevronLeft, Plus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Basics', 'Goals', 'Opening', 'Scenes'];

export default function NewSessionDialog({ open, onClose, campaignId, campaign }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null); // null | 'wizard' | 'manual'
  const [step, setStep] = useState(0);
  const nextSessionNum = (campaign?.current_session_number || 0) + 1;

  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    session_goals: [],
    strong_start: '',
    potential_scenes: [],
    secrets_and_clues: [],
  });
  const [goalInput, setGoalInput] = useState('');
  const [sceneInput, setSceneInput] = useState('');

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
      });
      await Campaign.update(campaignId, { current_session_number: nextSessionNum });
      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries();
      navigate(createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${session.id}`);
      handleClose();
    },
  });

  const handleClose = () => {
    setMode(null);
    setStep(0);
    setForm({ title: '', date: new Date().toISOString().split('T')[0], session_goals: [], strong_start: '', potential_scenes: [], secrets_and_clues: [] });
    setGoalInput('');
    setSceneInput('');
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

  // Mode selection screen
  if (!mode) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-100">New Session #{nextSessionNum}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => setMode('wizard')}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 dark:border-zinc-700 border-zinc-200 dark:hover:border-amber-500/50 hover:border-amber-400 dark:hover:bg-amber-500/5 hover:bg-amber-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Wand2 className="w-6 h-6 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm dark:text-zinc-200 text-zinc-900">Wizard</p>
                <p className="text-xs dark:text-zinc-500 text-zinc-500 mt-0.5">Step-by-step guided setup</p>
              </div>
            </button>
            <button
              onClick={() => navigate(createPageUrl('SessionPage') + `?id=${campaignId}&new=true`)}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 dark:border-zinc-700 border-zinc-200 dark:hover:border-zinc-500 hover:border-zinc-400 dark:hover:bg-zinc-800/50 hover:bg-zinc-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl dark:bg-zinc-800 bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                <PenLine className="w-6 h-6 dark:text-zinc-400 text-zinc-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm dark:text-zinc-200 text-zinc-900">Manual</p>
                <p className="text-xs dark:text-zinc-500 text-zinc-500 mt-0.5">Open blank session</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Wizard
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="dark:text-zinc-100">Session #{nextSessionNum} — {STEPS[step]}</DialogTitle>
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={cn("w-6 h-1.5 rounded-full transition-colors", i <= step ? "bg-amber-500" : "dark:bg-zinc-700 bg-zinc-200")} />
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-4 min-h-[200px]">

          {/* Step 0: Basics */}
          {step === 0 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium dark:text-zinc-400 text-zinc-600 mb-1.5 block">Session Title</label>
                <Input
                  placeholder={`Session ${nextSessionNum}`}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium dark:text-zinc-400 text-zinc-600 mb-1.5 block">Planned Date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                />
              </div>
            </div>
          )}

          {/* Step 1: Goals */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs dark:text-zinc-500 text-zinc-500">What should the players accomplish this session?</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a goal..."
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGoal()}
                  className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                />
                <Button size="icon" variant="outline" onClick={addGoal} className="dark:border-zinc-700 flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {form.session_goals.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg dark:bg-zinc-800/50 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200">
                    <span className="flex-1 text-sm dark:text-zinc-300 text-zinc-700">{g}</span>
                    <button onClick={() => setForm(f => ({ ...f, session_goals: f.session_goals.filter((_, j) => j !== i) }))} className="dark:text-zinc-600 text-zinc-400 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {form.session_goals.length === 0 && <p className="text-xs dark:text-zinc-600 text-zinc-400 text-center py-4">No goals yet</p>}
              </div>
            </div>
          )}

          {/* Step 2: Strong Start */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs dark:text-zinc-500 text-zinc-500">How does the session open? Start in the middle of the action.</p>
              <EntityMentionTextarea
                placeholder="The players find themselves..."
                value={form.strong_start}
                onChange={(v) => setForm(f => ({ ...f, strong_start: v }))}
                className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 h-32 resize-none"
              />
            </div>
          )}

          {/* Step 3: Scenes */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs dark:text-zinc-500 text-zinc-500">Brief outline of scenes that might occur.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a scene..."
                  value={sceneInput}
                  onChange={e => setSceneInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addScene()}
                  className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                />
                <Button size="icon" variant="outline" onClick={addScene} className="dark:border-zinc-700 flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {form.potential_scenes.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg dark:bg-zinc-800/50 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200">
                    <span className="flex-1 text-sm dark:text-zinc-300 text-zinc-700">{s}</span>
                    <button onClick={() => setForm(f => ({ ...f, potential_scenes: f.potential_scenes.filter((_, j) => j !== i) }))} className="dark:text-zinc-600 text-zinc-400 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {form.potential_scenes.length === 0 && <p className="text-xs dark:text-zinc-600 text-zinc-400 text-center py-4">No scenes yet</p>}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-between mt-4 pt-4 border-t dark:border-zinc-800 border-zinc-200">
          <Button variant="ghost" size="sm" onClick={() => step === 0 ? setMode(null) : setStep(s => s - 1)} className="dark:text-zinc-400">
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 0 ? 'Back' : 'Previous'}
          </Button>
          {step < STEPS.length - 1 ? (
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
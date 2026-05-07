import React, { useState, useEffect } from 'react';
import EntityMentionRenderer from '@/components/common/EntityMentionRenderer';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Session } from '@/api/entities';
import { useCampaign } from '@/lib/CampaignContext';
import { Button } from '@/components/ui/button';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Plus, X, CheckCircle2, Clock, CalendarDays } from 'lucide-react';

export default function SessionDebrief({ session, previousSession, notes = [], entities = [], campaignId }) {
  const { system } = useCampaign();
  const queryClient = useQueryClient();

  const [summary, setSummary] = useState(session?.summary || '');
  const [keyEvents, setKeyEvents] = useState(session?.key_events || []);
  const [nextPrimer, setNextPrimer] = useState(session?.next_session_primer || '');
  const [newEvent, setNewEvent] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    setSummary(session?.summary || '');
    setKeyEvents(session?.key_events || []);
    setNextPrimer(session?.next_session_primer || '');
  }, [session?.id]);

  const saveMutation = useMutation({
    mutationFn: () => Session.update(session.id, {
      summary,
      key_events: keyEvents,
      next_session_primer: nextPrimer,
      status: 'debriefed',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSaved(true);
      setSaveError(null);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => {
      setSaveError(err?.message || 'Save failed. Please try again.');
    },
  });

  const addEvent = () => {
    if (!newEvent.trim()) return;
    setKeyEvents((prev) => [...prev, newEvent.trim()]);
    setNewEvent('');
  };

  const removeEvent = (i) => setKeyEvents((prev) => prev.filter((_, idx) => idx !== i));

  const duration = session?.start_time && session?.end_time
    ? Math.round((new Date(session.end_time) - new Date(session.start_time)) / 60000)
    : null;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold dark:text-zinc-100 text-zinc-900">
            Session Debrief
          </h2>
          <div className="flex items-center gap-3 mt-1 text-xs dark:text-zinc-500 text-zinc-500">
            {session?.date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500">
          Session Summary
        </label>
        <EntityMentionTextarea
          value={summary}
          onChange={setSummary}
          placeholder="What happened this session? Write a narrative summary…"
          className="min-h-32 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 bg-zinc-50 border-zinc-200 resize-none"
        />
      </div>

      {/* Key Events */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500">
          Key Events
        </label>
        <div className="space-y-1.5">
          {keyEvents.map((ev, i) => (
            <div key={ev} className="flex items-start gap-2 group">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
              <span className="flex-1 text-sm dark:text-zinc-300 text-zinc-700">{ev}</span>
              <button
                onClick={() => removeEvent(i)}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEvent()}
            placeholder="Add a key event…"
            className="text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 bg-zinc-50 border-zinc-200 h-8"
          />
          <Button onClick={addEvent} size="sm" variant="outline" className="h-8 dark:border-zinc-700 dark:text-zinc-400">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Quick Notes Reference */}
      {notes.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500">
            Session Notes ({notes.length})
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {notes.map((n) => (
              <div key={n.id} className="px-3 py-2 rounded-lg dark:bg-zinc-900/50 dark:border dark:border-zinc-800/40 bg-zinc-50 border border-zinc-200">
                <EntityMentionRenderer text={n.content} entities={entities} campaignId={campaignId} className="text-xs dark:text-zinc-400 text-zinc-600 whitespace-pre-wrap" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Session Primer */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500">
          Next Session Primer
        </label>
        <EntityMentionTextarea
          value={nextPrimer}
          onChange={setNextPrimer}
          placeholder="Tease what's coming next session for your players…"
          className="min-h-20 text-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 bg-zinc-50 border-zinc-200 resize-none"
        />
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saveError && (
          <p className="text-xs text-red-500 dark:text-red-400">{saveError}</p>
        )}
        <Button
          onClick={() => { setSaveError(null); saveMutation.mutate(); }}
          disabled={saveMutation.isPending || saved}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? 'Saved!' : 'Save Debrief'}
        </Button>
      </div>
    </div>
  );
}
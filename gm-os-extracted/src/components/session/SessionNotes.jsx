import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import PrepInfoPanel from './PrepInfoPanel';
import AutoLinkerSuggestions from './AutoLinkerSuggestions';

export default function SessionNotes({ session, campaignId, entities }) {
  const [notes, setNotes] = useState(session?.raw_notes || '');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setNotes(session?.raw_notes || '');
  }, [session?.raw_notes]);

  const saveMutation = useMutation({
    mutationFn: (content) => base44.entities.Session.update(session.id, { raw_notes: content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      setLastSaved(new Date());
      setSaving(false);
    },
  });

  const handleSave = () => {
    setSaving(true);
    saveMutation.mutate(notes);
  };

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    const timer = setInterval(() => {
      if (notes !== session?.raw_notes && notes.trim()) {
        handleSave();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [notes, session?.raw_notes]);

  return (
    <div className="space-y-3">
      <PrepInfoPanel session={session} />
      
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
          Session Notes
        </label>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-zinc-600">
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || notes === session?.raw_notes}
            size="sm"
            variant="outline"
            className="border-zinc-800 text-zinc-500 hover:text-zinc-300"
          >
            {saving ? (
              <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-3 h-3 mr-1.5" /> Save</>
            )}
          </Button>
        </div>
      </div>
      
      <EntityMentionTextarea
        value={notes}
        onChange={setNotes}
        campaignId={campaignId || session?.campaign_id}
        placeholder="Record session details, player actions, key moments... Type @ to link a world entity"
        rows={18}
      />
      <AutoLinkerSuggestions notes={notes} entities={entities} session={session} />
    </div>
  );
}
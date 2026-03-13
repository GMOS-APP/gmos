import React from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Session, Campaign } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, PlayCircle, ChevronLeft } from 'lucide-react';

export default function SessionHeader({ formData, setFormData, saving, saved, handleSave, session, isRunMode, campaignId, sessionNum }) {
  const queryClient = useQueryClient();

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b dark:border-zinc-800/60 dark:bg-zinc-950/80 border-gray-200 bg-white/80 dark:backdrop-blur backdrop-blur flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to={createPageUrl('CampaignDashboard') + `?id=${campaignId}`}
          className="dark:text-zinc-600 dark:hover:text-zinc-300 text-gray-600 hover:text-gray-900 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <Input
          value={formData.title || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder={`Session #${sessionNum}`}
          className="bg-transparent border-0 dark:border-b dark:border-zinc-700 border-b border-gray-300 rounded-none px-0 text-sm font-semibold dark:text-zinc-200 dark:placeholder:text-zinc-600 text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:dark:border-amber-500/50 focus-visible:border-amber-600/50 w-28 sm:w-48"
        />
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          onClick={handleSave}
          disabled={saving || saved}
          size="sm"
          variant="outline"
          className="dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-gray-300 text-gray-700 hover:text-gray-900 text-xs"
        >
          {saving ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
          {saved ? 'Saved!' : 'Save'}
        </Button>
        {!isRunMode && session && (
          <Button
            onClick={async () => {
              await Session.update(session.id, { status: 'in_progress', start_time: new Date().toISOString() });
              await Campaign.update(campaignId, { active_mode: 'session' });
              queryClient.invalidateQueries();
            }}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-emerald-400/20 group-hover:scale-150 scale-0 transition-transform duration-500 rounded-md" />
            <PlayCircle className="w-3.5 h-3.5 mr-1" /> Start Session
          </Button>
        )}
        {isRunMode && (
          <Button
            onClick={async () => {
              await Session.update(session.id, { status: 'completed', end_time: new Date().toISOString() });
              await Campaign.update(campaignId, { active_mode: 'debrief' });
              queryClient.invalidateQueries();
            }}
            size="sm"
            variant="outline"
            className="dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/10 border-amber-600/40 text-amber-700 hover:bg-amber-50 text-xs"
          >
            End Session →
          </Button>
        )}
      </div>
    </div>
  );
}
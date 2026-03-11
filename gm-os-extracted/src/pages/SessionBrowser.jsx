import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CalendarDays, Plus, CheckCircle2, Clock, PlayCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import NewSessionDialog from '@/components/session/NewSessionDialog';

const STATUS_CONFIG = {
  planned:     { label: 'Planned',     icon: Clock,        color: 'dark:text-zinc-400 dark:bg-zinc-800 text-zinc-600 bg-zinc-200' },
  in_progress: { label: 'In Progress', icon: PlayCircle,   color: 'dark:text-emerald-400 dark:bg-emerald-500/10 text-emerald-700 bg-emerald-100' },
  completed:   { label: 'Completed',   icon: CheckCircle2, color: 'dark:text-blue-400 dark:bg-blue-500/10 text-blue-700 bg-blue-100' },
  debriefed:   { label: 'Debriefed',   icon: BookOpen,     color: 'dark:text-zinc-500 dark:bg-zinc-800 text-zinc-600 bg-zinc-200' },
};

export default function SessionBrowser() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id') || params.get('id');
  const [showNewDialog, setShowNewDialog] = useState(false);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => base44.entities.Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: d => d?.[0],
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: () => base44.entities.Session.filter({ campaign_id: campaignId }, '-session_number', 100),
    enabled: !!campaignId,
  });

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-zinc-100 text-gray-900">Sessions</h1>
          <p className="text-sm dark:text-zinc-500 text-gray-600 mt-1">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowNewDialog(true)} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
          <Plus className="w-4 h-4 mr-1.5" /> New Session
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl dark:bg-zinc-900/50 dark:border-zinc-800/50 bg-gray-100 border border-gray-300 animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays className="w-10 h-10 dark:text-zinc-700 text-gray-400 mx-auto mb-3" />
          <p className="dark:text-zinc-500 text-gray-600 text-sm">No sessions yet</p>
          <Button variant="outline" size="sm" onClick={() => setShowNewDialog(true)} className="mt-4 dark:border-zinc-700 dark:text-zinc-400 border-gray-300 text-gray-700">
              Start First Session
            </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.planned;
            const StatusIcon = statusCfg.icon;
            return (
              <Link
                key={s.id}
                to={createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${s.id}`}
                className="flex items-center gap-4 px-4 py-3 rounded-xl dark:bg-zinc-900/40 dark:border-zinc-800/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 bg-white border-gray-200 border hover:border-gray-300 hover:bg-gray-50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg dark:bg-zinc-800 dark:text-zinc-400 bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {s.session_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dark:text-zinc-200 dark:group-hover:text-amber-400 text-gray-900 group-hover:text-amber-600 transition-colors truncate">
                    {s.title || `Session ${s.session_number}`}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {s.date && (
                       <p className="text-xs dark:text-zinc-600 text-gray-500">
                         {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                       </p>
                     )}
                     {s.session_goals?.length > 0 && (
                       <p className="text-xs dark:text-zinc-600 text-gray-500">
                        {s.session_goals.filter(g => g.completed).length}/{s.session_goals.length} goals
                      </p>
                    )}
                  </div>
                </div>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1", statusCfg.color)}>
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
      <NewSessionDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        campaignId={campaignId}
        campaign={campaign}
      />
    </div>
  );
}
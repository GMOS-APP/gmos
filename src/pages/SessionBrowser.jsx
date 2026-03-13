import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Campaign, Session } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CalendarDays, List, Plus, CheckCircle2, Clock, PlayCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import NewSessionDialog from '@/components/session/NewSessionDialog';

const STATUS_CONFIG = {
  planned:     { label: 'Planned',     icon: Clock,        color: 'dark:text-zinc-400 dark:bg-zinc-800 text-zinc-600 bg-zinc-200' },
  in_progress: { label: 'In Progress', icon: PlayCircle,   color: 'dark:text-emerald-400 dark:bg-emerald-500/10 text-emerald-700 bg-emerald-100' },
  completed:   { label: 'Completed',   icon: CheckCircle2, color: 'dark:text-blue-400 dark:bg-blue-500/10 text-blue-700 bg-blue-100' },
  debriefed:   { label: 'Debriefed',   icon: BookOpen,     color: 'dark:text-zinc-500 dark:bg-zinc-800 text-zinc-600 bg-zinc-200' },
};

// Parse YYYY-MM-DD as local date to avoid UTC timezone shift
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function SessionRow({ s, campaignId }) {
  const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.planned;
  const StatusIcon = statusCfg.icon;
  return (
    <Link
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
}

export default function SessionBrowser() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id') || params.get('id');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [view, setView] = useState('list');
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: d => d?.[0],
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: () => Session.filter({ campaign_id: campaignId }, '-session_number', 100),
    enabled: !!campaignId,
  });

  // Build date string → sessions map
  const sessionsByDate = sessions.reduce((acc, s) => {
    if (!s.date) return acc;
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const sessionDates = Object.keys(sessionsByDate).map(parseLocalDate);
  const selectedDateKey = selectedDay ? toDateKey(selectedDay) : null;
  const selectedSessions = selectedDateKey ? (sessionsByDate[selectedDateKey] || []) : [];

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-zinc-100 text-gray-900">Sessions</h1>
          <p className="text-sm dark:text-zinc-500 text-gray-600 mt-1">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border dark:border-zinc-700 border-gray-200 overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                view === 'list'
                  ? "dark:bg-zinc-700 dark:text-zinc-100 bg-gray-200 text-gray-900"
                  : "dark:text-zinc-500 dark:hover:bg-zinc-800 text-gray-500 hover:bg-gray-100"
              )}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                view === 'calendar'
                  ? "dark:bg-zinc-700 dark:text-zinc-100 bg-gray-200 text-gray-900"
                  : "dark:text-zinc-500 dark:hover:bg-zinc-800 text-gray-500 hover:bg-gray-100"
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
          <Button size="sm" onClick={() => setShowNewDialog(true)} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> New Session
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl dark:bg-zinc-900/50 dark:border-zinc-800/50 bg-gray-100 border border-gray-300 animate-pulse" />
          ))}
        </div>
      ) : view === 'calendar' ? (
        <div className="space-y-4">
          <style>{`
            .rdp-day.session-dot { position: relative; }
            .rdp-day.session-dot::after {
              content: '';
              position: absolute;
              bottom: 3px;
              left: 50%;
              transform: translateX(-50%);
              width: 4px;
              height: 4px;
              border-radius: 50%;
              background-color: #f59e0b;
            }
          `}</style>
          <div className="flex justify-center">
            <div className="dark:bg-zinc-900 dark:border-zinc-800 bg-white border border-gray-200 rounded-xl p-2 inline-block">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={setSelectedDay}
                modifiers={{ 'session-dot': sessionDates }}
                modifiersClassNames={{ 'session-dot': 'session-dot' }}
              />
            </div>
          </div>
          {selectedDay && (
            <div className="space-y-2">
              <p className="text-xs font-medium dark:text-zinc-500 text-gray-500 uppercase tracking-wide">
                {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              {selectedSessions.length === 0 ? (
                <p className="text-sm dark:text-zinc-600 text-gray-400 py-2">No sessions scheduled on this date.</p>
              ) : (
                selectedSessions.map(s => <SessionRow key={s.id} s={s} campaignId={campaignId} />)
              )}
            </div>
          )}
          {!selectedDay && sessions.length > 0 && (
            <p className="text-xs dark:text-zinc-600 text-gray-400 text-center">Click a date to see sessions. Amber dots mark scheduled sessions.</p>
          )}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays className="w-10 h-10 dark:text-zinc-600 text-gray-400 mx-auto mb-3" />
          <p className="dark:text-zinc-500 text-gray-600 text-sm">No sessions yet</p>
          <Button variant="outline" size="sm" onClick={() => setShowNewDialog(true)} className="mt-4 dark:border-zinc-700 dark:text-zinc-400 border-gray-300 text-gray-700">
            Start First Session
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => <SessionRow key={s.id} s={s} campaignId={campaignId} />)}
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

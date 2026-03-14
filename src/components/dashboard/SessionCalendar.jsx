import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Parse any date string to local YYYY-MM-DD key (avoids UTC timezone shift)
function toDateKey(dateStr) {
  if (!dateStr) return null;
  // Handle full ISO timestamps from Supabase (e.g. "2026-01-10T00:00:00+00:00")
  return dateStr.slice(0, 10);
}

function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function SessionCalendar({ sessions, campaignId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedKey, setSelectedKey] = useState(null);

  const sessionsByDate = {};
  sessions.forEach(s => {
    const key = toDateKey(s.date);
    if (!key) return;
    if (!sessionsByDate[key]) sessionsByDate[key] = [];
    sessionsByDate[key].push(s);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const date = new Date(startDate);
  while (date <= lastDay || date.getDay() !== 0) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  const todayKey = localDateKey(new Date());

  const nextSession = sessions
    .filter(s => toDateKey(s.date) >= todayKey)
    .sort((a, b) => toDateKey(a.date).localeCompare(toDateKey(b.date)))[0];
  const nextSessionKey = nextSession ? toDateKey(nextSession.date) : null;

  const selectedSessions = selectedKey ? (sessionsByDate[selectedKey] || []) : [];

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">Session Calendar</h2>
        {nextSession && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Next: {new Date(nextSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1))} className="h-7 w-7 p-0 dark:hover:bg-zinc-800">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{monthName}</span>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1))} className="h-7 w-7 p-0 dark:hover:bg-zinc-800">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-500 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const key = localDateKey(day);
            const daySessions = sessionsByDate[key] || [];
            const isCurrentMonth = day.getMonth() === month;
            const isToday = key === todayKey;
            const isNext = key === nextSessionKey;
            const isSelected = key === selectedKey;
            const hasSessions = daySessions.length > 0;

            return (
              <button
                key={i}
                onClick={() => setSelectedKey(hasSessions ? (selectedKey === key ? null : key) : null)}
                disabled={!hasSessions}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-lg text-xs border transition-colors",
                  isCurrentMonth
                    ? "border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-800/30"
                    : "border-transparent bg-zinc-50 dark:bg-zinc-900/20",
                  hasSessions && "cursor-pointer hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-500/5",
                  isNext && !isSelected && "border-amber-400 dark:border-amber-500/70 bg-amber-50 dark:bg-amber-500/10",
                  isSelected && "border-amber-500 bg-amber-100 dark:border-amber-400 dark:bg-amber-500/20",
                  isToday && "ring-2 ring-amber-400 dark:ring-amber-500/50"
                )}
              >
                <span className={cn(
                  "font-semibold leading-none",
                  isCurrentMonth ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600",
                  isNext && "text-amber-700 dark:text-amber-400",
                  isSelected && "text-amber-800 dark:text-amber-300"
                )}>
                  {day.getDate()}
                </span>
                {hasSessions && (
                  <div className="mt-1 flex gap-0.5">
                    {daySessions.slice(0, 2).map((_, j) => (
                      <div key={j} className={cn("w-1 h-1 rounded-full", isNext || isSelected ? "bg-amber-500" : "bg-amber-400 dark:bg-amber-500")} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day sessions */}
      {selectedKey && selectedSessions.length > 0 && (
        <div className="bg-white dark:bg-zinc-900/40 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {new Date(selectedKey + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {selectedSessions.map(s => (
            <Link
              key={s.id}
              to={createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${s.id}`}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-colors group"
            >
              <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                {s.session_number}
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                {s.title || `Session ${s.session_number}`}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Upcoming sessions list (when nothing selected) */}
      {!selectedKey && nextSession && (
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Upcoming</p>
          {sessions
            .filter(s => toDateKey(s.date) >= todayKey)
            .sort((a, b) => toDateKey(a.date).localeCompare(toDateKey(b.date)))
            .slice(0, 3)
            .map(s => (
              <Link
                key={s.id}
                to={createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${s.id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors group"
              >
                <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-600 min-w-[40px]">
                  {new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                  {s.title || `Session ${s.session_number}`}
                </p>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}

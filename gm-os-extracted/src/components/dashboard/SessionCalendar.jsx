import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SessionCalendar({ sessions, campaignId }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const sessions_by_date = {};
  sessions.forEach(s => {
    if (s.date) {
      const dateKey = s.date; // format: YYYY-MM-DD
      if (!sessions_by_date[dateKey]) sessions_by_date[dateKey] = [];
      sessions_by_date[dateKey].push(s);
    }
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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Find the next upcoming session
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextSession = sessions
    .filter(s => s.date && new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">Session Calendar</h2>
        {nextSession && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Next: {new Date(nextSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="h-7 w-7 p-0 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{monthName}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-7 w-7 p-0 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-zinc-600 dark:text-zinc-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const dateKey = day.toISOString().split('T')[0];
            const daySessions = sessions_by_date[dateKey] || [];
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={i}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-lg text-xs border",
                  isCurrentMonth
                    ? "border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-800/30"
                    : "border-transparent bg-zinc-50 dark:bg-zinc-900/20 text-zinc-400 dark:text-zinc-600",
                  isToday && "ring-2 ring-amber-400 dark:ring-amber-500/50"
                )}
              >
                <span className={cn(
                  "font-semibold leading-none",
                  isCurrentMonth ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"
                )}>
                  {day.getDate()}
                </span>
                {daySessions.length > 0 && (
                  <div className="mt-1 flex gap-0.5">
                    {daySessions.slice(0, 2).map((_, j) => (
                      <div key={j} className="w-1 h-1 rounded-full bg-amber-500" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming sessions list */}
      {nextSession && (
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Upcoming</p>
          {sessions
            .filter(s => s.date && new Date(s.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3)
            .map(s => (
              <Link
                key={s.id}
                to={createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${s.id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors group"
              >
                <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-600 min-w-[40px]">
                  {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                    {s.title || `Session ${s.session_number}`}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
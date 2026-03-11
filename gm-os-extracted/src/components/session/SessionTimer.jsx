import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SessionTimer({ session }) {
  const [elapsed, setElapsed] = useState(0);
  const queryClient = useQueryClient();

  const isRunning = session?.start_time && !session?.end_time;

  useEffect(() => {
    if (isRunning) {
      const startTime = new Date(session.start_time).getTime();
      const updateElapsed = () => {
        const now = Date.now();
        setElapsed(Math.floor((now - startTime) / 1000));
      };
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else if (session?.start_time && session?.end_time) {
      const start = new Date(session.start_time).getTime();
      const end = new Date(session.end_time).getTime();
      setElapsed(Math.floor((end - start) / 1000));
    }
  }, [isRunning, session?.start_time, session?.end_time]);

  const startMutation = useMutation({
    mutationFn: () => base44.entities.Session.update(session.id, { 
      start_time: new Date().toISOString(),
      status: 'in_progress'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const endMutation = useMutation({
    mutationFn: () => base44.entities.Session.update(session.id, { 
      end_time: new Date().toISOString(),
      status: 'completed'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Session Time</p>
            <p className="text-2xl font-mono font-bold text-zinc-100">{formatTime(elapsed)}</p>
          </div>
        </div>
        <div>
          {!session?.start_time && (
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="bg-green-600 hover:bg-green-500"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          )}
          {isRunning && (
            <Button
              onClick={() => endMutation.mutate()}
              disabled={endMutation.isPending}
              className="bg-red-600 hover:bg-red-500"
            >
              <Square className="w-4 h-4 mr-2" />
              End Session
            </Button>
          )}
          {session?.end_time && (
            <div className="text-xs text-zinc-500">
              Session Ended
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Session } from '@/api/entities';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SessionGoalTracker({ session }) {
  const queryClient = useQueryClient();
  const goals = session?.session_goals || [];
  
  const completedCount = goals.filter(g => g.completed).length;
  const progress = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;

  const toggleMutation = useMutation({
    mutationFn: async (index) => {
      const updatedGoals = goals.map((g, i) => 
        i === index ? { ...g, completed: !g.completed } : g
      );
      return Session.update(session.id, { session_goals: updatedGoals });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  if (goals.length === 0) {
    return (
      <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl p-6 text-center">
        <Target className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
        <p className="text-sm text-zinc-600">No session goals set</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
          Session Goals
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{completedCount}/{goals.length}</span>
          {completedCount === goals.length && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="space-y-2">
        {goals.map((goal, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900/60 transition-colors"
          >
            <Checkbox
              checked={goal.completed}
              onCheckedChange={() => toggleMutation.mutate(index)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <p className={`text-sm ${goal.completed ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>
                {goal.text}
              </p>
            </div>
            {goal.completed && (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
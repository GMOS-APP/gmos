import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, Eye, EyeOff, Check, Zap, FileText, ScrollText, Swords, Gem, Users, Waypoints } from 'lucide-react';
import { cn } from '@/lib/utils';

function RefSection({ icon: Icon, title, color = 'zinc', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const colorClass = {
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    rose: 'text-rose-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    zinc: 'text-zinc-400',
  }[color];

  return (
    <div className="border-b border-zinc-800/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-2.5 text-left hover:text-zinc-200 transition-colors"
      >
        <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', colorClass)} />
        <span className="text-xs font-semibold text-zinc-400 flex-1 uppercase tracking-wider">{title}</span>
        {open ? <ChevronDown className="w-3 h-3 text-zinc-700" /> : <ChevronRight className="w-3 h-3 text-zinc-700" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function RevealableSecret({ text, index, revealed, onToggle }) {
  return (
    <button
      onClick={() => onToggle(index)}
      className={cn(
        'w-full flex items-start gap-2 p-2 rounded-lg text-left transition-all group',
        revealed
          ? 'bg-green-500/5 border border-green-500/20'
          : 'bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700'
      )}
    >
      <span className={cn('text-[10px] font-mono mt-0.5 flex-shrink-0', revealed ? 'text-green-500' : 'text-zinc-600')}>
        {index + 1}.
      </span>
      <span className={cn('text-xs flex-1', revealed ? 'text-zinc-500 line-through' : 'text-zinc-300')}>
        {text}
      </span>
      <span className={cn('flex-shrink-0 mt-0.5', revealed ? 'text-green-500' : 'text-zinc-700 group-hover:text-zinc-500')}>
        {revealed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      </span>
    </button>
  );
}

function SceneItem({ text, index, done, onToggle }) {
  return (
    <button
      onClick={() => onToggle(index)}
      className={cn(
        'w-full flex items-start gap-2 p-2 rounded-lg text-left transition-all',
        done ? 'opacity-40' : 'hover:bg-zinc-800/40'
      )}
    >
      <span className={cn('w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5',
        done ? 'bg-zinc-700 border-zinc-600' : 'border-zinc-700'
      )}>
        {done && <Check className="w-2.5 h-2.5 text-zinc-400" />}
      </span>
      <span className={cn('text-xs', done ? 'line-through text-zinc-600' : 'text-zinc-300')}>{text}</span>
    </button>
  );
}

export default function SessionReference({ session, threads = [] }) {
  const [revealedSecrets, setRevealedSecrets] = useState(new Set());
  const [doneScenes, setDoneScenes] = useState(new Set());
  const queryClient = useQueryClient();

  const toggleSecret = (i) => {
    setRevealedSecrets(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleScene = (i) => {
    setDoneScenes(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const goalMutation = useMutation({
    mutationFn: async (index) => {
      const goals = (session.session_goals || []).map((g, i) =>
        i === index ? { ...g, completed: !g.completed } : g
      );
      return base44.entities.Session.update(session.id, { session_goals: goals });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['current-session'] }),
  });

  if (!session) return null;

  const secrets = session.secrets_and_clues || [];
  const scenes = session.potential_scenes || [];
  const goals = session.session_goals || [];
  const hooks = session.character_hooks || [];
  const revealedCount = revealedSecrets.size;

  return (
    <div className="space-y-0 divide-y divide-zinc-800/60">

      {/* Strong Start */}
      {session.strong_start && (
        <RefSection icon={Zap} title="Strong Start" color="amber">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <p className="text-xs text-zinc-300 leading-relaxed italic">"{session.strong_start}"</p>
          </div>
        </RefSection>
      )}

      {/* Character Hooks */}
      {hooks.length > 0 && (
        <RefSection icon={Users} title="Character Hooks" color="purple" defaultOpen={false}>
          <div className="space-y-1.5">
            {hooks.map((h, i) => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-2">
                <p className="text-[10px] font-semibold text-purple-400 mb-0.5">{h.character_name}</p>
                <p className="text-xs text-zinc-400">{h.hook}</p>
              </div>
            ))}
          </div>
        </RefSection>
      )}

      {/* Secrets & Clues */}
      {secrets.length > 0 && (
        <RefSection icon={Eye} title={`Secrets & Clues (${revealedCount}/${secrets.length} revealed)`} color="rose">
          <div className="space-y-1.5">
            {secrets.map((s, i) => (
              <RevealableSecret
                key={i}
                text={s}
                index={i}
                revealed={revealedSecrets.has(i)}
                onToggle={toggleSecret}
              />
            ))}
          </div>
          {revealedCount === secrets.length && secrets.length > 0 && (
            <p className="text-[10px] text-green-500 mt-2 text-center">All secrets revealed!</p>
          )}
        </RefSection>
      )}

      {/* Potential Scenes */}
      {scenes.length > 0 && (
        <RefSection icon={FileText} title="Scenes" color="blue" defaultOpen={false}>
          <div className="space-y-0.5">
            {scenes.map((s, i) => (
              <SceneItem key={i} text={s} index={i} done={doneScenes.has(i)} onToggle={toggleScene} />
            ))}
          </div>
        </RefSection>
      )}

      {/* Session Goals */}
      {goals.length > 0 && (
        <RefSection icon={Check} title={`Goals (${goals.filter(g => g.completed).length}/${goals.length})`} color="green" defaultOpen={false}>
          <div className="space-y-1">
            {goals.map((g, i) => (
              <button
                key={i}
                onClick={() => goalMutation.mutate(i)}
                className="w-full flex items-start gap-2 p-2 rounded-lg text-left hover:bg-zinc-800/40"
              >
                <span className={cn('w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5',
                  g.completed ? 'bg-green-600 border-green-600' : 'border-zinc-700'
                )}>
                  {g.completed && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className={cn('text-xs', g.completed ? 'line-through text-zinc-600' : 'text-zinc-300')}>{g.text}</span>
              </button>
            ))}
          </div>
        </RefSection>
      )}

      {/* NPCs */}
      {session.npc_notes && (
        <RefSection icon={ScrollText} title="NPCs" color="cyan" defaultOpen={false}>
          <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">{session.npc_notes}</pre>
        </RefSection>
      )}

      {/* Monsters */}
      {session.monster_notes && (
        <RefSection icon={Swords} title="Monsters" color="rose" defaultOpen={false}>
          <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">{session.monster_notes}</pre>
        </RefSection>
      )}

      {/* Treasure */}
      {session.treasure_notes && (
        <RefSection icon={Gem} title="Treasure" color="orange" defaultOpen={false}>
          <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">{session.treasure_notes}</pre>
        </RefSection>
      )}

      {/* Active Threads */}
      {threads.length > 0 && (
        <RefSection icon={Waypoints} title="Active Threads" color="zinc" defaultOpen={false}>
          <div className="space-y-1.5">
            {threads.map(t => (
              <div key={t.id} className="text-xs">
                <span className="text-zinc-300 font-medium">{t.name}</span>
                {t.summary && <p className="text-zinc-600 text-[10px] mt-0.5 line-clamp-2">{t.summary}</p>}
              </div>
            ))}
          </div>
        </RefSection>
      )}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Inbox, Bug, Lightbulb, LifeBuoy, RotateCcw, Check, Trash2 } from 'lucide-react';
import { callAdmin, CARD } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const FB_META = {
  bug: { label: 'Bug', Icon: Bug, color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30' },
  feedback: { label: 'Idea', Icon: Lightbulb, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' },
  help: { label: 'Help', Icon: LifeBuoy, color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30' },
};
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

// User feedback inbox: triage (resolve/reopen) and delete bug/idea/help reports.
export default function FeedbackAdmin() {
  const [feedback, setFeedback] = useState([]);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    callAdmin({ action: 'feedback-list' }).then((f) => setFeedback(f.feedback || [])).catch(() => {});
  }, []);

  const fbStatus = async (f, status) => {
    setFeedback((prev) => prev.map((x) => (x.id === f.id ? { ...x, status } : x)));
    await callAdmin({ action: 'feedback-status', id: f.id, status });
  };
  const fbDelete = async (f) => {
    setFeedback((prev) => prev.filter((x) => x.id !== f.id));
    await callAdmin({ action: 'feedback-delete', id: f.id });
  };

  const shown = feedback.filter((f) => showResolved || f.status !== 'resolved');

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          <Inbox className="w-3.5 h-3.5 text-amber-500" /> Feedback ({feedback.filter((f) => f.status !== 'resolved').length} open)
        </h2>
        <button onClick={() => setShowResolved((v) => !v)} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          {showResolved ? 'Hide resolved' : 'Show resolved'}
        </button>
      </div>
      <div className="space-y-2">
        {shown.length === 0 && (
          <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-6">No {showResolved ? '' : 'open '}feedback.</p>
        )}
        {shown.map((f) => {
          const m = FB_META[f.type] || FB_META.feedback;
          const resolved = f.status === 'resolved';
          return (
            <div key={f.id} className={cn(CARD, 'p-3', resolved && 'opacity-60')}>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1', m.color)}>
                  <m.Icon className="w-3 h-3" /> {m.label}
                </span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">{f.user_email || 'anonymous'}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{fmtDate(f.created_date)}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => fbStatus(f, resolved ? 'open' : 'resolved')} title={resolved ? 'Reopen' : 'Mark resolved'}
                    className={cn('w-6 h-6 flex items-center justify-center rounded', resolved ? 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300' : 'text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400')}>
                    {resolved ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => fbDelete(f)} title="Delete" className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{f.message}</p>
              {f.page && <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1.5 font-mono truncate">{f.page}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

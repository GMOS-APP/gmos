import React, { useState } from 'react';
import { Feedback } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { MessageSquarePlus, Bug, Lightbulb, LifeBuoy, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPES = [
  { id: 'bug', label: 'Bug', Icon: Bug },
  { id: 'feedback', label: 'Idea', Icon: Lightbulb },
  { id: 'help', label: 'Help', Icon: LifeBuoy },
];

/**
 * A self-contained "Send feedback" menu item + dialog. Lets any signed-in user
 * file a bug, idea, or help request (lands in the admin inbox).
 */
export default function FeedbackButton({ className, onOpen, iconOnly = false }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await Feedback.create({
        type,
        message: message.trim(),
        user_email: user?.email || null,
        page: window.location.pathname + window.location.search,
      });
      setSent(true);
      setMessage('');
      setTimeout(() => { setOpen(false); setSent(false); }, 1400);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { onOpen?.(); setOpen(true); setSent(false); }}
        className={className}
        title={iconOnly ? 'Send feedback' : undefined}
        aria-label={iconOnly ? 'Send feedback' : undefined}
      >
        <MessageSquarePlus className="w-4 h-4 flex-shrink-0" />
        {!iconOnly && <span>Send feedback</span>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">Send feedback</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Report a bug, share an idea, or ask for help. It goes straight to the team.
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Thanks — we got it.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm transition-colors',
                      type === t.id
                        ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600'
                    )}
                  >
                    <t.Icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={type === 'bug' ? 'What went wrong? What were you doing?' : type === 'help' ? 'What do you need help with?' : 'What would make GM/OS better?'}
                rows={5}
                autoFocus
                className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 px-3 py-2 resize-none focus:outline-none focus:border-amber-500/50"
              />
              <button
                onClick={submit}
                disabled={!message.trim() || sending}
                className="w-full h-9 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-semibold inline-flex items-center justify-center gap-1.5"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />} Send
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

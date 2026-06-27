import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Loader2, Check, Mail } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email capture for the blog. Inserts into newsletter_subscribers (anon-insert
// RLS). A duplicate address is treated as success — same friendly result.
export default function NewsletterSignup({ source = 'blog' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) { setStatus('error'); return; }
    setStatus('sending');
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: value, source });
    // 23505 = already subscribed; from the reader's view that's still success.
    if (error && error.code !== '23505') { setStatus('error'); return; }
    setStatus('done');
  };

  return (
    <section className="mt-16 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] dark:bg-amber-500/[0.06] p-6 sm:p-8 text-center">
      <Mail className="w-6 h-6 text-amber-500 mx-auto mb-3" />
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Get new posts in your inbox</h2>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
        GM tips, prep methods, and product updates. No spam, unsubscribe anytime.
      </p>

      {status === 'done' ? (
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="w-4 h-4" /> You&rsquo;re on the list — thanks!
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
            placeholder="you@example.com"
            aria-label="Email address"
            className="flex-1 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 transition-colors shrink-0"
          >
            {status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-500">Please enter a valid email address.</p>
      )}
    </section>
  );
}

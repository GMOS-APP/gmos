import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800/60 px-6 py-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-zinc-400 dark:text-zinc-600">
      <span className="font-semibold tracking-tight">
        GM<span className="text-amber-500">/OS</span>
      </span>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>Built on the Lazy GM method · SRD 5.1 &amp; Open5e under open licenses</span>
        <span aria-hidden>·</span>
        <Link to={createPageUrl('About')} className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Attributions</Link>
        <span aria-hidden>·</span>
        <Link to={createPageUrl('PrivacyPolicy')} className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Privacy</Link>
        <span aria-hidden>·</span>
        <Link to={createPageUrl('Terms')} className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Terms</Link>
      </span>
    </footer>
  );
}

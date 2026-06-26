import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800/60 px-6 py-3 pb-16 sm:pb-3 text-[11px] text-zinc-400 dark:text-zinc-600">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <span className="font-semibold tracking-tight text-zinc-500 dark:text-zinc-500">GM<span className="text-amber-500">/OS</span></span>
        <span aria-hidden>·</span>
        <span>Built on the Lazy GM method · SRD 5.1 &amp; Open5e under open licenses</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1.5">
        <Link to={createPageUrl('Help')} className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Manual</Link>
        <Link to="/blog" className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Blog</Link>
        <Link to={createPageUrl('About')} className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Attributions</Link>
        <Link to={createPageUrl('PrivacyPolicy')} className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Privacy</Link>
        <Link to={createPageUrl('Terms')} className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Terms</Link>
      </div>
    </footer>
  );
}

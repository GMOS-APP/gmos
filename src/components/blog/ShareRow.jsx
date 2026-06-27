import React, { useState } from 'react';
import { Link2, Check, Twitter, Facebook } from 'lucide-react';
import { BLOG_SITE } from '@/lib/blog';
import { cn } from '@/lib/utils';

// Share controls for a post: copy link, X/Twitter, Facebook, Reddit.
export default function ShareRow({ slug, title }) {
  const [copied, setCopied] = useState(false);
  const url = `${BLOG_SITE}/blog/${slug}`;
  const t = encodeURIComponent(title || '');
  const u = encodeURIComponent(url);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };

  const open = (href) => window.open(href, '_blank', 'noopener,noreferrer,width=600,height=540');

  const btn = 'inline-flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-amber-500/40 transition-colors';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400 dark:text-zinc-600 mr-1">Share</span>
      <button onClick={copy} aria-label="Copy link" title={copied ? 'Copied!' : 'Copy link'} className={cn(btn, copied && 'text-emerald-500 border-emerald-500/40')}>
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </button>
      <button onClick={() => open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`)} aria-label="Share on X" title="Share on X" className={btn}>
        <Twitter className="w-4 h-4" />
      </button>
      <button onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${u}`)} aria-label="Share on Facebook" title="Share on Facebook" className={btn}>
        <Facebook className="w-4 h-4" />
      </button>
      <button onClick={() => open(`https://www.reddit.com/submit?url=${u}&title=${t}`)} aria-label="Share on Reddit" title="Share on Reddit" className={cn(btn, 'text-xs font-bold')}>
        r/
      </button>
    </div>
  );
}

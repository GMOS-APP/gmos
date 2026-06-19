import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import MarketingShell from '@/components/layout/MarketingShell';
import { Loader2 } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

export default function Blog() {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    document.title = 'Blog — GM/OS';
    supabase
      .from('blog_posts')
      .select('slug, title, excerpt, category, author, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => setPosts(data || []));
  }, []);

  return (
    <MarketingShell>
      <header className="mb-10">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-3">The GM/OS Blog</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">GM tips & deep dives</h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-500">Running better games — prep methods, advice from behind the screen, and a look inside GM/OS.</p>
      </header>

      {posts === null ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-500 py-16 text-center">No posts yet — check back soon.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <Link
              key={p.slug}
              to={`/blog/${p.slug}`}
              className="block rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 p-5 hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-600 mb-1.5">
                {p.category && <span className="font-medium text-amber-600/90 dark:text-amber-400/90">{p.category}</span>}
                {p.category && <span>·</span>}
                <span>{fmtDate(p.published_at)}</span>
              </div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{p.title}</h2>
              {p.excerpt && <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">{p.excerpt}</p>}
              <span className="mt-3 inline-block text-xs font-medium text-amber-600 dark:text-amber-400">Read more →</span>
            </Link>
          ))}
        </div>
      )}
    </MarketingShell>
  );
}

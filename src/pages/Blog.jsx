import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import MarketingShell from '@/components/layout/MarketingShell';
import PostCard from '@/components/blog/PostCard';
import { useSeo } from '@/lib/useSeo';
import { cn } from '@/lib/utils';
import { Loader2, Search as SearchIcon } from 'lucide-react';

export default function Blog() {
  const [posts, setPosts] = useState(null);
  const [active, setActive] = useState('All');
  const [query, setQuery] = useState('');

  useSeo({
    title: 'Blog — GM tips & deep dives | GM/OS',
    description: 'GM tips, prep methods, and feature deep-dives for running better tabletop RPG sessions, from the team behind GM/OS.',
    path: '/blog',
  });

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('slug, title, excerpt, body, category, author, cover_image, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => setPosts(data || []));
  }, []);

  const categories = useMemo(() => {
    if (!posts) return [];
    return ['All', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];
  }, [posts]);

  const filtered = useMemo(() => {
    if (!posts) return [];
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (active !== 'All' && p.category !== active) return false;
      if (!q) return true;
      return `${p.title} ${p.excerpt || ''} ${p.category || ''}`.toLowerCase().includes(q);
    });
  }, [posts, active, query]);

  // Hero only when browsing the unfiltered, unsearched feed.
  const browsing = active === 'All' && !query.trim();
  const [hero, ...rest] = filtered;

  return (
    <MarketingShell width="max-w-5xl">
      <header className="mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-3">The GM/OS Blog</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">GM tips &amp; deep dives</h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-500 max-w-2xl">Running better games — prep methods, advice from behind the screen, and a look inside GM/OS.</p>
      </header>

      {posts === null ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-500 py-16 text-center">No posts yet — check back soon.</p>
      ) : (
        <>
          {/* Controls: category chips + search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                    active === c
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="relative sm:w-64 shrink-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts…"
                className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 pl-9 pr-3 py-2 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-500 py-16 text-center">No posts match your search.</p>
          ) : browsing ? (
            <>
              <PostCard post={hero} featured />
              {rest.length > 0 && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p) => <PostCard key={p.slug} post={p} />)}
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => <PostCard key={p.slug} post={p} />)}
            </div>
          )}
        </>
      )}
    </MarketingShell>
  );
}

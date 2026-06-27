import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import CoverArt from '@/components/blog/CoverArt';
import { fmtDate, readingLabel, categoryAccent } from '@/lib/blog';
import { cn } from '@/lib/utils';

// A single post card. `featured` renders a larger, horizontal hero variant.
export default function PostCard({ post, featured = false }) {
  const accent = categoryAccent(post.category);
  const read = readingLabel(post.body);

  return (
    <Link
      to={`/blog/${post.slug}`}
      className={cn(
        'group block overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all',
        featured && 'sm:grid sm:grid-cols-2',
      )}
    >
      <div className={cn('overflow-hidden', featured ? 'aspect-[16/10] sm:aspect-auto' : 'aspect-[16/9]')}>
        <CoverArt post={post} className="group-hover:scale-[1.03] transition-transform duration-500" />
      </div>
      <div className={cn('flex flex-col p-5', featured && 'sm:p-7 sm:justify-center')}>
        <div className="flex flex-wrap items-center gap-2 text-[11px] mb-2">
          {post.category && (
            <span className={cn('font-medium px-2 py-0.5 rounded-full border', accent.chip)}>{post.category}</span>
          )}
          <span className="text-zinc-400 dark:text-zinc-600">{fmtDate(post.published_at)}</span>
          {read && (
            <span className="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-600">
              <Clock className="w-3 h-3" /> {read}
            </span>
          )}
        </div>
        <h2
          className={cn(
            'font-semibold text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors',
            featured ? 'text-xl sm:text-2xl' : 'text-base',
          )}
        >
          {post.title}
        </h2>
        {post.excerpt && (
          <p className={cn('mt-2 text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed', featured ? 'line-clamp-3' : 'line-clamp-2')}>
            {post.excerpt}
          </p>
        )}
        <span className="mt-3 inline-block text-xs font-medium text-amber-600 dark:text-amber-400">Read more →</span>
      </div>
    </Link>
  );
}

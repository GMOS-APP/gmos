import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/api/supabaseClient';
import MarketingShell from '@/components/layout/MarketingShell';
import CoverArt from '@/components/blog/CoverArt';
import ShareRow from '@/components/blog/ShareRow';
import ReadingProgress from '@/components/blog/ReadingProgress';
import PostCard from '@/components/blog/PostCard';
import { useSeo } from '@/lib/useSeo';
import { fmtDate, readingLabel, categoryAccent } from '@/lib/blog';
import { cn } from '@/lib/utils';
import { Loader2, ArrowLeft, Clock } from 'lucide-react';

const SELECT = 'slug, title, excerpt, body, cover_image, category, author, published_at';

// Render in-app links (e.g. the series nav, /blog/...) as client-side Router
// navigations instead of full page reloads; external links open in a new tab.
const markdownComponents = {
  a: ({ href = '', children, ...props }) => (
    href.startsWith('/')
      ? <Link to={href} {...props}>{children}</Link>
      : <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
};

export default function BlogPost() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, post: null });
  const [related, setRelated] = useState([]);
  const post = state.post;

  useSeo(post ? {
    title: `${post.title} — GM/OS`,
    description: post.excerpt || undefined,
    path: `/blog/${post.slug}`,
    type: 'article',
    image: post.cover_image || undefined,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt || undefined,
      image: post.cover_image || undefined,
      datePublished: post.published_at,
      author: { '@type': 'Organization', name: post.author || 'GM/OS' },
      publisher: { '@type': 'Organization', name: 'GM/OS' },
      mainEntityOfPage: `https://gmos.app/blog/${post.slug}`,
    },
  } : { title: 'GM/OS Blog', path: `/blog/${slug}` });

  useEffect(() => {
    let active = true;
    setState({ loading: true, post: null });
    setRelated([]);
    window.scrollTo(0, 0);
    supabase
      .from('blog_posts')
      .select(SELECT)
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setState({ loading: false, post: data || null });
        if (data?.category) {
          supabase
            .from('blog_posts')
            .select(SELECT)
            .eq('published', true)
            .eq('category', data.category)
            .neq('slug', data.slug)
            .order('published_at', { ascending: false })
            .limit(3)
            .then(({ data: rel }) => { if (active) setRelated(rel || []); });
        }
      });
    return () => { active = false; };
  }, [slug]);

  const accent = post ? categoryAccent(post.category) : null;
  const read = post ? readingLabel(post.body) : '';

  return (
    <MarketingShell width="max-w-2xl">
      {post && <ReadingProgress />}

      <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> All posts
      </Link>

      {state.loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
      ) : !post ? (
        <div className="py-16 text-center">
          <p className="text-zinc-700 dark:text-zinc-300 font-medium">Post not found</p>
          <Link to="/blog" className="mt-3 inline-block text-sm text-amber-600 dark:text-amber-400 hover:underline">Back to the blog</Link>
        </div>
      ) : (
        <article>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-600 mb-3">
            {post.category && <span className={cn('font-medium px-2 py-0.5 rounded-full border', accent.chip)}>{post.category}</span>}
            <span>{fmtDate(post.published_at)}</span>
            {post.author && <><span aria-hidden>·</span><span>{post.author}</span></>}
            {read && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {read}</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">{post.title}</h1>
          {post.excerpt && <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">{post.excerpt}</p>}

          {post.cover_image && (
            <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800/60">
              <CoverArt post={post} />
            </div>
          )}

          <div className="blog-body mt-8 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-900 dark:[&_h3]:text-zinc-100 [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-4
            [&_a]:text-amber-600 dark:[&_a]:text-amber-400 [&_a]:underline [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100 [&_strong]:font-semibold
            [&_blockquote]:border-l-2 [&_blockquote]:border-amber-500/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 dark:[&_blockquote]:text-zinc-400 [&_blockquote]:my-4
            [&_code]:rounded [&_code]:bg-zinc-100 dark:[&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px]
            [&_hr]:my-8 [&_hr]:border-zinc-200 dark:[&_hr]:border-zinc-800
            [&_table]:w-full [&_table]:my-4 [&_table]:text-sm [&_th]:text-left [&_th]:font-semibold [&_th]:border-b [&_th]:border-zinc-300 dark:[&_th]:border-zinc-700 [&_th]:py-1.5 [&_td]:border-b [&_td]:border-zinc-200 dark:[&_td]:border-zinc-800 [&_td]:py-1.5 [&_img]:rounded-xl [&_img]:my-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{post.body || ''}</ReactMarkdown>
          </div>

          <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-4">
            <ShareRow slug={post.slug} title={post.title} />
            <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors">Try GM/OS free</Link>
          </div>

          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-4">
                More in {post.category}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => <PostCard key={p.slug} post={p} />)}
              </div>
            </section>
          )}

          <div className="mt-12 text-center">
            <Link to="/blog" className="text-sm text-amber-600 dark:text-amber-400 hover:underline">← More GM tips</Link>
          </div>
        </article>
      )}
    </MarketingShell>
  );
}

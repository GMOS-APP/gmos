import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/api/supabaseClient';
import MarketingShell from '@/components/layout/MarketingShell';
import { useSeo } from '@/lib/useSeo';
import { Loader2, ArrowLeft } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

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
      datePublished: post.published_at,
      author: { '@type': 'Organization', name: post.author || 'GM/OS' },
      publisher: { '@type': 'Organization', name: 'GM/OS' },
      mainEntityOfPage: `https://gmos.app/blog/${post.slug}`,
    },
  } : { title: 'GM/OS Blog', path: `/blog/${slug}` });

  useEffect(() => {
    let active = true;
    setState({ loading: true, post: null });
    supabase
      .from('blog_posts')
      .select('slug, title, excerpt, body, cover_image, category, author, published_at')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setState({ loading: false, post: data || null });
      });
    return () => { active = false; };
  }, [slug]);

  return (
    <MarketingShell width="max-w-2xl">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> All posts
      </Link>

      {state.loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
      ) : !state.post ? (
        <div className="py-16 text-center">
          <p className="text-zinc-700 dark:text-zinc-300 font-medium">Post not found</p>
          <Link to="/blog" className="mt-3 inline-block text-sm text-amber-600 dark:text-amber-400 hover:underline">Back to the blog</Link>
        </div>
      ) : (
        <article>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-600 mb-2">
            {state.post.category && <span className="font-medium text-amber-600/90 dark:text-amber-400/90">{state.post.category}</span>}
            {state.post.category && <span>·</span>}
            <span>{fmtDate(state.post.published_at)}</span>
            {state.post.author && <><span>·</span><span>{state.post.author}</span></>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">{state.post.title}</h1>

          <div className="blog-body mt-8 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-900 dark:[&_h3]:text-zinc-100 [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-4
            [&_a]:text-amber-600 dark:[&_a]:text-amber-400 [&_a]:underline [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100 [&_strong]:font-semibold">
            <ReactMarkdown components={markdownComponents}>{state.post.body || ''}</ReactMarkdown>
          </div>

          <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between">
            <Link to="/blog" className="text-sm text-amber-600 dark:text-amber-400 hover:underline">← More GM tips</Link>
            <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors">Try GM/OS free</Link>
          </div>
        </article>
      )}
    </MarketingShell>
  );
}

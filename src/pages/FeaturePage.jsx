import React from 'react';
import { useParams, Link } from 'react-router-dom';
import MarketingShell, { MarketingCTA } from '@/components/layout/MarketingShell';
import PageNotFound from '@/lib/PageNotFound';
import { useSeo } from '@/lib/useSeo';
import { getFeaturePage, PRICING_BLURB, SITE, featureFaq, featureLabel } from '@/lib/seoPages';
import { Check, ArrowRight } from 'lucide-react';

// Renders a single feature landing page (e.g. /features/initiative-tracker) from
// the shared seoPages data. Public, pre-auth, prerendered for SEO at build.
export default function FeaturePage() {
  const { slug } = useParams();
  const data = getFeaturePage(slug);

  const faq = data ? featureFaq(data) : [];

  useSeo(data ? {
    title: data.metaTitle,
    description: data.metaDescription,
    path: `/features/${data.slug}`,
    jsonLd: [
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Features', item: `${SITE}/features` },
          { '@type': 'ListItem', position: 2, name: data.h1, item: `${SITE}/features/${data.slug}` },
        ],
      },
    ],
  } : { title: 'Not found | GM/OS' });

  if (!data) return <PageNotFound />;

  const related = (data.related || []).map(getFeaturePage).filter(Boolean);

  return (
    <MarketingShell width="max-w-3xl">
      <nav className="text-xs text-zinc-400 dark:text-zinc-600 mb-4">
        <Link to="/features" className="hover:underline">Features</Link>
        <span className="mx-1.5">/</span>
        <span>{data.h1}</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">{data.h1}</h1>
      <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">{data.intro}</p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link to="/login" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition-colors">
          Get started free <ArrowRight className="w-4 h-4" />
        </Link>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">One campaign free · no credit card.</span>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {data.bullets.map((b) => (
          <div key={b.title} className="rounded-xl border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {b.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{b.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">{PRICING_BLURB}</p>

      {/* FAQ */}
      <h2 className="mt-14 text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">FAQ</h2>
      <div className="space-y-2">
        {faq.map(({ q, a }) => (
          <details key={q} className="group rounded-lg border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 px-4 py-3">
            <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {q}
              <span className="ml-3 text-zinc-400 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>

      {related.length > 0 && (
        <>
          <h2 className="mt-14 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-3">Related features</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((f) => (
              <Link key={f.slug} to={`/features/${f.slug}`} className="text-sm px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                {featureLabel(f)}
              </Link>
            ))}
          </div>
        </>
      )}

      <MarketingCTA />
    </MarketingShell>
  );
}

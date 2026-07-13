import React from 'react';
import { useParams, Link } from 'react-router-dom';
import MarketingShell, { MarketingCTA } from '@/components/layout/MarketingShell';
import PageNotFound from '@/lib/PageNotFound';
import { useSeo } from '@/lib/useSeo';
import { getComparison, COMPARISONS, PRICING_BLURB, SITE, comparisonFaq } from '@/lib/seoPages';
import { Check, ArrowRight } from 'lucide-react';

// Renders a single "GM/OS vs <competitor>" / "<competitor> alternative" page from
// the shared seoPages data. Public, pre-auth, and prerendered for SEO at build.
export default function ComparisonPage() {
  const { slug } = useParams();
  const data = getComparison(slug);

  // Hooks must run unconditionally; feed useSeo safe values, then bail if missing.
  const faq = data ? comparisonFaq(data) : [];

  useSeo(data ? {
    title: data.metaTitle,
    description: data.metaDescription,
    path: `/compare/${data.slug}`,
    jsonLd: [
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Compare', item: `${SITE}/compare` },
          { '@type': 'ListItem', position: 2, name: `${data.competitor} alternative`, item: `${SITE}/compare/${data.slug}` },
        ],
      },
    ],
  } : { title: 'Not found | GM/OS' });

  if (!data) return <PageNotFound />;

  return (
    <MarketingShell width="max-w-4xl">
      <nav className="text-xs text-zinc-400 dark:text-zinc-600 mb-4">
        <Link to="/compare" className="hover:underline">Compare</Link>
        <span className="mx-1.5">/</span>
        <span>{data.competitor} alternative</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">{data.h1}</h1>
      <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">{data.intro}</p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link to="/login" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition-colors">
          Try GM/OS free <ArrowRight className="w-4 h-4" />
        </Link>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">No credit card required.</span>
      </div>

      {/* Comparison table */}
      <h2 className="mt-14 text-xl font-bold text-zinc-900 dark:text-zinc-100">GM/OS vs {data.competitor} at a glance</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800/70">
        <table className="w-full text-sm border-collapse min-w-[36rem]">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/60 text-left">
              <th className="px-4 py-3 font-semibold text-zinc-500 dark:text-zinc-400 w-1/3">Feature</th>
              <th className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">GM/OS</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">{data.competitor}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.feature} className="border-t border-zinc-100 dark:border-zinc-800/60">
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">{r.feature}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.gmos}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">{r.competitor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wins / honest trade-offs */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-300/50 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Where GM/OS wins</h3>
          <ul className="space-y-2.5">
            {data.gmosWins.map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> {w}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-5">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Where {data.competitor} wins</h3>
          <ul className="space-y-2.5">
            {data.competitorWins.map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 flex-shrink-0" /> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-800/70 p-5">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">Which should you pick?</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{data.bestFor}</p>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">{PRICING_BLURB}</p>
      </div>

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

      {/* Other comparisons */}
      <h2 className="mt-14 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-3">Compare with other tools</h2>
      <div className="flex flex-wrap gap-2">
        {COMPARISONS.filter((c) => c.slug !== data.slug).map((c) => (
          <Link key={c.slug} to={`/compare/${c.slug}`} className="text-sm px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
            {c.competitor} alternative
          </Link>
        ))}
      </div>

      <MarketingCTA />
    </MarketingShell>
  );
}

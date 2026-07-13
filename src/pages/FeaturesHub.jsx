import React from 'react';
import { Link } from 'react-router-dom';
import MarketingShell, { MarketingCTA } from '@/components/layout/MarketingShell';
import { useSeo } from '@/lib/useSeo';
import { FEATURE_PAGES, FEATURES_HUB, featureLabel } from '@/lib/seoPages';
import { ArrowRight } from 'lucide-react';

// Hub linking every feature landing page — internal-link surface + a landing
// page for "game master tools" / "dungeon master tools" style queries.
export default function FeaturesHub() {
  useSeo(FEATURES_HUB);
  return (
    <MarketingShell width="max-w-3xl">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Game master tools, all in one place</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
        GM/OS bundles the dungeon master tools you would otherwise juggle across half a dozen tabs — worldbuilding,
        prep, and everything you need at the table. Explore each one:
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {FEATURE_PAGES.map((f) => (
          <Link key={f.slug} to={`/features/${f.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-5 hover:border-amber-500/40 transition-colors">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{featureLabel(f)}</span>
            <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-amber-500 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
      <MarketingCTA />
    </MarketingShell>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import MarketingShell, { MarketingCTA } from '@/components/layout/MarketingShell';
import { useSeo } from '@/lib/useSeo';
import { COMPARISONS, COMPARE_HUB } from '@/lib/seoPages';
import { ArrowRight } from 'lucide-react';

// Hub linking every "GM/OS vs <tool>" comparison — internal-link surface + a
// landing page for "campaign manager comparison" style queries.
export default function CompareHub() {
  useSeo(COMPARE_HUB);
  return (
    <MarketingShell width="max-w-3xl">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">How GM/OS compares</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
        Shopping for a campaign manager? Here is an honest look at how GM/OS stacks up against the popular
        worldbuilding and dungeon master tools — including where each one is the better pick.
      </p>
      <div className="mt-8 grid gap-3">
        {COMPARISONS.map((c) => (
          <Link key={c.slug} to={`/compare/${c.slug}`} className="group flex items-center justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-5 hover:border-amber-500/40 transition-colors">
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">GM/OS vs {c.competitor}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">The {c.competitor} alternative built for the table.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-300 dark:text-zinc-700 group-hover:text-amber-500 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
      <MarketingCTA />
    </MarketingShell>
  );
}

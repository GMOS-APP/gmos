import React from 'react';
import { Link } from 'react-router-dom';
import MarketingShell, { MarketingCTA } from '@/components/layout/MarketingShell';
import { useSeo } from '@/lib/useSeo';
import { COMPARISONS, COMPARE_HUB, GENERIC_COMPARISON } from '@/lib/seoPages';
import { ArrowRight } from 'lucide-react';

// Hub linking every "GM/OS vs <tool>" comparison — internal-link surface + a
// landing page for "campaign manager comparison" style queries.
export default function CompareHub() {
  useSeo(COMPARE_HUB);
  return (
    <MarketingShell width="max-w-3xl">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">How GM/OS compares</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
        Shopping for a TTRPG campaign manager? Here is an honest look at how GM/OS stacks up against the popular
        worldbuilding and dungeon master tools — built for D&amp;D 5e and any tabletop RPG, and including where
        each rival is the better pick.
      </p>

      {/* GM/OS vs Others — category-level table */}
      <h2 className="mt-10 text-xl font-bold text-zinc-900 dark:text-zinc-100">GM/OS vs other campaign managers</h2>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-500">
        Most tools are a wiki you fill in before the game. GM/OS is built to run the game too.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800/70">
        <table className="w-full text-sm border-collapse min-w-[34rem]">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/60 text-left">
              <th className="px-4 py-3 font-semibold text-zinc-500 dark:text-zinc-400 w-1/3">Feature</th>
              <th className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">GM/OS</th>
              <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">{GENERIC_COMPARISON.competitorLabel}</th>
            </tr>
          </thead>
          <tbody>
            {GENERIC_COMPARISON.rows.map((r) => (
              <tr key={r.feature} className="border-t border-zinc-100 dark:border-zinc-800/60">
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">{r.feature}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.gmos}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">{r.others}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-xl font-bold text-zinc-900 dark:text-zinc-100">Compare GM/OS to a specific tool</h2>
      <div className="mt-4 grid gap-3">
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

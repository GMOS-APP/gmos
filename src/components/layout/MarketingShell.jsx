import React from 'react';
import { Link } from 'react-router-dom';
import BetaBadge from '@/components/common/BetaBadge';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { track } from '@/lib/analytics';

// Public marketing chrome (header + footer) for the blog and other pre-auth pages.
export default function MarketingShell({ children, width = 'max-w-3xl' }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-zinc-200/70 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
            GM<span className="text-amber-500">/OS</span>
          </span>
          <BetaBadge />
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link to="/features" className="hidden sm:inline font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Features</Link>
          <Link to="/compare" className="hidden sm:inline font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Compare</Link>
          <Link to="/blog" className="font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Blog</Link>
          <ThemeToggle />
          <Link to="/login" className="font-medium px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors">Sign in</Link>
        </nav>
      </header>

      <main className={`flex-1 w-full ${width} mx-auto px-4 sm:px-6 py-10`}>{children}</main>

      <footer className="mt-auto px-4 sm:px-6 py-6 border-t border-zinc-200/70 dark:border-zinc-800/60">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400 dark:text-zinc-600">
          <Link to="/" className="hover:text-zinc-600 dark:hover:text-zinc-400 hover:underline">Home</Link>
          <Link to="/features" className="hover:text-zinc-600 dark:hover:text-zinc-400 hover:underline">Features</Link>
          <Link to="/compare" className="hover:text-zinc-600 dark:hover:text-zinc-400 hover:underline">Compare</Link>
          <Link to="/blog" className="hover:text-zinc-600 dark:hover:text-zinc-400 hover:underline">Blog</Link>
          <Link to="/PrivacyPolicy" className="hover:text-zinc-600 dark:hover:text-zinc-400 hover:underline">Privacy</Link>
          <Link to="/Terms" className="hover:text-zinc-600 dark:hover:text-zinc-400 hover:underline">Terms</Link>
          <span className="ml-auto">© {new Date().getFullYear()} GM/OS</span>
        </div>
      </footer>
    </div>
  );
}

// Shared call-to-action band used at the foot of every SEO landing page.
export function MarketingCTA({ heading = 'Ready to run your best sessions?', sub = 'Start free — one campaign, every feature, no credit card.' }) {
  return (
    <div className="mt-14 rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/[0.06] px-6 py-10 text-center">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{heading}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{sub}</p>
      <Link
        to="/login"
        onClick={() => track('get_started_clicked', { location: 'marketing_cta' })}
        className="inline-flex items-center px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition-colors"
      >
        Get started free
      </Link>
    </div>
  );
}

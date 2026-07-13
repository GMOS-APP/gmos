import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

// Standalone wrapper for the public legal pages (Privacy, Terms). Works both
// pre-auth (linked from the landing page) and in-app. Pass `draft` to show the
// "pending legal review / replace placeholders" banner — only for pages that
// still contain unfilled [bracketed] placeholders, not finalised live pages.
export default function LegalShell({ title, updated, draft = false, children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
      <header className="border-b border-zinc-200 dark:border-zinc-800/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            GM<span className="text-amber-500">/OS</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Last updated: {updated}</p>

        {draft && (
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
              <strong>Draft — pending legal review.</strong> This template is provided to support compliance and is not
              legal advice. Replace the <span className="font-mono">[bracketed]</span> placeholders and have it reviewed by
              qualified counsel for your jurisdiction(s) before relying on it.
            </p>
          </div>
        )}

        <div className="legal-body mt-8 space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {children}
        </div>

        <footer className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800/70 text-xs text-zinc-400 dark:text-zinc-600">
          <Link to={createPageUrl('PrivacyPolicy')} className="hover:underline">Privacy Policy</Link>
          <span className="mx-2">·</span>
          <Link to={createPageUrl('Terms')} className="hover:underline">Terms of Service</Link>
        </footer>
      </main>
    </div>
  );
}

export function H2({ children }) {
  return <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 pt-2">{children}</h2>;
}
export function P({ children }) {
  return <p>{children}</p>;
}
export function UL({ children }) {
  return <ul className="list-disc pl-5 space-y-1">{children}</ul>;
}

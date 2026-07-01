import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutGrid, Shapes, UserCog, HelpCircle, ShieldCheck } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

// Slim top navigation for the account-level, full-bleed pages (Account Settings,
// Entity Types, Upgrade, About) which otherwise have no chrome to navigate from.
const NAV = [
  { page: 'CampaignList', label: 'Campaigns', to: createPageUrl('CampaignList'), Icon: LayoutGrid },
  { page: 'EntityTypes', label: 'Entity Types', to: createPageUrl('EntityTypes'), Icon: Shapes },
  { page: 'AccountSettings', label: 'Account', to: createPageUrl('AccountSettings'), Icon: UserCog },
  { page: 'Help', label: 'Help', to: createPageUrl('Help'), Icon: HelpCircle },
];

export default function AccountTopBar({ currentPageName }) {
  const { isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center gap-1 px-3 h-12 border-b border-zinc-200 dark:border-zinc-800/70 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
      <Link
        to={createPageUrl('CampaignList')}
        className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 px-2 flex-shrink-0"
      >
        GM/OS
      </Link>
      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />
      <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
        {NAV.map(({ page, label, to, Icon }) => {
          const active = currentPageName === page;
          return (
            <Link
              key={page}
              to={to}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
                active
                  ? 'bg-amber-500/15 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-1 flex-shrink-0">
        {isAdmin && (
          <Link
            to="/admin"
            title="Admin console"
            aria-label="Admin console"
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}

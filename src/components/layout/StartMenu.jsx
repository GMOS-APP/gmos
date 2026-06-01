import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth } from '@/api/entities';
import { CAMPAIGN_NAV_ITEMS, navHref } from '@/lib/navItems';
import { Plus, Search, PanelLeft, FolderOpen, LogOut } from 'lucide-react';
import { MOD_LABEL, ALT_LABEL } from '@/lib/useHotkeys';

// Windows-style Start menu launched from the taskbar. Doubles as the primary
// navigation on mobile (where the sidebar is hidden).
export default function StartMenu({
  open, onClose, campaign, campaignId,
  onOpenPalette, onCreate, onToggleSidebar, sidebarHidden,
}) {
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest('[data-start-button]')) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (href) => { onClose(); navigate(href); };
  const act = (fn) => { onClose(); fn(); };

  const itemClass = 'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50';
  const headingClass = 'px-2 pt-2 pb-1 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-semibold';

  return (
    <div
      ref={ref}
      className="fixed left-2 top-11 z-50 w-72 max-w-[calc(100vw-1rem)] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
    >
      <div className="px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{campaign?.name || 'GM/OS'}</p>
        <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-500">Session #{campaign?.current_session_number || 0}</p>
      </div>

      <div className="p-1.5 max-h-[55vh] overflow-y-auto">
        <p className={headingClass}>Navigate</p>
        {CAMPAIGN_NAV_ITEMS.map((item) => (
          <button key={item.page} onClick={() => go(navHref(item, campaignId))} className={itemClass}>
            <item.Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}

        <div className="my-1.5 border-t border-zinc-100 dark:border-zinc-800" />
        <p className={headingClass}>Actions</p>
        <button onClick={() => act(onCreate)} className={itemClass}>
          <Plus className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          <span>New entity</span>
          <kbd className="ml-auto text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{ALT_LABEL}N</kbd>
        </button>
        <button onClick={() => act(onOpenPalette)} className={itemClass}>
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          <span>Command palette</span>
          <kbd className="ml-auto text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{MOD_LABEL}K</kbd>
        </button>
        <button onClick={() => act(onToggleSidebar)} className={`${itemClass} hidden md:flex`}>
          <PanelLeft className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          <span>{sidebarHidden ? 'Show' : 'Hide'} sidebar</span>
        </button>
      </div>

      <div className="p-1.5 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={() => go(createPageUrl('CampaignList'))} className={itemClass}>
          <FolderOpen className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          <span>All campaigns</span>
        </button>
        <button
          onClick={() => { try { sessionStorage.removeItem('gmos_booted'); } catch { /* ignore */ } auth.logout(); }}
          className={`${itemClass} hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
        >
          <LogOut className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

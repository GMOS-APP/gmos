import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMPAIGN_NAV_ITEMS, navHref } from '@/lib/navItems';
import { createPageUrl } from '@/utils';
import { useWindowManager } from '@/lib/WindowManager';
import { auth } from '@/api/entities';
import FeedbackButton from '@/components/layout/FeedbackButton';
import { PanelLeft, UserCog, LayoutGrid } from 'lucide-react';

// Floating navigation dropdown shown when the sidebar is undocked. Includes a
// "Dock sidebar" action to bring it back to the left, plus the signed-in user
// and a sign-out action so it stands in fully for the docked sidebar.
export default function NavMenu({ open, onClose, campaignId, onDock }) {
  const navigate = useNavigate();
  const wm = useWindowManager();
  const ref = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!open) return;
    auth.me().then(setUser).catch(() => {});
  }, [open]);

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

  const itemClass = 'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50';
  const go = (href) => { onClose(); navigate(href); };
  const openWin = (href) => { onClose(); if (wm) wm.openWindow(href); else navigate(href); };

  return (
    <div ref={ref} className="fixed left-2 top-12 sm:top-11 z-50 w-60 max-w-[calc(100vw-1rem)] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
      <div className="p-1.5 border-b border-zinc-100 dark:border-zinc-800">
        <button onClick={() => go(createPageUrl('CampaignList'))} className={itemClass} title="Back to all campaigns">
          <LayoutGrid className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>All campaigns</span>
        </button>
        <button onClick={() => { onClose(); onDock(); }} className={itemClass} title="Dock to the left">
          <PanelLeft className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Dock sidebar</span>
        </button>
      </div>
      <div className="p-1.5 max-h-[60vh] overflow-y-auto">
        {CAMPAIGN_NAV_ITEMS.map((it) => (
          <button key={it.page} onClick={() => openWin(navHref(it, campaignId))} className={itemClass}>
            <it.Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <span>{it.label}</span>
          </button>
        ))}
      </div>
      <div className="p-1.5 border-t border-zinc-100 dark:border-zinc-800">
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {(user.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{user.full_name || user.email}</span>
          </div>
        )}
        <button onClick={() => go(createPageUrl('AccountSettings'))} className={itemClass}>
          <UserCog className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          <span>Account settings</span>
        </button>
        <FeedbackButton onOpen={onClose} className={itemClass} />
      </div>
    </div>
  );
}

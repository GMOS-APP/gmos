import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth } from '@/api/entities';
import ThemeToggle from '@/components/ui/ThemeToggle';
import {
  Users,
  MapPin,
  Shield,
  Waypoints,
  Package,
  Scroll,
  Sparkles,
  ChevronLeft,
  BookOpen,
  HelpCircle,
  Swords,
  Church,
  Flame,
  ShoppingBag,
  UserCog,
  LogOut,
  LayoutGrid,
} from 'lucide-react';
import { CAMPAIGN_NAV_ITEMS, navHref } from '@/lib/navItems';
import FeedbackButton from '@/components/layout/FeedbackButton';
import { useWindowManager, pageKeyOf, paramsOf } from '@/lib/WindowManager';
import { cn } from '@/lib/utils';

const entityGroups = [
  {
    label: 'Characters',
    items: [
      { type: 'player_character', label: 'PCs', icon: Sparkles },
      { type: 'npc', label: 'NPCs', icon: Users },
      { type: 'deity', label: 'Deities', icon: Church },
    ],
  },
  {
    label: 'Places',
    items: [
      { type: 'location', label: 'Locations', icon: MapPin },
      { type: 'shop', label: 'Shops', icon: ShoppingBag },
    ],
  },
  {
    label: 'Story',
    items: [
      { type: 'thread', label: 'Threads', icon: Waypoints },
      { type: 'event', label: 'Events', icon: Scroll },
      { type: 'faction', label: 'Factions', icon: Shield },
      { type: 'lore', label: 'Lore', icon: BookOpen },
    ],
  },
  {
    label: 'Combat',
    items: [
      { type: 'creature', label: 'Creatures', icon: Swords },
      { type: 'encounter', label: 'Encounters', icon: Flame },
      { type: 'item', label: 'Items', icon: Package },
    ],
  },
];

// Shared style for the compact footer utility icons (matches ThemeToggle).
const iconBtn = 'p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50';

export default function Sidebar({ campaign, collapsed, onToggle, onNavClick }) {
  const location = useLocation();
  const wm = useWindowManager();
  const [user, setUser] = useState(null);

  useEffect(() => {
    auth.me().then(setUser).catch(() => {});
  }, []);

  // Active state follows the focused window (the manager's source of truth),
  // not the top-level route which only reflects the entry page.
  const focused = wm?.windows.find((w) => w.id === wm.focusedId);
  const activeUrl = focused?.url || (location.pathname + location.search);
  const activePage = pageKeyOf(activeUrl);
  const activeType = paramsOf(activeUrl).get('type');

  // Open campaign pages as windows; let other links route normally.
  const openInWindow = (e, href) => {
    if (wm) { e.preventDefault(); wm.openWindow(href); }
    onNavClick?.();
  };

  if (!campaign) return null;

  return (
    <aside
      className={cn(
        "h-full flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/60 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800/60">
        {!collapsed && (
          <Link
            to={createPageUrl('CampaignList')}
            className="text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-widest font-semibold"
          >
            GM/OS
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Campaign name */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/60">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 truncate">{campaign.name}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-500 mt-0.5">Session #{campaign.current_session_number || 0}</p>
        </div>
      )}

      {/* Navigation */}
      <nav data-tour="nav" className="flex-1 overflow-y-auto p-2 space-y-1">
        <Link
          to={createPageUrl('CampaignList')}
          onClick={onNavClick}
          title="Back to all campaigns"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors mb-1 border-b border-zinc-200/60 dark:border-zinc-800/60 rounded-b-none pb-2.5"
        >
          <LayoutGrid className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>All campaigns</span>}
        </Link>
        {CAMPAIGN_NAV_ITEMS.map(({ page, label, Icon, param }) => {
          const isActive = activePage === page;
          const href = navHref({ page, param }, campaign.id);
          return (
            <Link
              key={page}
              data-tour={`nav-${page}`}
              onClick={(e) => openInWindow(e, href)}
              to={href}
              className={cn(
                "relative overflow-hidden flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
                isActive
                  ? "bg-amber-500/15 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium before:absolute before:left-0 before:inset-y-1 before:w-0.5 before:rounded-r-full before:bg-amber-500 dark:before:bg-amber-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        <div data-tour="nav-world">
        {!collapsed && (
          <div className="pt-3 pb-1 px-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600 font-semibold">World</span>
          </div>
        )}

        {entityGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="pt-2 pb-0.5 px-3">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500 font-semibold">{group.label}</span>
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === 'EntityBrowser' && activeType === item.type;
              const href = createPageUrl('EntityBrowser') + `?campaign_id=${campaign.id}&type=${item.type}`;
              return (
                <Link
                  key={item.type}
                  onClick={(e) => openInWindow(e, href)}
                  to={href}
                  className={cn(
                    "relative overflow-hidden flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
                    isActive
                      ? "bg-amber-500/15 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium before:absolute before:left-0 before:inset-y-1 before:w-0.5 before:rounded-r-full before:bg-amber-500 dark:before:bg-amber-400"
                      : "text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/60 space-y-2">
        {/* Utility actions, reduced to icons to save space (labels on hover). */}
        <div className={cn('flex', collapsed ? 'flex-col items-center gap-1' : 'items-center justify-between')}>
          <Link
            to={createPageUrl('Help')}
            onClick={onNavClick}
            title="Manual"
            aria-label="Manual"
            className={iconBtn}
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
          <Link
            to={createPageUrl('AccountSettings')}
            onClick={onNavClick}
            title="Account settings"
            aria-label="Account settings"
            className={iconBtn}
          >
            <UserCog className="w-4 h-4" />
          </Link>
          <FeedbackButton onOpen={onNavClick} iconOnly className={iconBtn} />
          <ThemeToggle />
        </div>
        {/* Sign out — mobile drawer only (desktop has it in the system tray). */}
        <button
          onClick={() => { sessionStorage.removeItem('gmos_booted'); auth.logout(); }}
          className="md:hidden w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign out</span>
        </button>
        {user && !collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200 truncate">{user.full_name || user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
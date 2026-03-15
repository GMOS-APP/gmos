import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth } from '@/api/entities';
import {
  Globe,
  Users,
  MapPin,
  Shield,
  Waypoints,
  Package,
  Scroll,
  Sparkles,
  ChevronLeft,
  LayoutDashboard,
  Search,
  BookOpen,
  Swords,
  Church,
  Flame,
  ShoppingBag,
  Network,
  Map,
  CalendarDays,
  Dices,
  History,
  Eye,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSystem } from '@/lib/systems';

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

export default function Sidebar({ campaign, collapsed, onToggle, onNavClick }) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved ? saved === 'dark' : prefersDark;
    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
  }, []);

  const applyTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.body.style.background = dark ? 'hsl(240 6% 4%)' : 'hsl(0 0% 100%)';
  };

  const toggleTheme = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem('theme', newValue ? 'dark' : 'light');
    applyTheme(newValue);
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
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 hover:bg-zinc-100"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Campaign name */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/60">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 truncate">{campaign.name}</p>
          <p className="text-xs text-gray-600 dark:text-zinc-500 mt-0.5">Session #{campaign.current_session_number || 0}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {[
          { page: 'CampaignDashboard', label: 'Dashboard', icon: LayoutDashboard, query: `?id=${campaign.id}` },
          { page: 'EntityBrowser', label: 'All Entities', icon: Search, query: `?campaign_id=${campaign.id}` },
          { page: 'RelationshipMap', label: 'Relationship Map', icon: Network, query: `?campaign_id=${campaign.id}` },
          { page: 'CampaignMap', label: 'Campaign Map', icon: Map, query: `?campaign_id=${campaign.id}` },
          { page: 'SessionBrowser', label: 'Sessions', icon: CalendarDays, query: `?campaign_id=${campaign.id}` },
          { page: 'RandomTableBrowser', label: 'Random Tables', icon: Dices, query: `?campaign_id=${campaign.id}` },
          { page: 'CampaignTimeline', label: 'Timeline', icon: History, query: `?campaign_id=${campaign.id}` },
          { page: 'PlayerView', label: 'Player View', icon: Eye, query: `?campaign_id=${campaign.id}` },
        ].map(({ page, label, icon: Icon, query }) => {
          const isActive = location.pathname.includes(page.toLowerCase()) || location.search.includes(page.toLowerCase());
          const href = createPageUrl(page) + query;
          return (
            <Link
              key={page}
              onClick={onNavClick}
              to={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-amber-500/10 font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

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
              const isActive = location.search.includes(`type=${item.type}`);
              return (
                <Link
                  key={item.type}
                  onClick={onNavClick}
                  to={createPageUrl('EntityBrowser') + `?campaign_id=${campaign.id}&type=${item.type}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
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
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/60 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-600">
            <Globe className="w-3 h-3" />
            <span>World State</span>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-sm"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
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
            <button
              onClick={() => { sessionStorage.removeItem('gmos_booted'); auth.logout(); }}
              title="Sign out"
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {!collapsed && getSystem(campaign?.system).hasSrdConditions && (
          <p className="text-[10px] text-zinc-600 dark:text-zinc-700 px-1">
            <a href="https://dnd.wizards.com/resources/systems-reference-document" target="_blank" rel="noreferrer" className="hover:text-zinc-500 underline underline-offset-2">D&amp;D SRD 5.1</a>
            {' · © Wizards of the Coast · '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="hover:text-zinc-500 underline underline-offset-2">CC BY 4.0</a>
          </p>
        )}
        {user && collapsed && (
          <button
            onClick={() => { sessionStorage.removeItem('gmos_booted'); auth.logout(); }}
            title="Sign out"
            className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
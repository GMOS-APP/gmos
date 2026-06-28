import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import AuthPanel from '@/components/layout/AuthPanel';
import OverviewAdmin from '@/components/admin/OverviewAdmin';
import BlogAdmin from '@/components/admin/BlogAdmin';
import NewsletterAdmin from '@/components/admin/NewsletterAdmin';
import AnnouncementsAdmin from '@/components/admin/AnnouncementsAdmin';
import ChangelogAdmin from '@/components/admin/ChangelogAdmin';
import FeedbackAdmin from '@/components/admin/FeedbackAdmin';
import UsersAdmin from '@/components/admin/UsersAdmin';
import AppearanceAdmin from '@/components/admin/AppearanceAdmin';
import { callAdmin } from '@/lib/adminApi';
import { Loader2, ShieldAlert, RefreshCw, Sun, Moon, Gauge, Newspaper, Mail, Megaphone, ScrollText, Inbox, Users, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sidebar sections — each is its own routed page under /admin.
const NAV = [
  { to: '/admin', end: true, label: 'Overview', Icon: Gauge },
  { to: '/admin/blog', label: 'Blog', Icon: Newspaper },
  { to: '/admin/newsletter', label: 'Newsletter', Icon: Mail },
  { to: '/admin/announcements', label: 'Announcements', Icon: Megaphone },
  { to: '/admin/changelog', label: 'Changelog', Icon: ScrollText },
  { to: '/admin/feedback', label: 'Feedback', Icon: Inbox },
  { to: '/admin/users', label: 'Users', Icon: Users },
  { to: '/admin/appearance', label: 'Appearance', Icon: Palette },
];

function Center({ children }) {
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">{children}</div>;
}

export default function AdminConsole() {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const [phase, setPhase] = useState('checking'); // checking | signin | denied | ok
  const [refreshKey, setRefreshKey] = useState(0);

  // Light/dark theme — shares the app-wide `theme` key; admin defaults to dark.
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved !== 'light' : true;
  });
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  const toggleTheme = () => setDark((d) => {
    const next = !d;
    localStorage.setItem('theme', next ? 'dark' : 'light');
    return next;
  });

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) { setPhase('signin'); return; }
    callAdmin({ action: 'me' }).then(() => setPhase('ok')).catch(() => setPhase('denied'));
  }, [isAuthenticated, isLoadingAuth]);

  if (phase === 'checking' || isLoadingAuth) {
    return <Center><Loader2 className="w-6 h-6 text-amber-500 animate-spin" /></Center>;
  }
  if (phase === 'signin') {
    return (
      <Center>
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">GM/OS Admin</h1>
          <p className="text-sm text-zinc-500 mb-6">Sign in with an admin account to continue.</p>
          <div className="flex justify-center"><AuthPanel /></div>
        </div>
      </Center>
    );
  }
  if (phase === 'denied') {
    return (
      <Center>
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Access denied</h1>
          <p className="text-sm text-zinc-500 mb-1">{user?.email}</p>
          <p className="text-sm text-zinc-500 mb-6">This account is not an administrator.</p>
          <button onClick={logout} className="text-sm text-amber-600 dark:text-amber-400 hover:underline">Sign out</button>
        </div>
      </Center>
    );
  }

  const linkClass = ({ isActive }) => cn(
    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
    isActive
      ? 'bg-amber-500/15 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium'
      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <span className="font-bold tracking-tight">GM<span className="text-amber-500">/OS</span> <span className="text-zinc-500 font-normal">Admin</span></span>
          <button onClick={() => setRefreshKey((k) => k + 1)} title="Refresh" className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"><RefreshCw className="w-4 h-4" /></button>
          <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
            <span className="hidden sm:inline">{user?.email}</span>
            <button onClick={toggleTheme} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <a href={import.meta.env.BASE_URL} className="hover:text-zinc-700 dark:hover:text-zinc-300">← App</a>
            <button onClick={logout} className="hover:text-zinc-700 dark:hover:text-zinc-300">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar nav (horizontal scroll on mobile, column on desktop) */}
        <nav className="flex md:flex-col gap-1 md:w-52 md:shrink-0 overflow-x-auto -mx-1 px-1 md:mx-0 md:px-0">
          {NAV.map(({ to, end, label, Icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Active section */}
        <main className="flex-1 min-w-0" key={refreshKey}>
          <Routes>
            <Route index element={<OverviewAdmin />} />
            <Route path="blog" element={<BlogAdmin />} />
            <Route path="newsletter" element={<NewsletterAdmin />} />
            <Route path="announcements" element={<AnnouncementsAdmin />} />
            <Route path="changelog" element={<ChangelogAdmin />} />
            <Route path="feedback" element={<FeedbackAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="appearance" element={<AppearanceAdmin />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

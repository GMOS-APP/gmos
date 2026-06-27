import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import AuthPanel from '@/components/layout/AuthPanel';
import BlogAdmin from '@/components/admin/BlogAdmin';
import NewsletterAdmin from '@/components/admin/NewsletterAdmin';
import AnnouncementsAdmin from '@/components/admin/AnnouncementsAdmin';
import ChangelogAdmin from '@/components/admin/ChangelogAdmin';
import FeedbackAdmin from '@/components/admin/FeedbackAdmin';
import { callAdmin, INPUT, CARD } from '@/lib/adminApi';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, ShieldAlert, Users, Crown, BookOpen, Layers, Boxes, Trash2, RefreshCw, Check, Palette, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Setting } from '@/api/entities';
import { applyAccent, clearAccent, setAccentCached, DEFAULT_ACCENT } from '@/lib/theme';

const ACCENT_PRESETS = [
  { name: 'Signal', hex: DEFAULT_ACCENT },
  { name: 'Ember', hex: '#e11d48' },
  { name: 'Gold', hex: '#d4a017' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Ocean', hex: '#2563eb' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Magenta', hex: '#db2777' },
  { name: 'Slate', hex: '#64748b' },
];

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
      <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest mb-1.5">
        <Icon className="w-3.5 h-3.5 text-amber-500" /> {label}
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{value}</p>
    </div>
  );
}

export default function AdminConsole() {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const [phase, setPhase] = useState('checking'); // checking | signin | denied | ok
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(null);
  // Bumped by the global Refresh button to remount the self-loading sections.
  const [refreshKey, setRefreshKey] = useState(0);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);  // current picker value (live preview)
  const [savedAccent, setSavedAccent] = useState(null);  // persisted value, null = default
  const [accentBusy, setAccentBusy] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [delConfirm, setDelConfirm] = useState('');

  // Light/dark theme — shares the app-wide `theme` localStorage key; admin defaults to dark.
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved !== 'light' : true;
  });
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  const toggleTheme = () => {
    setDark((d) => {
      const next = !d;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // If the admin previews a color but navigates away without saving, restore the persisted accent.
  const savedAccentRef = React.useRef(null);
  useEffect(() => { savedAccentRef.current = savedAccent; }, [savedAccent]);
  useEffect(() => () => {
    if (savedAccentRef.current) applyAccent(savedAccentRef.current); else clearAccent();
  }, []);

  const load = useCallback(async () => {
    const [s, u] = await Promise.all([
      callAdmin({ action: 'stats' }), callAdmin({ action: 'users' }),
    ]);
    setStats(s.stats);
    setUsers(u.users);
    // Brand accent (public read on app_settings); null/absent → default.
    try {
      const rows = await Setting.filter({ id: 'global' });
      const cur = rows?.[0]?.accent || null;
      setSavedAccent(cur);
      setAccent(cur || DEFAULT_ACCENT);
    } catch { /* keep default */ }
  }, []);

  // Live-preview the picker; restore the saved accent if the admin leaves without saving.
  const previewAccent = (hex) => { setAccent(hex); applyAccent(hex); };
  const saveAccent = async () => {
    setAccentBusy(true);
    try {
      await callAdmin({ action: 'set-accent', accent: accent });
      setAccentCached(accent);
      setSavedAccent(accent);
    } catch (e) { alert(e.message || 'Could not save color'); }
    finally { setAccentBusy(false); }
  };
  const resetAccent = async () => {
    setAccentBusy(true);
    try {
      await callAdmin({ action: 'set-accent', accent: null });
      clearAccent();
      setAccentCached(null);
      setSavedAccent(null);
      setAccent(DEFAULT_ACCENT);
    } catch (e) { alert(e.message || 'Could not reset color'); }
    finally { setAccentBusy(false); }
  };
  const accentDirty = (savedAccent || DEFAULT_ACCENT).toLowerCase() !== accent.toLowerCase();

  // Refresh the inline data (stats/users) and remount the self-loading sections.
  const refreshAll = () => { setRefreshKey((k) => k + 1); load(); };

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) { setPhase('signin'); return; }
    (async () => {
      try {
        await callAdmin({ action: 'me' });
        await load();
        setPhase('ok');
      } catch {
        setPhase('denied');
      }
    })();
  }, [isAuthenticated, isLoadingAuth, load]);

  const setPlan = async (u, plan) => {
    setBusy(u.id);
    try {
      await callAdmin({ action: 'set-plan', userId: u.id, plan });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, plan } : x)));
    } finally { setBusy(null); }
  };

  const doDelete = async () => {
    if (!delTarget) return;
    setBusy(delTarget.id);
    try {
      await callAdmin({ action: 'delete-user', userId: delTarget.id, confirm: true });
      setUsers((prev) => prev.filter((x) => x.id !== delTarget.id));
      setDelTarget(null); setDelConfirm('');
    } catch (e) {
      alert(e.message || 'Delete failed');
    } finally { setBusy(null); }
  };

  const ThemeButton = (
    <button onClick={toggleTheme} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );

  // ---- gates ----
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

  // ---- console ----
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <span className="font-bold tracking-tight">GM<span className="text-amber-500">/OS</span> <span className="text-zinc-500 font-normal">Admin</span></span>
          <button onClick={refreshAll} title="Refresh" className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"><RefreshCw className="w-4 h-4" /></button>
          <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
            <span className="hidden sm:inline">{user?.email}</span>
            {ThemeButton}
            <a href={import.meta.env.BASE_URL} className="hover:text-zinc-700 dark:hover:text-zinc-300">← App</a>
            <button onClick={logout} className="hover:text-zinc-700 dark:hover:text-zinc-300">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard icon={Users} label="Users" value={stats.users} />
            <StatCard icon={Crown} label="Plus" value={stats.plus} />
            <StatCard icon={BookOpen} label="Campaigns" value={stats.campaigns} />
            <StatCard icon={Layers} label="Sessions" value={stats.sessions} />
            <StatCard icon={Boxes} label="Entities" value={stats.entities} />
          </div>
        )}

        {/* Appearance */}
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            <Palette className="w-3.5 h-3.5 text-amber-500" /> Appearance
          </h2>
          <div className={cn(CARD, 'p-4')}>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Brand accent color, applied to every user across the app.</p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="relative w-14 h-14 rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden cursor-pointer shrink-0" style={{ background: accent }} title="Pick a custom color">
                <input type="color" value={accent} onChange={(e) => previewAccent(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200 uppercase">{accent}</span>
                <span className="text-[11px] text-zinc-500">
                  {savedAccent ? 'Custom accent saved' : 'Using default signal-orange'}
                  {accentDirty && <span className="text-amber-600 dark:text-amber-400"> · unsaved preview</span>}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                {ACCENT_PRESETS.map((p) => (
                  <button key={p.hex} onClick={() => previewAccent(p.hex)} title={p.name}
                    className={cn('w-7 h-7 rounded-md border transition', accent.toLowerCase() === p.hex.toLowerCase() ? 'border-zinc-900 ring-2 ring-zinc-900/20 dark:border-zinc-100 dark:ring-zinc-100/30' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-500')}
                    style={{ background: p.hex }} />
                ))}
              </div>
            </div>
            {/* Live swatch row — these use the accent (amber) scale so they update with the preview */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500 text-zinc-950 font-medium">Primary button</span>
              <span className="text-xs px-2.5 py-1 rounded-md border border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">Accent tag</span>
              <span className="text-amber-500 text-sm font-semibold">Accent text</span>
              <span className="w-5 h-5 rounded-full bg-amber-500 inline-block" />
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button onClick={resetAccent} disabled={accentBusy || (!savedAccent && !accentDirty)}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-40">Reset to default</button>
              {accentDirty && <button onClick={() => previewAccent(savedAccent || DEFAULT_ACCENT)} disabled={accentBusy}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-40">Discard</button>}
              <button onClick={saveAccent} disabled={accentBusy || !accentDirty}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium">
                {accentBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save color
              </button>
            </div>
          </div>
        </section>

        {/* Announcements */}
        <AnnouncementsAdmin key={`ann-${refreshKey}`} />

        {/* Changelog */}
        <ChangelogAdmin key={`cl-${refreshKey}`} />

        {/* Blog */}
        <BlogAdmin key={`blog-${refreshKey}`} />

        {/* Newsletter */}
        <NewsletterAdmin key={`nl-${refreshKey}`} />

        {/* Users */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Users ({users.length})</h2>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-100 dark:bg-zinc-900/60 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">User</th>
                    <th className="text-left font-medium px-3 py-2">Plan</th>
                    <th className="text-right font-medium px-3 py-2">Campaigns</th>
                    <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Joined</th>
                    <th className="text-left font-medium px-3 py-2 hidden lg:table-cell">Last seen</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/70">
                  {users.map((u) => (
                    <tr key={u.id} className="bg-white dark:bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[220px]">{u.email}</span>
                          {u.is_admin && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded px-1">ADMIN</span>}
                        </div>
                        {u.name && <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{u.name} · {u.provider}</span>}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={u.plan}
                          disabled={busy === u.id || u.is_admin}
                          onChange={(e) => setPlan(u, e.target.value)}
                          className={cn('text-xs px-1.5 py-1 disabled:opacity-50', INPUT)}
                        >
                          <option value="free">free</option>
                          <option value="monthly">monthly</option>
                          <option value="yearly">yearly</option>
                          <option value="lifetime">lifetime</option>
                          {u.plan === 'plus' && <option value="plus">plus (legacy)</option>}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{u.campaigns}</td>
                      <td className="px-3 py-2 text-zinc-500 hidden md:table-cell">{fmtDate(u.created_at)}</td>
                      <td className="px-3 py-2 text-zinc-500 hidden lg:table-cell">{fmtDate(u.last_sign_in_at)}</td>
                      <td className="px-3 py-2 text-right">
                        {!u.is_admin && (
                          <button
                            onClick={() => { setDelTarget(u); setDelConfirm(''); }}
                            disabled={busy === u.id}
                            title="Delete user"
                            className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
                          >
                            {busy === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Feedback inbox */}
        <FeedbackAdmin key={`fb-${refreshKey}`} />
      </main>

      {/* Delete confirmation */}
      <Dialog open={!!delTarget} onOpenChange={(o) => { if (!o) { setDelTarget(null); setDelConfirm(''); } }}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">Delete user?</DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-zinc-400">
              Permanently erases <span className="font-medium">{delTarget?.email}</span> and all their campaigns and data.
              There is no recovery. Type the email to confirm.
            </DialogDescription>
          </DialogHeader>
          <input
            value={delConfirm}
            onChange={(e) => setDelConfirm(e.target.value)}
            placeholder={delTarget?.email}
            className="rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-red-500/50"
            autoFocus
          />
          <DialogFooter>
            <button onClick={() => { setDelTarget(null); setDelConfirm(''); }} className="text-sm text-zinc-600 dark:text-zinc-400 px-3">Cancel</button>
            <button
              onClick={doDelete}
              disabled={delConfirm !== delTarget?.email || busy === delTarget?.id}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold px-3 py-2"
            >
              {busy === delTarget?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete forever
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Center({ children }) {
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">{children}</div>;
}

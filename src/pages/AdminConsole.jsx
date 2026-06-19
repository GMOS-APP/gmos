import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import AuthPanel from '@/components/layout/AuthPanel';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, ShieldAlert, Users, Crown, BookOpen, Layers, Boxes, Trash2, RefreshCw, Bug, Lightbulb, LifeBuoy, Check, Inbox, RotateCcw, Megaphone, Pencil, ScrollText, Palette, Sun, Moon, Newspaper, ExternalLink } from 'lucide-react';
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

const FB_META = {
  bug: { label: 'Bug', Icon: Bug, color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30' },
  feedback: { label: 'Idea', Icon: Lightbulb, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' },
  help: { label: 'Help', Icon: LifeBuoy, color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30' },
};

const parseEntries = (text) => (text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const m = l.match(/^(new|improved|fixed):\s*(.*)$/i);
  return m ? { type: m[1].toLowerCase(), text: m[2] } : { type: 'new', text: l };
});
const entriesToText = (entries) => (entries || []).map((e) => `${e.type}: ${e.text}`).join('\n');

function callAdmin(body) {
  return supabase.functions.invoke('admin-api', { body }).then(({ data, error }) => {
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  });
}

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

// Shared input styling — light/dark aware.
const INPUT = 'rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500/50';
const CARD = 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40';
const ROW = 'rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40';

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
  const [feedback, setFeedback] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [annDraft, setAnnDraft] = useState({ title: '', body: '', level: 'info', published: false });
  const [changelog, setChangelog] = useState([]);
  const [clDraft, setClDraft] = useState({ version: '', date: '', entriesText: '', published: true });
  const [posts, setPosts] = useState([]);
  const emptyPost = { title: '', slug: '', category: 'GM Tips', excerpt: '', body: '', published: false };
  const [postDraft, setPostDraft] = useState(emptyPost);
  const [busy, setBusy] = useState(null);
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
    const [s, u, f, a, c, b] = await Promise.all([
      callAdmin({ action: 'stats' }), callAdmin({ action: 'users' }),
      callAdmin({ action: 'feedback-list' }), callAdmin({ action: 'announcement-list' }),
      callAdmin({ action: 'changelog-list' }), callAdmin({ action: 'blog-list' }),
    ]);
    setStats(s.stats);
    setUsers(u.users);
    setFeedback(f.feedback);
    setAnnouncements(a.announcements);
    setChangelog(c.changelog);
    setPosts(b.posts);
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

  const saveCl = async () => {
    if (!clDraft.version.trim()) return;
    const { entry } = await callAdmin({ action: 'changelog-save', entry: {
      id: clDraft.id, version: clDraft.version.trim(), date: clDraft.date,
      entries: parseEntries(clDraft.entriesText), published: clDraft.published,
    } });
    setChangelog((prev) => (prev.some((x) => x.id === entry.id)
      ? prev.map((x) => (x.id === entry.id ? entry : x))
      : [entry, ...prev]).sort((a, b) => (b.version || '').localeCompare(a.version || '')));
    setClDraft({ version: '', date: '', entriesText: '', published: true });
  };
  const togglePubCl = async (c) => {
    const published = !c.published;
    setChangelog((prev) => prev.map((x) => (x.id === c.id ? { ...x, published } : x)));
    await callAdmin({ action: 'changelog-save', entry: { ...c, entries: c.entries, published } });
  };
  const delCl = async (c) => {
    setChangelog((prev) => prev.filter((x) => x.id !== c.id));
    await callAdmin({ action: 'changelog-delete', id: c.id });
  };

  const saveAnn = async () => {
    if (!annDraft.title.trim()) return;
    const { announcement } = await callAdmin({ action: 'announcement-save', announcement: annDraft });
    setAnnouncements((prev) => (prev.some((x) => x.id === announcement.id)
      ? prev.map((x) => (x.id === announcement.id ? announcement : x))
      : [announcement, ...prev]));
    setAnnDraft({ title: '', body: '', level: 'info', published: false });
  };
  const togglePub = async (a) => {
    const published = !a.published;
    setAnnouncements((prev) => prev.map((x) => (x.id === a.id ? { ...x, published } : x)));
    await callAdmin({ action: 'announcement-save', announcement: { ...a, published } });
  };
  const delAnn = async (a) => {
    setAnnouncements((prev) => prev.filter((x) => x.id !== a.id));
    await callAdmin({ action: 'announcement-delete', id: a.id });
  };

  const savePost = async () => {
    if (!postDraft.title.trim()) return;
    const { post } = await callAdmin({ action: 'blog-save', post: postDraft });
    setPosts((prev) => (prev.some((x) => x.id === post.id)
      ? prev.map((x) => (x.id === post.id ? post : x))
      : [post, ...prev]));
    setPostDraft(emptyPost);
  };
  const editPost = (p) => setPostDraft({
    id: p.id, title: p.title, slug: p.slug, category: p.category || 'GM Tips',
    excerpt: p.excerpt || '', body: p.body || '', published: p.published, published_at: p.published_at,
  });
  const togglePubPost = async (p) => {
    const { post } = await callAdmin({ action: 'blog-save', post: { ...p, published: !p.published } });
    setPosts((prev) => prev.map((x) => (x.id === post.id ? post : x)));
  };
  const delPost = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    setPosts((prev) => prev.filter((x) => x.id !== p.id));
    await callAdmin({ action: 'blog-delete', id: p.id });
  };

  const fbStatus = async (f, status) => {
    setFeedback((prev) => prev.map((x) => (x.id === f.id ? { ...x, status } : x)));
    await callAdmin({ action: 'feedback-status', id: f.id, status });
  };
  const fbDelete = async (f) => {
    setFeedback((prev) => prev.filter((x) => x.id !== f.id));
    await callAdmin({ action: 'feedback-delete', id: f.id });
  };

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
          <button onClick={load} title="Refresh" className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"><RefreshCw className="w-4 h-4" /></button>
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
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            <Megaphone className="w-3.5 h-3.5 text-amber-500" /> Announcements
          </h2>
          <div className={cn(CARD, 'p-3 space-y-2 mb-3')}>
            <input value={annDraft.title} onChange={(e) => setAnnDraft({ ...annDraft, title: e.target.value })}
              placeholder="Title" className={cn('w-full text-sm px-2.5 py-1.5', INPUT)} />
            <textarea value={annDraft.body} onChange={(e) => setAnnDraft({ ...annDraft, body: e.target.value })}
              placeholder="Body (optional)" rows={2} className={cn('w-full text-sm px-2.5 py-1.5 resize-none', INPUT)} />
            <div className="flex items-center gap-2">
              <select value={annDraft.level} onChange={(e) => setAnnDraft({ ...annDraft, level: e.target.value })}
                className={cn('text-xs px-1.5 py-1', INPUT)}>
                <option value="info">info</option><option value="warning">warning</option><option value="success">success</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <input type="checkbox" checked={annDraft.published} onChange={(e) => setAnnDraft({ ...annDraft, published: e.target.checked })} /> Published
              </label>
              {annDraft.id && (
                <button onClick={() => setAnnDraft({ title: '', body: '', level: 'info', published: false })} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Cancel</button>
              )}
              <button onClick={saveAnn} disabled={!annDraft.title.trim()}
                className="ml-auto px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium">
                {annDraft.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {announcements.length === 0 && <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-3">No announcements yet.</p>}
            {announcements.map((a) => (
              <div key={a.id} className={cn('flex items-center gap-2 px-3 py-2', ROW)}>
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                  a.level === 'warning' ? 'text-red-600 dark:text-red-400 border-red-500/30' : a.level === 'success' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'text-amber-600 dark:text-amber-400 border-amber-500/30')}>{a.level}</span>
                <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate flex-1">{a.title}</span>
                <span className={cn('text-[10px] font-medium', a.published ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500')}>{a.published ? 'Published' : 'Draft'}</span>
                <button onClick={() => togglePub(a)} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">{a.published ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => setAnnDraft({ id: a.id, title: a.title, body: a.body || '', level: a.level, published: a.published })} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => delAnn(a)} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </section>

        {/* Changelog */}
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            <ScrollText className="w-3.5 h-3.5 text-amber-500" /> Changelog
          </h2>
          <div className={cn(CARD, 'p-3 space-y-2 mb-3')}>
            <div className="flex gap-2">
              <input value={clDraft.version} onChange={(e) => setClDraft({ ...clDraft, version: e.target.value })}
                placeholder="Version (e.g. 2026-06-04)" className={cn('flex-1 text-sm px-2.5 py-1.5 font-mono', INPUT)} />
              <input value={clDraft.date} onChange={(e) => setClDraft({ ...clDraft, date: e.target.value })}
                placeholder="Date label (Jun 4, 2026)" className={cn('flex-1 text-sm px-2.5 py-1.5', INPUT)} />
            </div>
            <textarea value={clDraft.entriesText} onChange={(e) => setClDraft({ ...clDraft, entriesText: e.target.value })}
              placeholder={'One change per line. Prefix with new: / improved: / fixed:\nnew: Added a thing\nfixed: Squashed a bug'}
              rows={4} className={cn('w-full text-sm px-2.5 py-1.5 resize-none font-mono', INPUT)} />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <input type="checkbox" checked={clDraft.published} onChange={(e) => setClDraft({ ...clDraft, published: e.target.checked })} /> Published
              </label>
              {clDraft.id && <button onClick={() => setClDraft({ version: '', date: '', entriesText: '', published: true })} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Cancel</button>}
              <button onClick={saveCl} disabled={!clDraft.version.trim()}
                className="ml-auto px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium">
                {clDraft.id ? 'Update' : 'Add release'}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {changelog.map((c) => (
              <div key={c.id} className={cn('flex items-center gap-2 px-3 py-2', ROW)}>
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{c.version}</span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-600 truncate flex-1">{(c.entries || []).length} change{(c.entries || []).length !== 1 ? 's' : ''}{c.date ? ` · ${c.date}` : ''}</span>
                <span className={cn('text-[10px] font-medium', c.published ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500')}>{c.published ? 'Published' : 'Draft'}</span>
                <button onClick={() => togglePubCl(c)} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">{c.published ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => setClDraft({ id: c.id, version: c.version, date: c.date || '', entriesText: entriesToText(c.entries), published: c.published })} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => delCl(c)} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </section>

        {/* Blog */}
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            <Newspaper className="w-3.5 h-3.5 text-amber-500" /> Blog
          </h2>
          <div className={cn(CARD, 'p-3 space-y-2 mb-3')}>
            <input value={postDraft.title} onChange={(e) => setPostDraft({ ...postDraft, title: e.target.value })}
              placeholder="Post title" className={cn('w-full text-sm px-2.5 py-1.5', INPUT)} />
            <div className="flex gap-2">
              <input value={postDraft.slug} onChange={(e) => setPostDraft({ ...postDraft, slug: e.target.value })}
                placeholder="slug (auto from title if blank)" className={cn('flex-1 text-sm px-2.5 py-1.5 font-mono', INPUT)} />
              <input value={postDraft.category} onChange={(e) => setPostDraft({ ...postDraft, category: e.target.value })}
                placeholder="Category" className={cn('w-44 text-sm px-2.5 py-1.5', INPUT)} />
            </div>
            <textarea value={postDraft.excerpt} onChange={(e) => setPostDraft({ ...postDraft, excerpt: e.target.value })}
              placeholder="Excerpt — shown on the blog index" rows={2} className={cn('w-full text-sm px-2.5 py-1.5 resize-none', INPUT)} />
            <textarea value={postDraft.body} onChange={(e) => setPostDraft({ ...postDraft, body: e.target.value })}
              placeholder={'Body — Markdown supported:\n## Heading\n**bold**, *italic*\n- bullet\n[link](https://…)'}
              rows={10} className={cn('w-full text-sm px-2.5 py-1.5 resize-y font-mono', INPUT)} />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <input type="checkbox" checked={postDraft.published} onChange={(e) => setPostDraft({ ...postDraft, published: e.target.checked })} /> Published
              </label>
              {postDraft.id && <button onClick={() => setPostDraft(emptyPost)} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Cancel</button>}
              <button onClick={savePost} disabled={!postDraft.title.trim()}
                className="ml-auto px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium">
                {postDraft.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {posts.length === 0 && <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-3">No posts yet.</p>}
            {posts.map((p) => (
              <div key={p.id} className={cn('flex items-center gap-2 px-3 py-2', ROW)}>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">{p.category}</span>
                <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate flex-1">{p.title}</span>
                <span className={cn('text-[10px] font-medium shrink-0', p.published ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500')}>{p.published ? 'Published' : 'Draft'}</span>
                {p.published && <a href={`${import.meta.env.BASE_URL}blog/${p.slug}`} target="_blank" rel="noopener noreferrer" title="View post" className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300"><ExternalLink className="w-3.5 h-3.5" /></a>}
                <button onClick={() => togglePubPost(p)} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">{p.published ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => editPost(p)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => delPost(p)} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </section>

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
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              <Inbox className="w-3.5 h-3.5 text-amber-500" /> Feedback ({feedback.filter((f) => f.status !== 'resolved').length} open)
            </h2>
            <button onClick={() => setShowResolved((v) => !v)} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              {showResolved ? 'Hide resolved' : 'Show resolved'}
            </button>
          </div>
          <div className="space-y-2">
            {feedback.filter((f) => showResolved || f.status !== 'resolved').length === 0 && (
              <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-6">No {showResolved ? '' : 'open '}feedback.</p>
            )}
            {feedback.filter((f) => showResolved || f.status !== 'resolved').map((f) => {
              const m = FB_META[f.type] || FB_META.feedback;
              const resolved = f.status === 'resolved';
              return (
                <div key={f.id} className={cn(CARD, 'p-3', resolved && 'opacity-60')}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1', m.color)}>
                      <m.Icon className="w-3 h-3" /> {m.label}
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">{f.user_email || 'anonymous'}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{fmtDate(f.created_date)}</span>
                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => fbStatus(f, resolved ? 'open' : 'resolved')} title={resolved ? 'Reopen' : 'Mark resolved'}
                        className={cn('w-6 h-6 flex items-center justify-center rounded', resolved ? 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300' : 'text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400')}>
                        {resolved ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => fbDelete(f)} title="Delete" className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{f.message}</p>
                  {f.page && <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1.5 font-mono truncate">{f.page}</p>}
                </div>
              );
            })}
          </div>
        </section>
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

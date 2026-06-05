import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import AuthPanel from '@/components/layout/AuthPanel';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, ShieldAlert, Users, Crown, BookOpen, Layers, Boxes, Trash2, RefreshCw, Bug, Lightbulb, LifeBuoy, Check, Inbox, RotateCcw, Megaphone, Pencil, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

const FB_META = {
  bug: { label: 'Bug', Icon: Bug, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  feedback: { label: 'Idea', Icon: Lightbulb, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  help: { label: 'Help', Icon: LifeBuoy, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
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

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest mb-1.5">
        <Icon className="w-3.5 h-3.5 text-amber-500" /> {label}
      </div>
      <p className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</p>
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
  const [busy, setBusy] = useState(null);
  const [showResolved, setShowResolved] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [delConfirm, setDelConfirm] = useState('');

  useEffect(() => { document.documentElement.classList.add('dark'); }, []);

  const load = useCallback(async () => {
    const [s, u, f, a, c] = await Promise.all([
      callAdmin({ action: 'stats' }), callAdmin({ action: 'users' }),
      callAdmin({ action: 'feedback-list' }), callAdmin({ action: 'announcement-list' }),
      callAdmin({ action: 'changelog-list' }),
    ]);
    setStats(s.stats);
    setUsers(u.users);
    setFeedback(f.feedback);
    setAnnouncements(a.announcements);
    setChangelog(c.changelog);
  }, []);

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

  // ---- gates ----
  if (phase === 'checking' || isLoadingAuth) {
    return <Center><Loader2 className="w-6 h-6 text-amber-500 animate-spin" /></Center>;
  }
  if (phase === 'signin') {
    return (
      <Center>
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-zinc-100 mb-1">GM/OS Admin</h1>
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
          <h1 className="text-xl font-bold text-zinc-100 mb-1">Access denied</h1>
          <p className="text-sm text-zinc-500 mb-1">{user?.email}</p>
          <p className="text-sm text-zinc-500 mb-6">This account is not an administrator.</p>
          <button onClick={logout} className="text-sm text-amber-400 hover:underline">Sign out</button>
        </div>
      </Center>
    );
  }

  // ---- console ----
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 sticky top-0 z-10 bg-zinc-950/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <span className="font-bold tracking-tight">GM<span className="text-amber-500">/OS</span> <span className="text-zinc-500 font-normal">Admin</span></span>
          <button onClick={load} title="Refresh" className="text-zinc-500 hover:text-zinc-300"><RefreshCw className="w-4 h-4" /></button>
          <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
            <span className="hidden sm:inline">{user?.email}</span>
            <a href={import.meta.env.BASE_URL} className="hover:text-zinc-300">← App</a>
            <button onClick={logout} className="hover:text-zinc-300">Sign out</button>
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

        {/* Announcements */}
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            <Megaphone className="w-3.5 h-3.5 text-amber-500" /> Announcements
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2 mb-3">
            <input value={annDraft.title} onChange={(e) => setAnnDraft({ ...annDraft, title: e.target.value })}
              placeholder="Title" className="w-full text-sm rounded-md border border-zinc-700 bg-zinc-950 text-zinc-100 px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50" />
            <textarea value={annDraft.body} onChange={(e) => setAnnDraft({ ...annDraft, body: e.target.value })}
              placeholder="Body (optional)" rows={2} className="w-full text-sm rounded-md border border-zinc-700 bg-zinc-950 text-zinc-200 px-2.5 py-1.5 resize-none focus:outline-none focus:border-amber-500/50" />
            <div className="flex items-center gap-2">
              <select value={annDraft.level} onChange={(e) => setAnnDraft({ ...annDraft, level: e.target.value })}
                className="text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-200 px-1.5 py-1 focus:outline-none">
                <option value="info">info</option><option value="warning">warning</option><option value="success">success</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <input type="checkbox" checked={annDraft.published} onChange={(e) => setAnnDraft({ ...annDraft, published: e.target.checked })} /> Published
              </label>
              {annDraft.id && (
                <button onClick={() => setAnnDraft({ title: '', body: '', level: 'info', published: false })} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
              )}
              <button onClick={saveAnn} disabled={!annDraft.title.trim()}
                className="ml-auto px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium">
                {annDraft.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {announcements.length === 0 && <p className="text-sm text-zinc-600 text-center py-3">No announcements yet.</p>}
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                  a.level === 'warning' ? 'text-red-400 border-red-500/30' : a.level === 'success' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30')}>{a.level}</span>
                <span className="text-sm text-zinc-200 truncate flex-1">{a.title}</span>
                <span className={cn('text-[10px] font-medium', a.published ? 'text-emerald-400' : 'text-zinc-500')}>{a.published ? 'Published' : 'Draft'}</span>
                <button onClick={() => togglePub(a)} className="text-xs text-zinc-400 hover:text-zinc-200">{a.published ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => setAnnDraft({ id: a.id, title: a.title, body: a.body || '', level: a.level, published: a.published })} className="text-zinc-500 hover:text-zinc-300"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => delAnn(a)} className="text-zinc-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </section>

        {/* Changelog */}
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            <ScrollText className="w-3.5 h-3.5 text-amber-500" /> Changelog
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2 mb-3">
            <div className="flex gap-2">
              <input value={clDraft.version} onChange={(e) => setClDraft({ ...clDraft, version: e.target.value })}
                placeholder="Version (e.g. 2026-06-04)" className="flex-1 text-sm rounded-md border border-zinc-700 bg-zinc-950 text-zinc-100 px-2.5 py-1.5 font-mono focus:outline-none focus:border-amber-500/50" />
              <input value={clDraft.date} onChange={(e) => setClDraft({ ...clDraft, date: e.target.value })}
                placeholder="Date label (Jun 4, 2026)" className="flex-1 text-sm rounded-md border border-zinc-700 bg-zinc-950 text-zinc-200 px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50" />
            </div>
            <textarea value={clDraft.entriesText} onChange={(e) => setClDraft({ ...clDraft, entriesText: e.target.value })}
              placeholder={'One change per line. Prefix with new: / improved: / fixed:\nnew: Added a thing\nfixed: Squashed a bug'}
              rows={4} className="w-full text-sm rounded-md border border-zinc-700 bg-zinc-950 text-zinc-200 px-2.5 py-1.5 resize-none font-mono focus:outline-none focus:border-amber-500/50" />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <input type="checkbox" checked={clDraft.published} onChange={(e) => setClDraft({ ...clDraft, published: e.target.checked })} /> Published
              </label>
              {clDraft.id && <button onClick={() => setClDraft({ version: '', date: '', entriesText: '', published: true })} className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>}
              <button onClick={saveCl} disabled={!clDraft.version.trim()}
                className="ml-auto px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium">
                {clDraft.id ? 'Update' : 'Add release'}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {changelog.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                <span className="text-xs font-mono text-zinc-400">{c.version}</span>
                <span className="text-[11px] text-zinc-600 truncate flex-1">{(c.entries || []).length} change{(c.entries || []).length !== 1 ? 's' : ''}{c.date ? ` · ${c.date}` : ''}</span>
                <span className={cn('text-[10px] font-medium', c.published ? 'text-emerald-400' : 'text-zinc-500')}>{c.published ? 'Published' : 'Draft'}</span>
                <button onClick={() => togglePubCl(c)} className="text-xs text-zinc-400 hover:text-zinc-200">{c.published ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => setClDraft({ id: c.id, version: c.version, date: c.date || '', entriesText: entriesToText(c.entries), published: c.published })} className="text-zinc-500 hover:text-zinc-300"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => delCl(c)} className="text-zinc-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </section>

        {/* Users */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Users ({users.length})</h2>
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900/60 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">User</th>
                    <th className="text-left font-medium px-3 py-2">Plan</th>
                    <th className="text-right font-medium px-3 py-2">Campaigns</th>
                    <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Joined</th>
                    <th className="text-left font-medium px-3 py-2 hidden lg:table-cell">Last seen</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-900/40">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-200 truncate max-w-[220px]">{u.email}</span>
                          {u.is_admin && <span className="text-[10px] font-bold text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded px-1">ADMIN</span>}
                        </div>
                        {u.name && <span className="text-[11px] text-zinc-600">{u.name} · {u.provider}</span>}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={u.plan}
                          disabled={busy === u.id || u.is_admin}
                          onChange={(e) => setPlan(u, e.target.value)}
                          className="text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-200 px-1.5 py-1 disabled:opacity-50 focus:outline-none focus:border-amber-500/50"
                        >
                          <option value="free">free</option>
                          <option value="plus">plus</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-400">{u.campaigns}</td>
                      <td className="px-3 py-2 text-zinc-500 hidden md:table-cell">{fmtDate(u.created_at)}</td>
                      <td className="px-3 py-2 text-zinc-500 hidden lg:table-cell">{fmtDate(u.last_sign_in_at)}</td>
                      <td className="px-3 py-2 text-right">
                        {!u.is_admin && (
                          <button
                            onClick={() => { setDelTarget(u); setDelConfirm(''); }}
                            disabled={busy === u.id}
                            title="Delete user"
                            className="text-zinc-600 hover:text-red-400 disabled:opacity-50"
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
            <button onClick={() => setShowResolved((v) => !v)} className="text-xs text-zinc-500 hover:text-zinc-300">
              {showResolved ? 'Hide resolved' : 'Show resolved'}
            </button>
          </div>
          <div className="space-y-2">
            {feedback.filter((f) => showResolved || f.status !== 'resolved').length === 0 && (
              <p className="text-sm text-zinc-600 text-center py-6">No {showResolved ? '' : 'open '}feedback.</p>
            )}
            {feedback.filter((f) => showResolved || f.status !== 'resolved').map((f) => {
              const m = FB_META[f.type] || FB_META.feedback;
              const resolved = f.status === 'resolved';
              return (
                <div key={f.id} className={cn('rounded-xl border border-zinc-800 bg-zinc-900/40 p-3', resolved && 'opacity-60')}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1', m.color)}>
                      <m.Icon className="w-3 h-3" /> {m.label}
                    </span>
                    <span className="text-xs text-zinc-400 truncate max-w-[200px]">{f.user_email || 'anonymous'}</span>
                    <span className="text-[10px] text-zinc-600">{fmtDate(f.created_date)}</span>
                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => fbStatus(f, resolved ? 'open' : 'resolved')} title={resolved ? 'Reopen' : 'Mark resolved'}
                        className={cn('w-6 h-6 flex items-center justify-center rounded', resolved ? 'text-zinc-500 hover:text-zinc-300' : 'text-emerald-500 hover:text-emerald-400')}>
                        {resolved ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => fbDelete(f)} title="Delete" className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{f.message}</p>
                  {f.page && <p className="text-[10px] text-zinc-600 mt-1.5 font-mono truncate">{f.page}</p>}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Delete confirmation */}
      <Dialog open={!!delTarget} onOpenChange={(o) => { if (!o) { setDelTarget(null); setDelConfirm(''); } }}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Delete user?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Permanently erases <span className="font-medium">{delTarget?.email}</span> and all their campaigns and data.
              There is no recovery. Type the email to confirm.
            </DialogDescription>
          </DialogHeader>
          <input
            value={delConfirm}
            onChange={(e) => setDelConfirm(e.target.value)}
            placeholder={delTarget?.email}
            className="rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-red-500/50"
            autoFocus
          />
          <DialogFooter>
            <button onClick={() => { setDelTarget(null); setDelConfirm(''); }} className="text-sm text-zinc-400 px-3">Cancel</button>
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
  return <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">{children}</div>;
}

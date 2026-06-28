import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Trash2, Search, Download, ShieldCheck, ShieldOff, BarChart3, X } from 'lucide-react';
import { callAdmin, INPUT, CARD } from '@/lib/adminApi';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const toDateInput = (s) => (s ? new Date(s).toISOString().slice(0, 10) : '');

// Human labels for the per-account usage counts (numbers only — no content).
const COUNT_LABELS = {
  campaigns: 'Campaigns', world_entities: 'Entities', sessions: 'Sessions',
  relationships: 'Relationships', campaign_maps: 'Maps', quick_notes: 'Notes', random_tables: 'Tables',
};

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState(null);

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [sortBy, setSortBy] = useState('joined');

  const [delTarget, setDelTarget] = useState(null);
  const [delConfirm, setDelConfirm] = useState('');
  const [detail, setDetail] = useState(null); // { user, counts|null }

  const load = async (p) => {
    const { users: rows, hasMore: more } = await callAdmin({ action: 'users', page: p });
    setUsers((prev) => (p === 1 ? rows : [...prev, ...rows]));
    setHasMore(!!more);
    setPage(p);
  };

  useEffect(() => {
    load(1).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try { await load(page + 1); } finally { setLoadingMore(false); }
  };

  const patch = (id, fields) => setUsers((prev) => prev.map((x) => (x.id === id ? { ...x, ...fields } : x)));

  const setPlan = async (u, plan) => {
    setBusy(u.id);
    try {
      await callAdmin({ action: 'set-plan', userId: u.id, plan, expires: u.plan_expires_at });
      patch(u.id, { plan, plan_expires_at: (plan === 'free' || plan === 'lifetime') ? null : u.plan_expires_at });
    } finally { setBusy(null); }
  };

  const setExpiry = async (u, dateStr) => {
    setBusy(u.id);
    try {
      const expires = dateStr ? new Date(dateStr).toISOString() : null;
      await callAdmin({ action: 'set-plan', userId: u.id, plan: u.plan, expires });
      patch(u.id, { plan_expires_at: expires });
      setDetail((d) => (d && d.user.id === u.id ? { ...d, user: { ...d.user, plan_expires_at: expires } } : d));
    } finally { setBusy(null); }
  };

  const toggleAdmin = async (u) => {
    const next = !u.is_admin;
    if (!window.confirm(next ? `Grant admin to ${u.email}? They'll get full access to this console.` : `Revoke admin from ${u.email}?`)) return;
    setBusy(u.id);
    try {
      await callAdmin({ action: 'set-admin', userId: u.id, isAdmin: next });
      patch(u.id, { is_admin: next });
      setDetail((d) => (d && d.user.id === u.id ? { ...d, user: { ...d.user, is_admin: next } } : d));
    } catch (e) {
      alert(e.message || 'Could not change admin status');
    } finally { setBusy(null); }
  };

  const openDetail = async (u) => {
    setDetail({ user: u, counts: null });
    try {
      const { counts } = await callAdmin({ action: 'user-detail', userId: u.id });
      setDetail((d) => (d && d.user.id === u.id ? { ...d, counts } : d));
    } catch { setDetail((d) => (d && d.user.id === u.id ? { ...d, counts: {} } : d)); }
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users.filter((u) => {
      if (q && !`${u.email || ''} ${u.name || ''}`.toLowerCase().includes(q)) return false;
      if (adminFilter === 'admin' && !u.is_admin) return false;
      if (adminFilter === 'nonadmin' && u.is_admin) return false;
      if (planFilter === 'paid' && u.plan === 'free') return false;
      if (planFilter !== 'all' && planFilter !== 'paid' && u.plan !== planFilter) return false;
      return true;
    });
    const cmp = {
      joined: (a, b) => (b.created_at || '').localeCompare(a.created_at || ''),
      seen: (a, b) => (b.last_sign_in_at || '').localeCompare(a.last_sign_in_at || ''),
      campaigns: (a, b) => b.campaigns - a.campaigns,
      entities: (a, b) => b.entities - a.entities,
    }[sortBy];
    return [...list].sort(cmp);
  }, [users, search, planFilter, adminFilter, sortBy]);

  const exportCsv = () => {
    const head = ['email', 'name', 'plan', 'expires', 'admin', 'campaigns', 'entities', 'sessions', 'joined', 'last_seen'];
    const rows = [head, ...filtered.map((u) => [
      u.email, u.name || '', u.plan, u.plan_expires_at || '', u.is_admin ? 'yes' : 'no',
      u.campaigns, u.entities, u.sessions, u.created_at || '', u.last_sign_in_at || '',
    ])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `gmos-users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const selClass = cn('text-xs px-2 py-1.5', INPUT);

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Users <span className="text-zinc-400 dark:text-zinc-600 normal-case tracking-normal font-normal">({filtered.length}{hasMore ? '+' : ''})</span>
        </h2>
        <button onClick={exportCsv} disabled={!filtered.length}
          className="ml-auto inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email or name…"
            className={cn('w-full text-sm pl-8 pr-2.5 py-1.5', INPUT)} />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={selClass} aria-label="Filter by plan">
          <option value="all">All plans</option>
          <option value="free">Free</option>
          <option value="paid">Paid (any)</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="lifetime">Lifetime</option>
        </select>
        <select value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)} className={selClass} aria-label="Filter by role">
          <option value="all">Everyone</option>
          <option value="admin">Admins</option>
          <option value="nonadmin">Non-admins</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selClass} aria-label="Sort by">
          <option value="joined">Newest</option>
          <option value="seen">Last seen</option>
          <option value="campaigns">Most campaigns</option>
          <option value="entities">Most entities</option>
        </select>
      </div>

      {loading ? (
        <div className={cn(CARD, 'flex justify-center py-8')}><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900/60 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium px-3 py-2">User</th>
                  <th className="text-left font-medium px-3 py-2">Plan</th>
                  <th className="text-right font-medium px-3 py-2">Usage</th>
                  <th className="text-left font-medium px-3 py-2 hidden lg:table-cell">Last seen</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/70">
                {filtered.map((u) => (
                  <tr key={u.id} className="bg-white dark:bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[220px]">{u.email}</span>
                        {u.is_admin && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded px-1">ADMIN</span>}
                      </div>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{u.name ? `${u.name} · ` : ''}{u.provider} · joined {fmtDate(u.created_at)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <select value={u.plan} disabled={busy === u.id || u.is_admin}
                        onChange={(e) => setPlan(u, e.target.value)} className={cn('text-xs px-1.5 py-1 disabled:opacity-50', INPUT)}>
                        <option value="free">free</option>
                        <option value="monthly">monthly</option>
                        <option value="yearly">yearly</option>
                        <option value="lifetime">lifetime</option>
                        {u.plan === 'plus' && <option value="plus">plus (legacy)</option>}
                      </select>
                      {u.plan_expires_at && <div className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-0.5">until {fmtDate(u.plan_expires_at)}</div>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      <span title="Campaigns">{u.campaigns}c</span> · <span title="Entities">{u.entities}e</span> · <span title="Sessions">{u.sessions}s</span>
                    </td>
                    <td className="px-3 py-2 text-zinc-500 hidden lg:table-cell whitespace-nowrap">{fmtDate(u.last_sign_in_at)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button onClick={() => openDetail(u)} title="Details" className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 mr-1"><BarChart3 className="w-4 h-4" /></button>
                      {!u.is_admin && (
                        <button onClick={() => { setDelTarget(u); setDelConfirm(''); }} disabled={busy === u.id} title="Delete user"
                          className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50">
                          {busy === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-zinc-400 dark:text-zinc-600">No users match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-2 text-center">
              <button onClick={loadMore} disabled={loadingMore}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 inline-flex items-center gap-1.5">
                {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Load more
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail panel — counts only, never content */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 sm:max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-zinc-900 dark:text-zinc-100 flex items-center gap-2 truncate">
                  {detail.user.email}
                  {detail.user.is_admin && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded px-1">ADMIN</span>}
                </DialogTitle>
                <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                  {detail.user.name ? `${detail.user.name} · ` : ''}{detail.user.provider} · joined {fmtDate(detail.user.created_at)} · last seen {fmtDate(detail.user.last_sign_in_at)}
                </DialogDescription>
              </DialogHeader>

              {/* Usage counts (no content is ever shown) */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">Usage</p>
                {detail.counts === null ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-zinc-400" /></div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Object.keys(COUNT_LABELS).map((k) => (
                      <div key={k} className={cn(CARD, 'p-2 text-center')}>
                        <div className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{detail.counts[k] ?? 0}</div>
                        <div className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-600">{COUNT_LABELS[k]}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Admin access</p>
                    <p className="text-xs text-zinc-500">{detail.user.is_admin ? 'Has full console access' : 'Standard user'}</p>
                  </div>
                  <button onClick={() => toggleAdmin(detail.user)} disabled={busy === detail.user.id}
                    className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border disabled:opacity-50',
                      detail.user.is_admin ? 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800' : 'border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10')}>
                    {detail.user.is_admin ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    {detail.user.is_admin ? 'Revoke admin' : 'Grant admin'}
                  </button>
                </div>

                {(detail.user.plan === 'monthly' || detail.user.plan === 'yearly') && (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Plan expiry</p>
                      <p className="text-xs text-zinc-500">{detail.user.plan} subscription</p>
                    </div>
                    <input type="date" defaultValue={toDateInput(detail.user.plan_expires_at)}
                      onChange={(e) => setExpiry(detail.user, e.target.value)} disabled={busy === detail.user.id}
                      className={cn('text-xs px-2 py-1.5', INPUT)} />
                  </div>
                )}
              </div>

              <DialogFooter>
                <button onClick={() => setDetail(null)} className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 px-3"><X className="w-4 h-4" /> Close</button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
          <input value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} placeholder={delTarget?.email}
            className="rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-red-500/50" autoFocus />
          <DialogFooter>
            <button onClick={() => { setDelTarget(null); setDelConfirm(''); }} className="text-sm text-zinc-600 dark:text-zinc-400 px-3">Cancel</button>
            <button onClick={doDelete} disabled={delConfirm !== delTarget?.email || busy === delTarget?.id}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold px-3 py-2">
              {busy === delTarget?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete forever
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

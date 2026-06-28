import React, { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { callAdmin, INPUT } from '@/lib/adminApi';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

// User management: view accounts, change plans, and delete users (with a typed
// confirmation). Admins are protected from plan changes and deletion here.
export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [delConfirm, setDelConfirm] = useState('');

  useEffect(() => {
    callAdmin({ action: 'users' }).then((u) => setUsers(u.users || [])).catch(() => {});
  }, []);

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

  return (
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
    </section>
  );
}

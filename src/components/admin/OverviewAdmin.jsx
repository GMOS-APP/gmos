import React, { useEffect, useState } from 'react';
import { Users, Crown, BookOpen, Layers, Boxes } from 'lucide-react';
import { callAdmin } from '@/lib/adminApi';

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

// At-a-glance counts across the app.
export default function OverviewAdmin() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    callAdmin({ action: 'stats' }).then((s) => setStats(s.stats)).catch(() => {});
  }, []);

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Overview</h2>
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard icon={Users} label="Users" value={stats.users} />
          <StatCard icon={Crown} label="Plus" value={stats.plus} />
          <StatCard icon={BookOpen} label="Campaigns" value={stats.campaigns} />
          <StatCard icon={Layers} label="Sessions" value={stats.sessions} />
          <StatCard icon={Boxes} label="Entities" value={stats.entities} />
        </div>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">Loading…</p>
      )}
    </section>
  );
}

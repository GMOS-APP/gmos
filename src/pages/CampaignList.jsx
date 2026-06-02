import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Campaign, functions } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Upload, BookOpen, Shield, Loader2, LogOut, Download, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { SYSTEM_OPTIONS, DEFAULT_SYSTEM_ID, getSystem } from '@/lib/systems';

const STATUS_DOT = {
  active: 'bg-emerald-500',
  paused: 'bg-amber-500',
  completed: 'bg-zinc-400',
  debriefed: 'bg-zinc-400',
};

// A single desktop icon (utility action or campaign).
function DesktopIcon({ icon: Icon, label, onClick, busy, dashed, title, tint, dot, badge }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={title || label}
      className="group w-24 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/70 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 disabled:opacity-60 transition-colors"
    >
      <div className={cn(
        'relative w-14 h-14 rounded-xl flex items-center justify-center border transition-colors',
        dashed
          ? 'border-dashed border-zinc-300 dark:border-zinc-700 group-hover:border-amber-500/50'
          : tint || 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
      )}>
        {busy ? <Loader2 className="w-5 h-5 animate-spin text-zinc-400" /> : <Icon className="w-6 h-6 text-amber-500 group-hover:text-amber-400" />}
        {dot && <span className={cn('absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950', dot)} />}
        {badge && <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1 rounded bg-zinc-700 text-zinc-200 border border-zinc-600">{badge}</span>}
      </div>
      <span className="text-[11px] text-center text-zinc-700 dark:text-zinc-300 leading-tight line-clamp-2 w-full">{label}</span>
    </button>
  );
}

export default function CampaignList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isPlus, logout } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', setting: '', system: DEFAULT_SYSTEM_ID });
  const [exportingId, setExportingId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const fileInputRef = useRef(null);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const data = JSON.parse(text);
    await functions.invoke('importCampaign', data);
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    setImporting(false);
    e.target.value = '';
  };

  const handleExport = async (campaign) => {
    setExportingId(campaign.id);
    const response = await functions.invoke('exportCampaign', { campaign_id: campaign.id });
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, '_')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportingId(null);
  };

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('create-demo', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (err) {
      console.error('Failed to load demo campaign:', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => Campaign.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => Campaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCreate(false);
      setForm({ name: '', description: '', setting: '', system: DEFAULT_SYSTEM_ID });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Campaign.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const confirmDelete = (c) => {
    if (window.confirm(`Delete "${c.name}"? This permanently removes the campaign and can't be undone.`)) {
      deleteMutation.mutate(c.id);
    }
  };

  const open = (c) => navigate(createPageUrl('CampaignDashboard') + `?id=${c.id}`);
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Menu bar */}
      <header className="flex items-center gap-2 h-9 px-3 border-b border-zinc-200 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-950/80 backdrop-blur flex-shrink-0 select-none">
        <span className="text-sm font-bold tracking-wide text-zinc-800 dark:text-zinc-200">
          GM<span className="text-amber-500">/OS{isPlus ? '+' : ''}</span>
        </span>
        <span className="hidden sm:block text-[11px] font-mono text-zinc-400 dark:text-zinc-600">desktop</span>
        <div className="ml-auto flex items-center gap-0.5 pl-2 pr-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
          <span className="hidden sm:inline px-2 text-[11px] text-zinc-500 dark:text-zinc-500 truncate max-w-[180px]">{user?.email}</span>
          <ThemeToggle />
          <button
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-[11px] tabular-nums text-zinc-600 dark:text-zinc-400">{time}</span>
        </div>
      </header>

      {/* Desktop */}
      <main className="flex-1 overflow-y-auto p-5 sm:p-8">
        <div className="flex flex-wrap gap-2 content-start">
          <DesktopIcon icon={Plus} label="New Campaign" dashed onClick={() => setShowCreate(true)} />
          <DesktopIcon icon={Upload} label="Import" busy={importing} onClick={() => fileInputRef.current?.click()} />
          <DesktopIcon icon={BookOpen} label="Demo" busy={loadingDemo} onClick={handleLoadDemo} />

          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="w-24 flex flex-col items-center gap-1.5 p-2">
                  <div className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-900 animate-pulse" />
                  <div className="w-16 h-2.5 rounded bg-zinc-200 dark:bg-zinc-900 animate-pulse" />
                </div>
              ))
            : campaigns.map((c) => (
                <ContextMenu key={c.id}>
                  <ContextMenuTrigger asChild>
                    <div>
                      <DesktopIcon
                        icon={Shield}
                        label={c.name}
                        onClick={() => open(c)}
                        title={`${c.name} · ${getSystem(c.system).shortLabel} · Session #${c.current_session_number || 0}`}
                        tint="bg-gradient-to-b from-amber-400/20 to-amber-600/5 border-amber-500/30 group-hover:border-amber-500/60"
                        dot={STATUS_DOT[c.status] || STATUS_DOT.active}
                        badge={c.is_demo ? 'D' : null}
                        busy={exportingId === c.id}
                      />
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-44">
                    <ContextMenuItem onSelect={() => open(c)}>
                      <ExternalLink className="w-3.5 h-3.5 mr-2" /> Open
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => handleExport(c)} disabled={exportingId === c.id}>
                      <Download className="w-3.5 h-3.5 mr-2" /> {exportingId === c.id ? 'Exporting…' : 'Export backup'}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onSelect={() => confirmDelete(c)}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
        </div>

        {!isLoading && campaigns.length === 0 && (
          <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-600">
            No campaigns yet — open <span className="text-amber-600 dark:text-amber-400">New Campaign</span> or load the demo to get started.
          </p>
        )}

        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </main>

      {/* Status bar */}
      <footer className="flex items-center justify-between h-7 px-3 border-t border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-950 flex-shrink-0 text-[11px] font-mono text-zinc-500 dark:text-zinc-500">
        <span>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</span>
        <Link to={createPageUrl('About')} className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
          About &amp; legal
        </Link>
      </footer>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Campaign name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              autoFocus
            />
            <Textarea
              placeholder="Brief description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
            />
            <Select value={form.system} onValueChange={(v) => setForm({ ...form, system: v })}>
              <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                <SelectValue placeholder="Select game system" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_OPTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="World setting notes (optional)"
              value={form.setting}
              onChange={(e) => setForm({ ...form, setting: e.target.value })}
              rows={3}
              className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-zinc-600 dark:text-zinc-400">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name.trim() || createMutation.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

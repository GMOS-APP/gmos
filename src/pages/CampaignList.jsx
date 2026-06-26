import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Campaign, functions } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, MoreHorizontal, Trash2, Download, Upload, FileText, LogOut, BookOpen, Loader2, UserCog, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import QueryError from '@/components/common/QueryError';
import { DEFAULT_SYSTEM_ID } from '@/lib/systems';
import UpgradeModal from '@/components/billing/UpgradeModal';
import BetaBadge from '@/components/common/BetaBadge';
import { FREE_CAMPAIGN_LIMIT, isCampaignLimitError } from '@/lib/plans';

// True when a thrown error — from a direct insert or from a functions.invoke
// (FunctionsHttpError carries the body in .context) — is the campaign-limit signal.
async function isLimitError(err) {
  if (isCampaignLimitError(err)) return true;
  try {
    const body = await err?.context?.json?.();
    return isCampaignLimitError(body);
  } catch {
    return false;
  }
}

export default function CampaignList() {
  const queryClient = useQueryClient();
  const { user, isPlus, isAdmin, logout } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [form, setForm] = useState({ name: '', background: '', setting: '', hook: '', system: DEFAULT_SYSTEM_ID });
  const [exportingId, setExportingId] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await functions.invoke('importCampaign', data);
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (err) {
      if (await isLimitError(err)) setShowUpgrade(true);
      else console.error('Import failed:', err);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = async (e, campaign) => {
    e.preventDefault();
    setExportingId(campaign.id);
    const response = await functions.invoke('exportCampaign', { campaign_id: campaign.id });
    const data = response.data;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, '_')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportingId(null);
  };

  const [loadingDemo, setLoadingDemo] = useState(false);
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
      if (await isLimitError(err)) setShowUpgrade(true);
      else console.error('Failed to load demo campaign:', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const { data: campaigns = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => Campaign.list('-created_date'),
  });

  // Free plan is capped at FREE_CAMPAIGN_LIMIT campaigns; the server enforces it too.
  const atFreeLimit = !isPlus && campaigns.length >= FREE_CAMPAIGN_LIMIT;
  const handleNewCampaign = () => (atFreeLimit ? setShowUpgrade(true) : setShowCreate(true));

  const createMutation = useMutation({
    mutationFn: (data) => Campaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCreate(false);
      setForm({ name: '', background: '', setting: '', hook: '', system: DEFAULT_SYSTEM_ID });
    },
    onError: async (err) => {
      if (await isLimitError(err)) {
        setShowCreate(false);
        setShowUpgrade(true);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Campaign.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  return (
    <div className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-8 sm:py-16">

      {/* User bar */}
      <div className="w-full max-w-3xl flex justify-end items-center gap-2 sm:gap-3 mb-8 sm:mb-10">
        <ThemeToggle className="mr-1" />
        <span className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-600 truncate max-w-[200px]">{user?.email}</span>
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}
        <Link
          to={createPageUrl('AccountSettings')}
          className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <UserCog className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Account</span>
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>

      {/* Hero */}
      <div className="text-center mb-10 sm:mb-16 max-w-lg">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-widest text-zinc-900 dark:text-zinc-100 mb-3 select-none">
          GM<span className="text-amber-600 dark:text-amber-400">/OS{isPlus ? '+' : ''}</span>
          <BetaBadge className="ml-2 align-top" />
        </h1>
        <p className="text-zinc-500 dark:text-zinc-500 text-sm tracking-wide">
          The operating system for Game Masters.
        </p>
      </div>

      {/* Campaign section */}
      <div className="w-full max-w-3xl">

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Campaigns</h2>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={importing}
                  className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 h-9"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 sm:mr-1.5" />}
                  <span className="hidden sm:inline">{importing ? 'Importing…' : 'Import'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DropdownMenuItem
                  onClick={() => (atFreeLimit ? setShowUpgrade(true) : fileInputRef.current?.click())}
                  className="text-zinc-700 dark:text-zinc-300 focus:text-zinc-900 dark:focus:text-zinc-100"
                >
                  <FileText className="w-3.5 h-3.5 mr-2" />
                  From File
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (atFreeLimit ? setShowUpgrade(true) : handleLoadDemo())}
                  disabled={loadingDemo}
                  className="text-zinc-700 dark:text-zinc-300 focus:text-zinc-900 dark:focus:text-zinc-100"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-2" />
                  {loadingDemo ? 'Loading…' : 'Load Demo Campaign'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={handleNewCampaign}
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold h-9"
            >
              <Plus className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Campaign</span>
            </Button>
          </div>
        </div>

        {/* Campaign list */}
        {isError ? (
          <QueryError error={error} onRetry={refetch} title="Couldn't load your campaigns"
            className="border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl" />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-zinc-200 dark:bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 sm:py-24 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl px-6">
            <FolderOpen className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-700 dark:text-zinc-400 font-medium mb-1">No campaigns yet</p>
            <p className="text-zinc-500 dark:text-zinc-600 text-sm mb-6">Create your first campaign or explore the demo.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Campaign
              </Button>
              <Button
                variant="outline"
                onClick={handleLoadDemo}
                disabled={loadingDemo}
                className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 w-full sm:w-auto"
              >
                {loadingDemo ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <BookOpen className="w-4 h-4 mr-1.5" />}
                {loadingDemo ? 'Loading…' : 'Load Demo Campaign'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {campaigns.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Link
                    to={createPageUrl('CampaignDashboard') + `?id=${c.id}`}
                    className="group relative block p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-amber-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/70 dark:shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.04)] transition-all"
                  >
                    {/* Card menu */}
                    <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                          <DropdownMenuItem
                            onClick={(e) => handleExport(e, c)}
                            disabled={exportingId === c.id}
                            className="text-zinc-700 dark:text-zinc-300 focus:text-zinc-900 dark:focus:text-zinc-100"
                          >
                            <Download className="w-3.5 h-3.5 mr-2" />
                            {exportingId === c.id ? 'Exporting…' : 'Export Backup'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              if (window.confirm(`Delete "${c.name}"? This permanently removes the campaign and can't be undone.`)) {
                                deleteMutation.mutate(c.id);
                              }
                            }}
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Title + demo badge */}
                    <div className="pr-8 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                          {c.name}
                        </h3>
                        {c.is_demo && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border border-zinc-300 dark:border-zinc-700 shrink-0">
                            Demo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Setting / background snippet */}
                    {(c.setting || c.background || c.description) && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 line-clamp-2 mb-3 leading-relaxed">
                        {c.setting || c.background || c.description}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-600 mt-auto">
                      <span>Session #{c.current_session_number || 0}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                      <span className={cn(
                        "flex items-center gap-1 capitalize",
                        c.status === 'active' || !c.status ? 'text-emerald-600 dark:text-emerald-500' :
                        c.status === 'paused' ? 'text-amber-600 dark:text-amber-500' :
                        'text-zinc-500 dark:text-zinc-600'
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full inline-block shrink-0",
                          c.status === 'active' || !c.status ? 'bg-emerald-500' :
                          c.status === 'paused' ? 'bg-amber-500' : 'bg-zinc-400'
                        )} />
                        {c.status || 'active'}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>


      {/* Footer */}
      <div className="mt-16 pb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
        <Link
          to="/blog"
          className="text-xs text-zinc-400 dark:text-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-500 transition-colors"
        >
          Blog — GM tips &amp; guides
        </Link>
        <span aria-hidden className="text-xs text-zinc-300 dark:text-zinc-800">·</span>
        <Link
          to={createPageUrl('About')}
          className="text-xs text-zinc-400 dark:text-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-500 transition-colors"
        >
          About GM/OS &amp; Legal Attributions
        </Link>
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Campaign name</label>
              <Input
                placeholder="e.g. The Sundered Crown"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Background <span className="text-zinc-400 dark:text-zinc-600 font-normal">· what led to now</span></label>
              <Textarea
                placeholder="The history and events that set the stage…"
                value={form.background}
                onChange={(e) => setForm({ ...form, background: e.target.value })}
                rows={3}
                className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Setting <span className="text-zinc-400 dark:text-zinc-600 font-normal">· where &amp; when</span></label>
              <Textarea
                placeholder="The world, region, and tone of the adventure…"
                value={form.setting}
                onChange={(e) => setForm({ ...form, setting: e.target.value })}
                rows={3}
                className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Hook <span className="text-zinc-400 dark:text-zinc-600 font-normal">· the call to adventure</span></label>
              <Textarea
                placeholder="What draws the party in and sets them in motion…"
                value={form.hook}
                onChange={(e) => setForm({ ...form, hook: e.target.value })}
                rows={2}
                className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
              />
            </div>
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

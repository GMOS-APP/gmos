import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Campaign, functions } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, MoreHorizontal, Trash2, Download, Upload, FileText, Sparkles, LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import RawImportDialog from '@/components/campaign/RawImportDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SYSTEM_OPTIONS, DEFAULT_SYSTEM_ID, getSystem } from '@/lib/systems';

export default function CampaignList() {
  const queryClient = useQueryClient();
  const { user, isPlus, logout } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', setting: '', system: DEFAULT_SYSTEM_ID });
  const [exportingId, setExportingId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showRawImport, setShowRawImport] = useState(false);
  const fileInputRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const data = JSON.parse(text);
    const response = await functions.invoke('importCampaign', data);
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    setImporting(false);
    e.target.value = '';
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

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16">
      {/* User bar */}
      <div className="w-full max-w-3xl flex justify-end items-center gap-3 mb-10">
        {user?.email && (
          <span className="text-xs text-zinc-500 dark:text-zinc-600">{user.email}</span>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>

      {/* Hero */}
      <div className="text-center mb-16 max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
          GM<span className="text-amber-600 dark:text-amber-400">/OS{isPlus ? '+' : ''}</span>
        </h1>
        <p className="text-zinc-600 dark:text-zinc-500 text-sm leading-relaxed">
          The operating system for Game Masters. Manage your world, run your sessions, stay in control.
        </p>
      </div>

      {/* Campaign Grid */}
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Campaigns</h2>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={importing}
                  className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  {importing ? 'Importing...' : 'Import'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  className="text-zinc-700 dark:text-zinc-300 focus:text-zinc-900 dark:focus:text-zinc-100"
                >
                  <FileText className="w-3.5 h-3.5 mr-2" />
                  From File
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowRawImport(true)}
                  className="text-zinc-700 dark:text-zinc-300 focus:text-zinc-900 dark:focus:text-zinc-100"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  From Raw Data (AI)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLoadDemo}
                  disabled={loadingDemo}
                  className="text-zinc-700 dark:text-zinc-300 focus:text-zinc-900 dark:focus:text-zinc-100"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-2" />
                  {loadingDemo ? 'Loading...' : 'Load Demo Campaign'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => setShowCreate(true)}
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Campaign
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-zinc-200 dark:bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
            <FolderOpen className="w-10 h-10 text-zinc-500 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-600 dark:text-zinc-500 text-sm">No campaigns yet</p>
            <p className="text-zinc-500 dark:text-zinc-600 text-xs mt-1">Create one to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="group block p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                            {c.name}
                          </h3>
                          {c.is_demo && (
                            <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border border-zinc-300 dark:border-zinc-700">
                              Demo
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-500 mt-1 line-clamp-2">{c.description}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <button className="p-1 rounded text-zinc-500 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-300">
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
                           {exportingId === c.id ? 'Exporting...' : 'Export Backup'}
                         </DropdownMenuItem>
                         <DropdownMenuItem
                           onClick={(e) => {
                             e.preventDefault();
                             deleteMutation.mutate(c.id);
                           }}
                           className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                         >
                           <Trash2 className="w-3.5 h-3.5 mr-2" />
                           Delete
                         </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-3 mt-4 text-xs text-zinc-600 dark:text-zinc-600">
                      <span>Session #{c.current_session_number || 0}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      <span className="text-zinc-500 dark:text-zinc-500">{getSystem(c.system).shortLabel}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      <span className={cn(
                        "flex items-center gap-1 capitalize",
                        c.status === 'active' || !c.status ? 'text-emerald-600 dark:text-emerald-500' :
                        c.status === 'paused' ? 'text-amber-600 dark:text-amber-500' :
                        'text-zinc-500 dark:text-zinc-600'
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full inline-block",
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

      <RawImportDialog
        open={showRawImport}
        onOpenChange={setShowRawImport}
        onImported={() => {
          queryClient.invalidateQueries({ queryKey: ['campaigns'] });
          setShowRawImport(false);
        }}
      />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Campaign name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
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
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
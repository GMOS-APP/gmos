import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Campaign, functions } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Download, Trash2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useHotkeysEnabled, setHotkeysEnabled } from '@/lib/useHotkeysEnabled';
import { MOD_LABEL } from '@/lib/useHotkeys';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

export default function CampaignSettings() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id') || params.get('id');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (d) => d?.[0],
  });

  const [form, setForm] = useState(null);
  const [exportingId, setExportingId] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hotkeysEnabled = useHotkeysEnabled();

  useEffect(() => {
    if (campaign && !form) {
      setForm({
        name: campaign.name || '',
        description: campaign.description || '',
        setting: campaign.setting || '',
        system: campaign.system || 'dnd5e',
        status: campaign.status || 'active',
      });
    }
  }, [campaign, form]);

  const saveMutation = useMutation({
    mutationFn: (data) => Campaign.update(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: 'Saved', description: 'Campaign settings updated.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => Campaign.delete(campaignId),
    onSuccess: () => navigate(createPageUrl('CampaignList')),
    onError: () => toast({ title: 'Error', description: 'Failed to delete campaign.', variant: 'destructive' }),
  });

  const handleExport = async () => {
    setExportingId(true);
    try {
      const response = await functions.invoke('exportCampaign', { campaign_id: campaignId });
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaign.name.replace(/\s+/g, '_')}_backup.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingId(false);
    }
  };

  const isDirty = form && campaign && (
    form.name !== campaign.name ||
    form.description !== (campaign.description || '') ||
    form.setting !== (campaign.setting || '') ||
    form.system !== campaign.system ||
    form.status !== (campaign.status || 'active')
  );

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Campaign Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">{campaign.name}</p>
      </div>

      {/* General */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">General</h2>
        <div className="space-y-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">Campaign Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="dark:bg-zinc-950 dark:border-zinc-800"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="dark:bg-zinc-950 dark:border-zinc-800 resize-none"
              placeholder="A brief description of the campaign…"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">World Setting</label>
            <Textarea
              value={form.setting}
              onChange={(e) => setForm({ ...form, setting: e.target.value })}
              rows={4}
              className="dark:bg-zinc-950 dark:border-zinc-800 resize-none"
              placeholder="Setting notes, tone, themes, world details…"
            />
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">Status</h2>
        <div className="space-y-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">Status</label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="dark:bg-zinc-950 dark:border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate(form)}
          disabled={!isDirty || saveMutation.isPending || !form.name.trim()}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
        >
          {saveMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            : <Save className="w-4 h-4 mr-1.5" />
          }
          Save Changes
        </Button>
      </div>

      {/* Preferences (device-level) */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">Preferences</h2>
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Keyboard shortcuts</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                Enable {MOD_LABEL}K command palette, ⌥N quick-create, and ? for help. Applies to this device.
              </p>
            </div>
            <Switch
              checked={hotkeysEnabled}
              onCheckedChange={setHotkeysEnabled}
              aria-label="Enable keyboard shortcuts"
            />
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-red-500">Danger Zone</h2>
        <div className="border border-red-200 dark:border-red-900/40 rounded-xl divide-y divide-red-100 dark:divide-red-900/30">

          {/* Export */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Export Backup</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">Download a full JSON backup of this campaign.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportingId}
              className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shrink-0"
            >
              {exportingId
                ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                : <Download className="w-3.5 h-3.5 mr-1.5" />
              }
              {exportingId ? 'Exporting…' : 'Export'}
            </Button>
          </div>

          {/* Delete */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Delete Campaign</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">Permanently delete this campaign and all its data.</p>
            </div>
            {!confirmDelete ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-zinc-500 dark:text-zinc-500">Are you sure?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  className="text-zinc-600 dark:text-zinc-400 text-xs h-7"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs h-7"
                >
                  {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Delete'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

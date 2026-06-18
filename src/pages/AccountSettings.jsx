import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import { functions } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { PLAN_LABELS } from '@/lib/plans';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ui/ThemeToggle';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  User, Mail, Crown, Palette, Download, FileText, Trash2, Loader2, ArrowLeft,
} from 'lucide-react';

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-2.5">
        <Icon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          {description && <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4 ml-6">
        {children}
      </div>
    </section>
  );
}

export default function AccountSettings() {
  const { user, plan, planExpiresAt, isPlus, refreshProfile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [billingLoading, setBillingLoading] = useState(false);

  // Returning from a successful Stripe checkout: the webhook may land a beat
  // after the redirect, so re-pull the plan a few times.
  useEffect(() => {
    if (params.get('checkout') !== 'success') return;
    toast({ title: 'Thanks for upgrading!', description: 'Activating your plan…' });
    let tries = 0;
    const tick = async () => {
      await refreshProfile();
      if (++tries < 5) setTimeout(tick, 1500);
    };
    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openBillingPortal = async () => {
    setBillingLoading(true);
    try {
      const { data } = await functions.invoke('createBillingPortal', {});
      if (data?.url) { window.location.href = data.url; return; }
      throw new Error('No portal URL returned');
    } catch (e) {
      setBillingLoading(false);
      toast({ title: 'Could not open billing', description: e.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const provider = user?.app_metadata?.provider || 'email';

  const [name, setName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delConfirm, setDelConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const savedName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';

  const saveName = async () => {
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSavingName(false);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Saved', description: 'Display name updated.' });
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const { data } = await functions.invoke('exportAccount', {});
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gm-os-account-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export ready', description: 'Your data has been downloaded.' });
    } catch (e) {
      toast({ title: 'Export failed', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await functions.invoke('deleteAccount', { confirm: true });
      await logout();
      navigate('/');
    } catch (e) {
      setDeleting(false);
      toast({ title: 'Deletion failed', description: e.message || 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(createPageUrl('CampaignList'))}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to campaigns
      </button>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Account</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-8">Manage your profile, your data, and your account.</p>

      <div className="space-y-8">
        {/* Profile */}
        <Section icon={User} title="Profile" description="Your display name across GM/OS.">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400 block mb-1.5">Display name</label>
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              className="dark:bg-zinc-950 dark:border-zinc-800" />
            <Button onClick={saveName} disabled={savingName || name.trim() === savedName || !name.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold flex-shrink-0">
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </Section>

        {/* Email & sign-in */}
        <Section icon={Mail} title="Email & sign-in" description="The address you use to sign in.">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate">{user?.email}</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 capitalize flex-shrink-0">
              {provider === 'google' ? 'Google sign-in' : 'Email & password'}
            </span>
          </div>
          {provider === 'google' && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
              Your email and sign-in are managed by Google. Change them in your Google account.
            </p>
          )}
        </Section>

        {/* Plan */}
        <Section icon={Crown} title="Plan">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{PLAN_LABELS[plan] || 'Free'}</span>
              {(plan === 'monthly' || plan === 'yearly') ? (
                planExpiresAt && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                    Renews {new Date(planExpiresAt).toLocaleDateString()}
                  </p>
                )
              ) : plan === 'lifetime' ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">Lifetime access — thank you.</p>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">1 campaign, fully featured.</p>
              )}
            </div>
            {!isPlus ? (
              <Button
                onClick={() => navigate(createPageUrl('Upgrade'))}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold flex-shrink-0"
              >
                Upgrade
              </Button>
            ) : (
              <Button
                onClick={openBillingPortal}
                disabled={billingLoading}
                variant="outline"
                className="dark:bg-zinc-950 dark:border-zinc-700 flex-shrink-0"
              >
                {billingLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                {plan === 'lifetime' ? 'Billing & receipts' : 'Manage subscription'}
              </Button>
            )}
          </div>
        </Section>

        {/* Appearance */}
        <Section icon={Palette} title="Appearance">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-800 dark:text-zinc-200">Theme</span>
            <ThemeToggle />
          </div>
        </Section>

        {/* Your data */}
        <Section icon={Download} title="Your data" description="Access, download, and control your information.">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
            GM/OS stores your account (email and name), your campaigns and everything in them, and — if you subscribe —
            billing identifiers. Data is hosted on Supabase (US&nbsp;East). You can download a complete copy at any time.
          </p>
          <Button onClick={exportData} disabled={exporting} variant="outline"
            className="dark:bg-zinc-950 dark:border-zinc-700">
            {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
            Export my data
          </Button>
          <div className="flex items-center gap-3 mt-3 text-xs">
            <Link to={createPageUrl('PrivacyPolicy')} className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline">
              <FileText className="w-3 h-3" /> Privacy Policy
            </Link>
            <Link to={createPageUrl('Terms')} className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline">
              <FileText className="w-3 h-3" /> Terms
            </Link>
          </div>
        </Section>

        {/* Danger zone */}
        <Section icon={Trash2} title="Delete account" description="Permanently erase your account and all data.">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
            This deletes your account, every campaign and its contents, your profile, and your sign-in — across all
            systems. <span className="font-medium text-zinc-800 dark:text-zinc-200">This cannot be undone.</span> Export
            your data first if you want a copy.
          </p>
          <Button onClick={() => { setDelConfirm(''); setDelOpen(true); }} variant="outline"
            className="border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
            <Trash2 className="w-4 h-4 mr-1.5" /> Delete my account
          </Button>
        </Section>
      </div>

      {/* Delete confirmation */}
      <Dialog open={delOpen} onOpenChange={(o) => !deleting && setDelOpen(o)}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">Delete your account?</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              This permanently erases everything tied to <span className="font-medium">{user?.email}</span>. There is no
              recovery. Type <span className="font-mono font-semibold text-red-600 dark:text-red-400">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={delConfirm}
            onChange={(e) => setDelConfirm(e.target.value)}
            placeholder="Type DELETE"
            className="dark:bg-zinc-950 dark:border-zinc-800"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDelOpen(false)} disabled={deleting}
              className="text-zinc-600 dark:text-zinc-400">Cancel</Button>
            <Button onClick={deleteAccount} disabled={delConfirm !== 'DELETE' || deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold">
              {deleting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              {deleting ? 'Deleting…' : 'Delete forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

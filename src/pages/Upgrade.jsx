import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { functions } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import PricingTiers from '@/components/billing/PricingTiers';
import { PLAN_LABELS } from '@/lib/plans';

export default function Upgrade() {
  const navigate = useNavigate();
  const { plan, isPlus } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [loadingTier, setLoadingTier] = useState(null);

  const canceled = params.get('checkout') === 'cancel';

  const handleSelect = async (tier) => {
    setLoadingTier(tier);
    try {
      const { data } = await functions.invoke('createCheckout', { tier });
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No checkout URL returned');
    } catch (e) {
      setLoadingTier(null);
      toast({ title: 'Could not start checkout', description: e.message || 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(createPageUrl('CampaignList'))}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to campaigns
      </button>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        {isPlus ? 'Your plan' : 'Upgrade GM/OS'}
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-8">
        {isPlus
          ? `You're on the ${PLAN_LABELS[plan] || plan} plan — thank you for supporting GM/OS.`
          : 'Free includes 1 fully-featured campaign. Go unlimited with any paid plan.'}
      </p>

      {canceled && (
        <div className="mb-6 text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
          Checkout canceled — no charge was made.
        </div>
      )}

      <PricingTiers
        onSelect={isPlus ? undefined : handleSelect}
        currentPlan={plan}
        loadingTier={loadingTier}
        ctaLabel="Upgrade"
      />
    </div>
  );
}

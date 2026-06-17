import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { FREE_CAMPAIGN_LIMIT } from '@/lib/plans';

/**
 * Shown when a free user tries to exceed the 1-campaign limit.
 * @param {{ open: boolean, onOpenChange: (o: boolean) => void }} props
 */
export default function UpgradeModal({ open, onOpenChange }) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Sparkles className="w-4 h-4 text-amber-500" /> Upgrade to add more campaigns
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            The Free plan includes {FREE_CAMPAIGN_LIMIT} fully-featured campaign. Upgrade for
            unlimited campaigns — from $3.99/mo, or $49.99 once for lifetime access.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-600 dark:text-zinc-400">
            Not now
          </Button>
          <Button
            onClick={() => { onOpenChange(false); navigate(createPageUrl('Upgrade')); }}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
          >
            See plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

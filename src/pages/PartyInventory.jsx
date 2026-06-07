import React from 'react';
import { usePageParams } from '@/lib/usePageParams';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PartyInventory, PlayerNote, Campaign } from '@/api/entities';
import PartyInventoryManager from '@/components/party/PartyInventoryManager';
import PartyNotes from '@/components/party/PartyNotes';
import { Backpack } from 'lucide-react';

export default function PartyInventoryPage() {
  const params = usePageParams();
  const campaignId = params.get('campaign_id') || params.get('id');
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['party-inventory', campaignId],
    queryFn: () => PartyInventory.filter({ campaign_id: campaignId }, 'created_date'),
    enabled: !!campaignId,
  });

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => Campaign.filter({ id: campaignId }),
    select: (d) => d?.[0],
    enabled: !!campaignId,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['player-notes', campaignId],
    queryFn: () => PlayerNote.filter({ campaign_id: campaignId }, '-created_date'),
    enabled: !!campaignId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['party-inventory', campaignId] });
  const addM = useMutation({ mutationFn: (item) => PartyInventory.create({ campaign_id: campaignId, ...item }), onSuccess: invalidate });
  const updM = useMutation({ mutationFn: ({ id, patch }) => PartyInventory.update(id, patch), onSuccess: invalidate });
  const delM = useMutation({ mutationFn: (id) => PartyInventory.delete(id), onSuccess: invalidate });
  const curM = useMutation({
    mutationFn: (currency) => Campaign.update(campaignId, { party_currency: currency }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign', campaignId] }),
  });
  const invNotes = () => qc.invalidateQueries({ queryKey: ['player-notes', campaignId] });
  const addNoteM = useMutation({ mutationFn: (note) => PlayerNote.create({ campaign_id: campaignId, ...note }), onSuccess: invNotes });
  const delNoteM = useMutation({ mutationFn: (id) => PlayerNote.delete(id), onSuccess: invNotes });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Backpack className="w-5 h-5 text-amber-500" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Party Inventory</h1>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
        The party’s shared stash and coin. Your players can view and edit this from the player share link too.
      </p>

      <PartyInventoryManager
        items={items}
        currency={campaign?.party_currency || {}}
        onAdd={(item) => addM.mutate(item)}
        onUpdate={(id, patch) => updM.mutate({ id, patch })}
        onDelete={(id) => delM.mutate(id)}
        onCurrency={(currency) => curM.mutate(currency)}
      />

      <div className="mt-8">
        <PartyNotes
          notes={notes}
          onAdd={(note) => addNoteM.mutate(note)}
          onDelete={(id) => delNoteM.mutate(id)}
        />
      </div>
    </div>
  );
}

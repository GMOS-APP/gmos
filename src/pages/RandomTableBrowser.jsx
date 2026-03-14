import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Campaign, RandomTable } from '@/api/entities';
import { Plus, Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import RandomTableCard from '@/components/tables/RandomTableCard';
import RandomTableDialog from '@/components/tables/RandomTableDialog';

const CATEGORIES = [
  { value: 'encounters', label: 'Encounters' },
  { value: 'names',      label: 'Names' },
  { value: 'loot',       label: 'Loot' },
  { value: 'plot_hooks', label: 'Plot Hooks' },
  { value: 'events',     label: 'Events' },
  { value: 'custom',     label: 'Custom' },
];

export default function RandomTableBrowser() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id');
  const queryClient = useQueryClient();

  const [showDialog, setShowDialog] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => Campaign.filter({ id: campaignId }),
    select: d => d?.[0],
    enabled: !!campaignId,
  });

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['random_tables', campaignId],
    queryFn: () => RandomTable.filter({ campaign_id: campaignId }, '-created_date'),
    enabled: !!campaignId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => RandomTable.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['random_tables', campaignId] }),
  });

  const handleEdit = (table) => { setEditingTable(table); setShowDialog(true); };
  const handleNew  = ()      => { setEditingTable(null);  setShowDialog(true); };
  const handleClose = ()     => { setShowDialog(false); setEditingTable(null); };
  const handleDelete = (id)  => {
    if (window.confirm('Delete this table?')) deleteMutation.mutate(id);
  };

  const filtered = categoryFilter === 'all'
    ? tables
    : tables.filter(t => t.category === categoryFilter);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-zinc-100 text-gray-900">Random Tables</h1>
          <p className="text-sm dark:text-zinc-500 text-gray-600 mt-1">
            {tables.length} table{tables.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleNew} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
          <Plus className="w-4 h-4 mr-1.5" />
          New Table
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {[{ value: 'all', label: 'All' }, ...CATEGORIES].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategoryFilter(value)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              categoryFilter === value
                ? 'bg-amber-500 text-zinc-950'
                : 'dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl dark:bg-zinc-900/40 bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Dices className="w-12 h-12 dark:text-zinc-700 text-gray-300 mb-4" />
          <p className="font-medium dark:text-zinc-400 text-gray-600 mb-1">
            {categoryFilter === 'all' ? 'No tables yet' : `No ${categoryFilter.replace('_', ' ')} tables`}
          </p>
          <p className="text-sm dark:text-zinc-600 text-gray-400 mb-4">
            Create a table and roll on it during your session.
          </p>
          {categoryFilter === 'all' && (
            <Button onClick={handleNew} variant="outline" className="dark:border-zinc-700">
              <Plus className="w-4 h-4 mr-2" />
              New Table
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(table => (
            <RandomTableCard
              key={table.id}
              table={table}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <RandomTableDialog
        open={showDialog}
        onClose={handleClose}
        campaignId={campaignId}
        campaign={campaign}
        table={editingTable}
      />
    </div>
  );
}

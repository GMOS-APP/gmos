import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Trash2 } from 'lucide-react';

const RELATIONSHIP_TYPES = [
  'allied_with', 'enemy_of', 'located_in', 'member_of', 'owns', 'seeks',
  'knows', 'loves', 'hates', 'fears', 'owes', 'employed_by', 'rivals',
  'mentors', 'parent_of', 'sibling_of', 'married_to', 'betrayed_by'
];

const STATUSES = ['active', 'broken', 'secret', 'suspected', 'historical'];

export default function RelationshipDialog({ open, onOpenChange, relationship, campaignId, entities }) {
  const queryClient = useQueryClient();
  const isEdit = !!relationship;

  const [form, setForm] = useState({
    source_entity_id: '',
    target_entity_id: '',
    relationship_type: 'allied_with',
    description: '',
    notes: '',
    status: 'active',
    strength: 5,
    session_established: null,
  });

  useEffect(() => {
    if (relationship) {
      setForm({
        source_entity_id: relationship.source_entity_id || '',
        target_entity_id: relationship.target_entity_id || '',
        relationship_type: relationship.relationship_type || 'allied_with',
        description: relationship.description || '',
        notes: relationship.notes || '',
        status: relationship.status || 'active',
        strength: relationship.strength || 5,
        session_established: relationship.session_established || null,
      });
    } else {
      setForm({
        source_entity_id: '',
        target_entity_id: '',
        relationship_type: 'allied_with',
        description: '',
        notes: '',
        status: 'active',
        strength: 5,
        session_established: null,
      });
    }
  }, [relationship]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const sourceEntity = entities.find(e => e.id === data.source_entity_id);
      const targetEntity = entities.find(e => e.id === data.target_entity_id);
      
      const payload = {
        ...data,
        campaign_id: campaignId,
        source_name: sourceEntity?.name || '',
        target_name: targetEntity?.name || '',
      };

      if (isEdit) {
        return base44.entities.Relationship.update(relationship.id, payload);
      }
      return base44.entities.Relationship.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Relationship.delete(relationship.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {isEdit ? 'Edit Relationship' : 'Create Relationship'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 text-xs mb-2 block">Source Entity</Label>
              <Select value={form.source_entity_id} onValueChange={(v) => setForm({ ...form, source_entity_id: v })}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-200">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {entities.map(e => (
                    <SelectItem key={e.id} value={e.id} className="text-zinc-300">
                      {e.name} ({e.entity_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-zinc-400 text-xs mb-2 block">Target Entity</Label>
              <Select value={form.target_entity_id} onValueChange={(v) => setForm({ ...form, target_entity_id: v })}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-200">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {entities.map(e => (
                    <SelectItem key={e.id} value={e.id} className="text-zinc-300">
                      {e.name} ({e.entity_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 text-xs mb-2 block">Relationship Type</Label>
              <Select value={form.relationship_type} onValueChange={(v) => setForm({ ...form, relationship_type: v })}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {RELATIONSHIP_TYPES.map(type => (
                    <SelectItem key={type} value={type} className="text-zinc-300 capitalize">
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-zinc-400 text-xs mb-2 block">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {STATUSES.map(status => (
                    <SelectItem key={status} value={status} className="text-zinc-300 capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-zinc-400 text-xs mb-2 block">
              Strength/Influence: {form.strength}/10
            </Label>
            <Slider
              value={[form.strength]}
              onValueChange={(v) => setForm({ ...form, strength: v[0] })}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-zinc-400 text-xs mb-2 block">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the relationship..."
              rows={3}
              className="bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
            />
          </div>

          <div>
            <Label className="text-zinc-400 text-xs mb-2 block">DM Notes & Context</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Private notes about this relationship, how it affects the narrative, hidden details..."
              rows={4}
              className="bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
            />
          </div>

          <div>
            <Label className="text-zinc-400 text-xs mb-2 block">Session Established</Label>
            <Input
              type="number"
              value={form.session_established || ''}
              onChange={(e) => setForm({ ...form, session_established: parseInt(e.target.value) || null })}
              placeholder="Leave empty if pre-campaign"
              className="bg-zinc-950 border-zinc-800 text-zinc-200"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {isEdit && (
            <Button
              onClick={() => deleteMutation.mutate()}
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="border-zinc-800 text-zinc-400">
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.source_entity_id || !form.target_entity_id || saveMutation.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950"
            >
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
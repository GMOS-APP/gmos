import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Network, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RelationshipGraph from '@/components/relationships/RelationshipGraph';
import RelationshipTimeline from '@/components/relationships/RelationshipTimeline';
import RelationshipDialog from '@/components/relationships/RelationshipDialog';

export default function RelationshipMap() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRel, setEditingRel] = useState(null);

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', campaignId],
    queryFn: () => base44.entities.WorldEntity.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const { data: relationships = [] } = useQuery({
    queryKey: ['relationships', campaignId],
    queryFn: () => base44.entities.Relationship.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const openDialog = (rel = null) => {
    setEditingRel(rel);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-zinc-100 text-gray-900">Relationship Map</h1>
          <p className="text-sm dark:text-zinc-500 text-gray-600">Visualize connections and narrative web</p>
        </div>
        <Button
          onClick={() => openDialog()}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Relationship
        </Button>
      </div>

      <Tabs defaultValue="graph" className="flex-1 flex flex-col h-[calc(100%-5rem)]">
        <TabsList className="dark:bg-zinc-900 dark:border dark:border-zinc-800 bg-gray-100 border border-gray-300 mb-4">
          <TabsTrigger value="graph" className="dark:data-[state=active]:bg-zinc-800 data-[state=active]:bg-white">
            <Network className="w-4 h-4 mr-2" />
            Graph View
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-zinc-800">
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="flex-1 m-0">
          <RelationshipGraph
            entities={entities}
            relationships={relationships}
            onEditRelationship={openDialog}
          />
        </TabsContent>

        <TabsContent value="timeline" className="flex-1 m-0">
          <RelationshipTimeline
            relationships={relationships}
            onEditRelationship={openDialog}
          />
        </TabsContent>
      </Tabs>

      <RelationshipDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        relationship={editingRel}
        campaignId={campaignId}
        entities={entities}
      />
    </div>
  );
}
import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import {
  Plus, Pencil, Check, Trash2, Upload, Map, ChevronDown, ImageOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MapPinMarker from '@/components/map/MapPin';
import PinLocationPicker from '@/components/map/PinLocationPicker';

export default function CampaignMap() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id') || params.get('id');
  const queryClient = useQueryClient();

  const [selectedMapId, setSelectedMapId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [placingLocation, setPlacingLocation] = useState(null); // entity being placed
  const [pendingColor, setPendingColor] = useState('amber');
  const [showNewMapDialog, setShowNewMapDialog] = useState(false);
  const [newMapForm, setNewMapForm] = useState({ name: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const mapRef = useRef(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: maps = [] } = useQuery({
    queryKey: ['campaign-maps', campaignId],
    queryFn: () => base44.entities.CampaignMap.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', campaignId],
    queryFn: () => base44.entities.WorldEntity.filter(
      { campaign_id: campaignId, entity_type: 'location' }, 'name', 100
    ),
    enabled: !!campaignId,
  });

  const activeMap = maps.find(m => m.id === selectedMapId) || maps[0] || null;
  const pins = activeMap?.pins || [];
  const pinnedIds = new Set(pins.map(p => p.entity_id));

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMapMutation = useMutation({
    mutationFn: (data) => base44.entities.CampaignMap.create({ ...data, campaign_id: campaignId, pins: [] }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-maps', campaignId] });
      setSelectedMapId(created.id);
      setShowNewMapDialog(false);
      setNewMapForm({ name: '', image_url: '' });
    },
  });

  const deleteMapMutation = useMutation({
    mutationFn: (id) => base44.entities.CampaignMap.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-maps', campaignId] });
      setSelectedMapId(null);
    },
  });

  const updatePinsMutation = useMutation({
    mutationFn: ({ mapId, pins }) => base44.entities.CampaignMap.update(mapId, { pins }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-maps', campaignId] }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMapClick = useCallback((e) => {
    if (!editMode || !placingLocation || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPin = {
      entity_id: placingLocation.id,
      entity_name: placingLocation.name,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      color: pendingColor,
    };
    const newPins = [...pins, newPin];
    updatePinsMutation.mutate({ mapId: activeMap.id, pins: newPins });
    setPlacingLocation(null);
  }, [editMode, placingLocation, pins, activeMap, pendingColor]);

  const handleRemovePin = (entityId) => {
    const newPins = pins.filter(p => p.entity_id !== entityId);
    updatePinsMutation.mutate({ mapId: activeMap.id, pins: newPins });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setNewMapForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const entityMap = Object.fromEntries(locations.map(l => [l.id, l]));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 dark:border-b dark:border-zinc-800/60 dark:bg-zinc-950/80 border-b border-gray-200 bg-white/80 dark:backdrop-blur backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Map className="w-4 h-4 text-blue-400" />
          </div>

          {/* Map selector */}
          {maps.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-semibold dark:text-zinc-200 dark:hover:text-zinc-100 text-gray-900 hover:text-gray-950">
                  {activeMap?.name || 'Select Map'}
                  <ChevronDown className="w-3.5 h-3.5 dark:text-zinc-500 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dark:bg-zinc-900 dark:border-zinc-800 bg-white border-gray-200">
                {maps.map(m => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => setSelectedMapId(m.id)}
                    className={cn(m.id === activeMap?.id ? 'dark:text-amber-400 text-amber-600' : 'dark:text-gray-300 text-gray-900')}
                  >
                    {m.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
           <span className="text-sm dark:text-zinc-500 text-gray-600">No maps yet</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeMap && (
            <>
              <Button
                size="sm"
                variant={editMode ? 'default' : 'outline'}
                onClick={() => { setEditMode(!editMode); setPlacingLocation(null); }}
                className={editMode
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs'
                  : 'dark:border-zinc-700 dark:text-zinc-400 dark:text-xs dark:hover:text-zinc-200 border-gray-300 text-gray-700 text-xs hover:text-gray-900'}
              >
                {editMode ? <><Check className="w-3.5 h-3.5 mr-1.5" />Done Editing</> : <><Pencil className="w-3.5 h-3.5 mr-1.5" />Edit Pins</>}
              </Button>
              {editMode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMapMutation.mutate(activeMap.id)}
                  className="text-red-500 hover:text-red-400 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </>
          )}
          <Button
            size="sm"
            onClick={() => setShowNewMapDialog(true)}
            className="dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 bg-gray-200 hover:bg-gray-300 text-gray-900 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />New Map
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Map canvas */}
        <div className="flex-1 relative overflow-hidden dark:bg-zinc-950 bg-white flex items-center justify-center">
          {!activeMap ? (
            <div className="text-center">
              <ImageOff className="w-12 h-12 dark:text-zinc-800 text-gray-400 mx-auto mb-3" />
              <p className="dark:text-zinc-500 text-gray-600 text-sm">No map selected</p>
              <p className="dark:text-zinc-500 text-gray-500 text-xs mt-1">Create a new map to get started</p>
              <Button
                size="sm"
                onClick={() => setShowNewMapDialog(true)}
                className="mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />Create Map
              </Button>
            </div>
          ) : !activeMap.image_url ? (
            <div className="text-center">
              <ImageOff className="w-12 h-12 dark:text-zinc-800 text-gray-400 mx-auto mb-3" />
              <p className="dark:text-zinc-500 text-gray-600 text-sm">No image for this map</p>
            </div>
          ) : (
            <div
              ref={mapRef}
              className="relative w-full h-full"
              style={{ cursor: editMode && placingLocation ? 'crosshair' : 'default' }}
              onClick={handleMapClick}
            >
              <img
                src={activeMap.image_url}
                alt={activeMap.name}
                className="w-full h-full object-contain select-none"
                draggable={false}
              />
              {/* Pins */}
              {pins.map((pin) => (
                <MapPinMarker
                  key={pin.entity_id}
                  pin={pin}
                  entity={entityMap[pin.entity_id]}
                  campaignId={campaignId}
                  onRemove={handleRemovePin}
                  editMode={editMode}
                />
              ))}
              {/* Crosshair hint */}
              {editMode && placingLocation && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/90 text-zinc-950 text-xs font-semibold px-3 py-1.5 rounded-full pointer-events-none">
                  Click to place "{placingLocation.name}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit sidebar */}
        {editMode && activeMap && (
          <div className="w-60 dark:border-l dark:border-zinc-800/60 dark:bg-zinc-950/80 border-l border-gray-200 bg-white/80 flex flex-col">
            <div className="p-3 dark:border-b dark:border-zinc-800/40 border-b border-gray-200">
              <p className="text-[10px] dark:text-zinc-600 text-gray-600 uppercase tracking-widest font-semibold">
                Pin Locations
              </p>
              <p className="text-[10px] dark:text-zinc-500 text-gray-600 mt-1">
                {placingLocation ? `Placing: ${placingLocation.name}` : 'Select a location to place'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <PinLocationPicker
                locations={locations}
                pinnedIds={pinnedIds}
                onPick={(loc) => setPlacingLocation(loc)}
                pendingColor={pendingColor}
                onColorChange={setPendingColor}
              />
            </div>
            {/* Already pinned */}
            {pins.length > 0 && (
              <div className="dark:border-t dark:border-zinc-800/60 border-t border-gray-200 p-3">
                <p className="text-[10px] dark:text-zinc-600 text-gray-600 uppercase tracking-widest font-semibold mb-2">
                  Pinned ({pins.length})
                </p>
                <div className="space-y-1">
                  {pins.map(p => (
                    <div key={p.entity_id} className="flex items-center justify-between text-xs dark:text-zinc-500 text-gray-600">
                      <span className="truncate">{p.entity_name}</span>
                      <button
                        onClick={() => handleRemovePin(p.entity_id)}
                        className="dark:text-zinc-500 dark:hover:text-red-400 text-gray-500 hover:text-red-500 ml-2 flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Map Dialog */}
      <Dialog open={showNewMapDialog} onOpenChange={setShowNewMapDialog}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 bg-white border-gray-300 text-gray-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Campaign Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Map name (e.g. The Sword Coast, Dungeon Level 2)"
              value={newMapForm.name}
              onChange={(e) => setNewMapForm(f => ({ ...f, name: e.target.value }))}
              className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 bg-gray-100 border-gray-300 text-gray-900"
            />
            <div>
              <p className="text-xs dark:text-zinc-500 text-gray-600 mb-2">Map image</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste image URL..."
                  value={newMapForm.image_url}
                  onChange={(e) => setNewMapForm(f => ({ ...f, image_url: e.target.value }))}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="border-zinc-700 text-zinc-400 flex-shrink-0"
                >
                  {uploading ? '...' : <Upload className="w-4 h-4" />}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
              {newMapForm.image_url && (
                <img
                  src={newMapForm.image_url}
                  alt="preview"
                  className="mt-2 w-full h-28 object-cover rounded-lg dark:border-zinc-800 border-gray-300 border"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewMapDialog(false)} className="dark:text-zinc-400 text-gray-700">Cancel</Button>
            <Button
              onClick={() => createMapMutation.mutate(newMapForm)}
              disabled={!newMapForm.name.trim() || createMapMutation.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
            >
              Create Map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
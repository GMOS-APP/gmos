import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CampaignMap as CampaignMapEntity, WorldEntity, UploadFile } from '@/api/entities';
import {
  Plus, Pencil, Check, Trash2, Upload, Map, ChevronLeft, ImageOff, BookImage,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import MapPinMarker from '@/components/map/MapPin';
import PinLocationPicker from '@/components/map/PinLocationPicker';
import DysonLogosImporter from '@/components/map/DysonLogosImporter';

export default function CampaignMap() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id') || params.get('id');
  const queryClient = useQueryClient();

  const [view, setView] = useState('gallery'); // 'gallery' | 'detail'
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [placingLocation, setPlacingLocation] = useState(null);
  const [pendingColor, setPendingColor] = useState('amber');
  const [showNewMapDialog, setShowNewMapDialog] = useState(false);
  const [newMapForm, setNewMapForm] = useState({ name: '', image_url: '' });
  const [showDysonBrowser, setShowDysonBrowser] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const mapRef = useRef(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: maps = [] } = useQuery({
    queryKey: ['campaign-maps', campaignId],
    queryFn: () => CampaignMapEntity.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', campaignId],
    queryFn: () => WorldEntity.filter(
      { campaign_id: campaignId, entity_type: 'location' }, 'name', 100
    ),
    enabled: !!campaignId,
  });

  const activeMap = maps.find(m => m.id === selectedMapId) || null;
  const pins = activeMap?.pins || [];
  const pinnedIds = new Set(pins.map(p => p.entity_id));

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMapMutation = useMutation({
    mutationFn: (data) => CampaignMapEntity.create({ ...data, campaign_id: campaignId, pins: [] }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-maps', campaignId] });
      setSelectedMapId(created.id);
      setView('detail');
      setShowNewMapDialog(false);
      setNewMapForm({ name: '', image_url: '' });
    },
  });

  const deleteMapMutation = useMutation({
    mutationFn: (id) => CampaignMapEntity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-maps', campaignId] });
      setSelectedMapId(null);
      setView('gallery');
      setEditMode(false);
    },
  });

  const updatePinsMutation = useMutation({
    mutationFn: ({ mapId, pins: newPins }) => CampaignMapEntity.update(mapId, { pins: newPins }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-maps', campaignId] }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ mapId, name }) => CampaignMapEntity.update(mapId, { name }),
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
    updatePinsMutation.mutate({ mapId: activeMap.id, pins: [...pins, newPin] });
    setPlacingLocation(null);
  }, [editMode, placingLocation, pins, activeMap, pendingColor]);

  const handleRemovePin = (entityId) => {
    updatePinsMutation.mutate({ mapId: activeMap.id, pins: pins.filter(p => p.entity_id !== entityId) });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await UploadFile({ file });
    setNewMapForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const openDetail = (mapId) => {
    setSelectedMapId(mapId);
    setEditMode(false);
    setPlacingLocation(null);
    setView('detail');
  };

  const backToGallery = () => {
    setView('gallery');
    setEditMode(false);
    setPlacingLocation(null);
  };

  const entityMap = Object.fromEntries(locations.map(l => [l.id, l]));

  return (
    <div className="h-full flex flex-col">
      {view === 'gallery' ? (
        <>
          {/* Gallery header */}
          <div className="flex items-center justify-between px-4 py-2.5 dark:border-b dark:border-zinc-800/60 dark:bg-zinc-950/80 border-b border-zinc-200 bg-white/80 dark:backdrop-blur backdrop-blur flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Map className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-900">
                Campaign Maps
                {maps.length > 0 && (
                  <span className="ml-2 text-xs font-normal dark:text-zinc-600 text-zinc-500">
                    {maps.length} map{maps.length !== 1 ? 's' : ''}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowDysonBrowser(true)}
                className="dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs"
              >
                <BookImage className="w-3.5 h-3.5 mr-1.5" />Dyson Logos
              </Button>
              <Button
                size="sm"
                onClick={() => setShowNewMapDialog(true)}
                className="dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />New Map
              </Button>
            </div>
          </div>

          {/* Gallery grid */}
          <div className="flex-1 overflow-y-auto p-5 dark:bg-zinc-950 bg-zinc-50">
            {maps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ImageOff className="w-12 h-12 dark:text-zinc-800 text-zinc-300 mx-auto mb-3" />
                <p className="dark:text-zinc-500 text-zinc-600 text-sm font-medium">No maps yet</p>
                <p className="dark:text-zinc-600 text-zinc-500 text-xs mt-1">Import from Dyson Logos or add your own image</p>
                <div className="flex gap-2 mt-5">
                  <Button
                    size="sm"
                    onClick={() => setShowDysonBrowser(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                  >
                    <BookImage className="w-3.5 h-3.5 mr-1.5" />Browse Dyson Logos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewMapDialog(true)}
                    className="dark:border-zinc-700 dark:text-zinc-400 border-zinc-300 text-zinc-700"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />New Map
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {maps.map(m => (
                  <button
                    key={m.id}
                    onClick={() => openDetail(m.id)}
                    className="group rounded-xl overflow-hidden border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900 bg-white dark:hover:border-amber-500/50 hover:border-amber-400/60 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <div className="aspect-[4/3] dark:bg-zinc-800 bg-zinc-100 overflow-hidden">
                      {m.image_url ? (
                        <img
                          src={m.image_url}
                          alt={m.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="w-8 h-8 dark:text-zinc-700 text-zinc-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm dark:text-zinc-200 text-zinc-900 truncate group-hover:dark:text-amber-400 group-hover:text-amber-600 transition-colors">
                        {m.name}
                      </p>
                      {m.linked_entity_name ? (
                        <p className="text-xs dark:text-green-400 text-green-600 mt-0.5 truncate flex items-center gap-1">
                          <Map className="w-3 h-3 flex-shrink-0" />
                          {m.linked_entity_name}
                        </p>
                      ) : (
                        <p className="text-xs dark:text-zinc-700 text-zinc-400 mt-0.5">No entity linked</p>
                      )}
                      <p className="text-xs dark:text-zinc-700 text-zinc-400 mt-0.5">
                        {(m.pins || []).length} {(m.pins || []).length === 1 ? 'pin' : 'pins'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Detail header */}
          <div className="flex items-center justify-between px-4 py-2.5 dark:border-b dark:border-zinc-800/60 dark:bg-zinc-950/80 border-b border-zinc-200 bg-white/80 dark:backdrop-blur backdrop-blur flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={backToGallery}
                className="flex items-center gap-1 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Maps
              </button>
              <span className="dark:text-zinc-700 text-zinc-300 text-xs">/</span>
              {editMode ? (
                <input
                  value={pendingName}
                  onChange={(e) => setPendingName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setEditMode(false)}
                  className="text-sm font-semibold dark:text-zinc-200 text-zinc-900 bg-transparent border-b dark:border-zinc-600 border-zinc-400 focus:outline-none focus:dark:border-amber-500 focus:border-amber-500 w-48"
                  autoFocus
                />
              ) : (
                <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-900">
                  {activeMap?.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeMap && (
                <>
                  <Button
                    size="sm"
                    variant={editMode ? 'default' : 'outline'}
                    onClick={() => {
                      if (editMode) {
                        const trimmed = pendingName.trim();
                        if (trimmed && trimmed !== activeMap.name) {
                          renameMutation.mutate({ mapId: activeMap.id, name: trimmed });
                        }
                        setEditMode(false);
                        setPlacingLocation(null);
                      } else {
                        setPendingName(activeMap.name);
                        setEditMode(true);
                      }
                    }}
                    className={editMode
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs'
                      : 'dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-zinc-300 text-zinc-700 text-xs hover:text-zinc-900'}
                  >
                    {editMode
                      ? <><Check className="w-3.5 h-3.5 mr-1.5" />Done Editing</>
                      : <><Pencil className="w-3.5 h-3.5 mr-1.5" />Edit Pins</>}
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
            </div>
          </div>

          {/* Map canvas + edit sidebar */}
          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 relative overflow-hidden dark:bg-zinc-950 bg-white flex items-center justify-center">
              {!activeMap?.image_url ? (
                <div className="text-center">
                  <ImageOff className="w-12 h-12 dark:text-zinc-800 text-zinc-400 mx-auto mb-3" />
                  <p className="dark:text-zinc-500 text-zinc-600 text-sm">No image for this map</p>
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
              <div className="w-60 dark:border-l dark:border-zinc-800/60 dark:bg-zinc-950/80 border-l border-zinc-200 bg-white/80 flex flex-col">
                <div className="p-3 dark:border-b dark:border-zinc-800/40 border-b border-zinc-200">
                  <p className="text-[10px] dark:text-zinc-600 text-zinc-600 uppercase tracking-widest font-semibold">
                    Pin Locations
                  </p>
                  <p className="text-[10px] dark:text-zinc-500 text-zinc-600 mt-1">
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
                {pins.length > 0 && (
                  <div className="dark:border-t dark:border-zinc-800/60 border-t border-zinc-200 p-3">
                    <p className="text-[10px] dark:text-zinc-600 text-zinc-600 uppercase tracking-widest font-semibold mb-2">
                      Pinned ({pins.length})
                    </p>
                    <div className="space-y-1">
                      {pins.map(p => (
                        <div key={p.entity_id} className="flex items-center justify-between text-xs dark:text-zinc-500 text-zinc-600">
                          <span className="truncate">{p.entity_name}</span>
                          <button
                            onClick={() => handleRemovePin(p.entity_id)}
                            className="dark:text-zinc-500 dark:hover:text-red-400 text-zinc-500 hover:text-red-500 ml-2 flex-shrink-0"
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
        </>
      )}

      {/* Dyson Logos Browser */}
      <DysonLogosImporter
        open={showDysonBrowser}
        onClose={() => setShowDysonBrowser(false)}
        onImport={(mapData) => createMapMutation.mutate(mapData, {
          onSuccess: () => setShowDysonBrowser(false),
        })}
        isImporting={createMapMutation.isPending}
      />

      {/* New Map Dialog */}
      <Dialog open={showNewMapDialog} onOpenChange={setShowNewMapDialog}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 bg-white border-zinc-300 text-zinc-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Campaign Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Map name (e.g. The Sword Coast, Dungeon Level 2)"
              value={newMapForm.name}
              onChange={(e) => setNewMapForm(f => ({ ...f, name: e.target.value }))}
              className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 bg-zinc-100 border-zinc-300 text-zinc-900"
            />
            <div>
              <p className="text-xs dark:text-zinc-500 text-zinc-600 mb-2">Map image</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste image URL..."
                  value={newMapForm.image_url}
                  onChange={(e) => setNewMapForm(f => ({ ...f, image_url: e.target.value }))}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 bg-zinc-100 border-zinc-300 text-zinc-900 flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="dark:border-zinc-700 dark:text-zinc-400 border-zinc-300 text-zinc-600 flex-shrink-0"
                >
                  {uploading ? '...' : <Upload className="w-4 h-4" />}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
              {newMapForm.image_url && (
                <img
                  src={newMapForm.image_url}
                  alt="preview"
                  className="mt-2 w-full h-28 object-cover rounded-lg dark:border-zinc-800 border-zinc-300 border"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewMapDialog(false)} className="dark:text-zinc-400 text-zinc-700">Cancel</Button>
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

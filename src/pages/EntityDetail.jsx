import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorldEntity, Relationship, Campaign } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Trash2, Plus, X, BookOpen, Download, Pencil,
} from 'lucide-react';
import StatBlock from '@/components/entity/StatBlock';
import EntityStatBlockView from '@/components/entity/EntityStatBlockView';
import DndBeyondImport from '@/components/entity/DndBeyondImport';
import InitiativeTracker from '@/components/encounter/InitiativeTracker';
import TypeSpecificFields from '@/components/entity/TypeSpecificFields.jsx';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import EntityMentionRenderer from '@/components/common/EntityMentionRenderer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CampaignProvider, useCampaign } from '@/lib/CampaignContext';

const entityTypes = ['note', 'npc', 'creature', 'location', 'faction', 'thread', 'item', 'player_character', 'event', 'lore', 'deity', 'encounter', 'shop'];
const statuses = ['active', 'inactive', 'dead', 'destroyed', 'resolved', 'unknown'];
const visibilities = ['gm_only', 'players_know', 'players_suspect', 'false_info'];

const TYPE_COLORS = {
  npc:              'bg-blue-500/15 text-blue-400 border-blue-500/30',
  creature:         'bg-red-500/15 text-red-400 border-red-500/30',
  location:         'bg-green-500/15 text-green-400 border-green-500/30',
  faction:          'bg-purple-500/15 text-purple-400 border-purple-500/30',
  thread:           'bg-orange-500/15 text-orange-400 border-orange-500/30',
  item:             'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  player_character: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  event:            'bg-pink-500/15 text-pink-400 border-pink-500/30',
  lore:             'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  deity:            'bg-amber-500/15 text-amber-400 border-amber-500/30',
  encounter:        'bg-rose-500/15 text-rose-400 border-rose-500/30',
  shop:             'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  note:             'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

const STATUS_COLORS = {
  active:    'bg-green-500/15 text-green-400 border-green-500/30',
  inactive:  'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  dead:      'bg-red-500/15 text-red-400 border-red-500/30',
  destroyed: 'bg-red-500/15 text-red-400 border-red-500/30',
  resolved:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  unknown:   'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

const VISIBILITY_LABELS = {
  gm_only:         'GM Only',
  players_know:    'Players Know',
  players_suspect: 'Players Suspect',
  false_info:      'False Info',
};

function humanizeKey(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function EntityDetailInner() {
  const { system } = useCampaign();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const entityId = params.get('id');
  const campaignId = params.get('campaign_id');
  const isNew = params.get('new') === 'true';
  const defaultType = params.get('type') || 'npc';
  const queryClient = useQueryClient();

  const [pageMode, setPageMode] = useState(isNew ? 'edit' : 'view'); // 'view' | 'edit'
  const [form, setForm] = useState({
    campaign_id: campaignId || '',
    name: '', entity_type: defaultType, summary: '', description: '',
    status: 'active', visibility: 'gm_only', tags: [], key_facts: [],
    last_seen_session: null, image_url: '', npc_data: null, extra_data: {},
  });
  const [newTag, setNewTag] = useState('');
  const [newFact, setNewFact] = useState('');
  const [saved, setSaved] = useState(false);
  const [entryMode, setEntryMode] = useState(isNew ? null : 'manual');
  const [descriptionMode, setDescriptionMode] = useState('edit'); // 'edit' | 'preview'

  // Reset all state when navigating to a different entity
  useEffect(() => {
    setForm({
      campaign_id: campaignId || '',
      name: '', entity_type: defaultType, summary: '', description: '',
      status: 'active', visibility: 'gm_only', tags: [], key_facts: [],
      last_seen_session: null, image_url: '', npc_data: null, extra_data: {},
    });
    setNewTag('');
    setNewFact('');
    setSaved(false);
    setEntryMode(isNew ? null : 'manual');
    setDescriptionMode('edit');
    setPageMode(isNew ? 'edit' : 'view');
  }, [entityId]);

  const { data: entity, isLoading } = useQuery({
    queryKey: ['entity', entityId],
    queryFn: () => WorldEntity.filter({ id: entityId }),
    enabled: !!entityId && !isNew,
    select: (d) => d?.[0],
  });

  const { data: campaignEntities = [] } = useQuery({
    queryKey: ['entities', form.campaign_id],
    queryFn: () => WorldEntity.filter({ campaign_id: form.campaign_id }),
    enabled: !!form.campaign_id,
    staleTime: 30000,
  });

  const { campaign: campaignData } = useCampaign();

  const { data: relationships = [] } = useQuery({
    queryKey: ['relationships', entityId],
    queryFn: async () => {
      const [asSource, asTarget] = await Promise.all([
        Relationship.filter({ source_entity_id: entityId }),
        Relationship.filter({ target_entity_id: entityId }),
      ]);
      return [...asSource, ...asTarget];
    },
    enabled: !!entityId && !isNew,
  });

  useEffect(() => {
    if (entity) {
      setForm({
        campaign_id: entity.campaign_id || campaignId || '',
        name: entity.name || '',
        entity_type: entity.entity_type || 'npc',
        summary: entity.summary || '',
        description: entity.description || '',
        status: entity.status || 'active',
        visibility: entity.visibility || 'dm_only',
        tags: entity.tags || [],
        key_facts: entity.key_facts || [],
        last_seen_session: entity.last_seen_session,
        image_url: entity.image_url || '',
        npc_data: entity.npc_data || null,
        extra_data: entity.extra_data || {},
      });
    }
  }, [entity]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isNew || !entityId) {
        return WorldEntity.create(data);
      }
      return WorldEntity.update(entityId, data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['entity'] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setPageMode('view');
      if (isNew && result?.id) {
        window.history.replaceState(null, '', `/${window.location.pathname.split('/').pop()}?id=${result.id}&campaign_id=${form.campaign_id}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => WorldEntity.delete(entityId),
    onSuccess: () => {
      navigate(createPageUrl('EntityBrowser') + `?campaign_id=${form.campaign_id}`);
    },
  });

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm({ ...form, tags: [...form.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const addFact = () => {
    if (newFact.trim()) {
      setForm({ ...form, key_facts: [...form.key_facts, newFact.trim()] });
      setNewFact('');
    }
  };

  if (isLoading && !isNew) {
    return <div className="p-8"><div className="h-8 w-48 dark:bg-zinc-800 bg-zinc-200 rounded animate-pulse" /></div>;
  }

  // Entry mode selection for new entities
  if (isNew && !entryMode) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <Link
          to={createPageUrl('EntityBrowser') + `?campaign_id=${campaignId}`}
          className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-600 hover:text-zinc-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to entities
        </Link>

        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900 mb-1 text-center capitalize">
            New {defaultType.replace('_', ' ')}
          </h2>
          <p className="text-sm dark:text-zinc-500 text-zinc-600 text-center mb-8">Choose how you'd like to create this {defaultType.replace('_', ' ')}</p>

          <div className={`grid gap-4 ${defaultType === 'note' ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-1 max-w-xs mx-auto'}`}>
            <button
              onClick={() => setEntryMode('manual')}
              className="group p-6 rounded-xl dark:border-2 dark:border-zinc-800 dark:bg-zinc-900/40 border-2 border-zinc-300 bg-zinc-50 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold dark:text-zinc-100 text-zinc-900 mb-1">Manual Entry</h3>
                  <p className="text-xs dark:text-zinc-500 text-zinc-600">Write your own content from scratch</p>
                </div>
              </div>
            </button>
          </div>

          {defaultType === 'player_character' && system.hasDndBeyondImport && (
            <div className="mt-4">
              <button
                onClick={() => setEntryMode('dnd_import')}
                className="group w-full p-5 rounded-xl dark:border-2 dark:border-zinc-800 dark:bg-zinc-900/40 border-2 border-zinc-300 bg-zinc-50 dark:hover:border-purple-500/50 dark:hover:bg-purple-500/5 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <Download className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold dark:text-zinc-100 text-zinc-900 mb-0.5">Import from D&D Beyond</h3>
                    <p className="text-xs dark:text-zinc-500 text-zinc-600">Pull character data directly from your D&D Beyond sheet</p>
                  </div>
                </div>
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // D&D Beyond Import mode
  if (isNew && entryMode === 'dnd_import') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <DndBeyondImport
          onImport={(characterData) => {
            setForm((prev) => ({ ...prev, ...characterData }));
            setEntryMode('manual');
          }}
          onCancel={() => setEntryMode(null)}
        />
      </div>
    );
  }

  // ── Read-only view ──────────────────────────────────────────────────────────
  if (!isNew && pageMode === 'view') {
    // Classify extra_data fields for display
    const extraFields = Object.entries(form.extra_data || {}).filter(([_, v]) => {
      if (v === null || v === undefined || v === '') return false;
      if (typeof v === 'object') return false; // skip nested objects (ability_scores etc.)
      return true;
    });
    const isLongValue = (v) => typeof v === 'string' && (v.includes('\n') || v.length > 120);
    const shortFields = extraFields.filter(([_, v]) => !isLongValue(v));
    const longFields  = extraFields.filter(([_, v]) =>  isLongValue(v));

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        {/* Back */}
        <Link
          to={createPageUrl('EntityBrowser') + `?campaign_id=${form.campaign_id}`}
          className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-600 hover:text-zinc-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to entities
        </Link>

        {/* Header */}
        <div className="flex items-start gap-5 mb-8">
          {form.entity_type === 'player_character' && form.image_url && (
            <img
              src={form.image_url}
              alt={form.name}
              className="w-28 h-36 rounded-lg object-cover border-2 dark:border-zinc-800 border-zinc-200 shadow-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold dark:text-zinc-100 text-zinc-900 mb-3 leading-tight">
              {form.name || 'Unnamed'}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${TYPE_COLORS[form.entity_type] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'}`}>
                {form.entity_type.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[form.status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'}`}>
                {form.status}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border dark:border-zinc-700 dark:text-zinc-500 border-zinc-300 text-zinc-600">
                {VISIBILITY_LABELS[form.visibility] || form.visibility}
              </span>
              {form.last_seen_session && (
                <span className="text-xs dark:text-zinc-600 text-zinc-500">
                  Session {form.last_seen_session}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={() => setPageMode('edit')}
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            {entityId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="dark:text-zinc-500 dark:hover:text-red-400 text-zinc-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="dark:bg-zinc-900 dark:border-zinc-800 bg-white border-zinc-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="dark:text-zinc-100 text-zinc-900">Delete entity?</AlertDialogTitle>
                    <AlertDialogDescription className="dark:text-zinc-400 text-zinc-600">
                      This will permanently remove {form.name} from your world.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Summary */}
          {form.summary && (
            <p className="text-base dark:text-zinc-400 text-zinc-600 italic leading-relaxed border-l-2 dark:border-amber-500/40 border-amber-400/50 pl-4">
              {form.summary}
            </p>
          )}

          {/* Key Facts */}
          {form.key_facts.length > 0 && (
            <div>
              <h3 className="text-xs dark:text-zinc-500 text-zinc-500 uppercase tracking-widest font-semibold mb-3">
                Key Facts
              </h3>
              <ul className="space-y-2">
                {form.key_facts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 flex-shrink-0 mt-[7px]" />
                    <span className="text-sm dark:text-zinc-300 text-zinc-800 leading-relaxed">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* NPC / Creature / PC — system-aware stat block */}
          {['npc', 'creature', 'player_character'].includes(form.entity_type) && (
            <EntityStatBlockView form={form} system={system} campaignEntities={campaignEntities} />
          )}

          {/* Encounter — existing stat block */}
          {form.entity_type === 'encounter' && (
            <StatBlock extraData={form.extra_data} system={system} description={form.description} />
          )}

          {/* All other types — generic key-value grid */}
          {!['npc', 'creature', 'player_character', 'encounter'].includes(form.entity_type) && (
            <>
              {shortFields.length > 0 && (
                <div>
                  <h3 className="text-xs dark:text-zinc-500 text-zinc-500 uppercase tracking-widest font-semibold mb-3 capitalize">
                    {form.entity_type.replace('_', ' ')} Details
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {shortFields.map(([key, val]) => (
                      <div key={key}>
                        <span className="text-[11px] dark:text-zinc-600 text-zinc-500 uppercase tracking-wide block mb-0.5">
                          {humanizeKey(key)}
                        </span>
                        <span className="text-sm dark:text-zinc-300 text-zinc-900">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {longFields.length > 0 && (
                <div className="space-y-6">
                  {longFields.map(([key, val]) => (
                    <div key={key}>
                      <h3 className="text-xs dark:text-zinc-500 text-zinc-500 uppercase tracking-widest font-semibold mb-2">
                        {humanizeKey(key)}
                      </h3>
                      <p className="text-sm dark:text-zinc-300 text-zinc-800 leading-relaxed whitespace-pre-wrap">
                        {String(val)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Description — shown for all types (GM notes, AI-generated prose, etc.) */}
          {form.description && (
            <div>
              <h3 className="text-xs dark:text-zinc-500 text-zinc-500 uppercase tracking-widest font-semibold mb-3">
                Description
              </h3>
              <div className="text-sm dark:text-zinc-300 text-zinc-800 leading-relaxed">
                <EntityMentionRenderer
                  text={form.description}
                  entities={campaignEntities}
                  campaignId={form.campaign_id}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {form.tags.length > 0 && (
            <div>
              <h3 className="text-xs dark:text-zinc-500 text-zinc-500 uppercase tracking-widest font-semibold mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="dark:border-zinc-700 dark:text-zinc-400 border-zinc-300 text-zinc-700 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Relationships */}
          {relationships.length > 0 && (
            <div>
              <h3 className="text-xs dark:text-zinc-500 text-zinc-500 uppercase tracking-widest font-semibold mb-2">
                Relationships
              </h3>
              <div className="space-y-1">
                {relationships.map((rel) => {
                  const isSource = rel.source_entity_id === entityId;
                  const linkedName = isSource ? rel.target_name : rel.source_name;
                  const linkedId = isSource ? rel.target_entity_id : rel.source_entity_id;
                  return (
                    <Link
                      key={rel.id}
                      to={createPageUrl('EntityDetail') + `?id=${linkedId}&campaign_id=${form.campaign_id}`}
                      className="flex items-center gap-2 p-2 rounded-lg dark:hover:bg-zinc-800/50 hover:bg-zinc-100/50 group"
                    >
                      <span className="text-xs dark:text-zinc-600 text-zinc-500 w-24 text-right capitalize">
                        {rel.relationship_type?.replace('_', ' ')}
                      </span>
                      <span className="text-xs dark:text-zinc-700 text-zinc-400">→</span>
                      <span className="text-sm dark:text-zinc-300 dark:group-hover:text-amber-400 text-zinc-900 group-hover:text-amber-600">
                        {linkedName}
                      </span>
                      {rel.status !== 'active' && (
                        <Badge variant="outline" className="text-[10px] dark:border-zinc-700 dark:text-zinc-600 border-zinc-300 text-zinc-600 capitalize ml-auto">
                          {rel.status}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Edit form ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Back / Cancel */}
      {isNew ? (
        <Link
          to={createPageUrl('EntityBrowser') + `?campaign_id=${form.campaign_id}`}
          className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-600 hover:text-zinc-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to entities
        </Link>
      ) : (
        <button
          onClick={() => setPageMode('view')}
          className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-600 hover:text-zinc-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancel edit
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        {/* Portrait (PC only) */}
        {form.entity_type === 'player_character' && form.image_url && (
          <div className="flex-shrink-0 mr-6">
            <img
              src={form.image_url}
              alt={form.name}
              className="w-32 h-40 rounded-lg object-cover border-2 border-zinc-800 shadow-lg"
            />
          </div>
        )}
        <div className="flex-1">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Entity name"
            className="text-2xl font-bold bg-transparent border-none p-0 dark:text-zinc-100 dark:placeholder:text-zinc-700 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-0 h-auto"
          />
          <div className="flex items-center gap-3 mt-3">
            <Select value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: v })}>
              <SelectTrigger className="w-40 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 bg-white border-zinc-300 text-zinc-900 text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800 bg-white border-zinc-300">
                {entityTypes.map((t) => (
                  <SelectItem key={t} value={t} className="text-zinc-300 capitalize text-xs">
                    {t.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="w-32 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 bg-white border-zinc-300 text-zinc-900 text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800 bg-white border-zinc-300">
                {statuses.map((s) => (
                  <SelectItem key={s} value={s} className="dark:text-zinc-300 text-zinc-900 capitalize text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
              <SelectTrigger className="w-36 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 bg-white border-zinc-300 text-zinc-900 text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800 bg-white border-zinc-300">
                {visibilities.map((v) => (
                  <SelectItem key={v} value={v} className="dark:text-zinc-300 text-zinc-900 text-xs capitalize">{v.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending || !form.name.trim()}
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
          >
            <Save className="w-4 h-4 mr-1" />
            {saved ? 'Saved!' : 'Save'}
          </Button>
          {!isNew && entityId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-zinc-100">Delete entity?</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    This will permanently remove {form.name} from your world.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-6">
        <div>
          <label className="text-xs dark:text-zinc-500 text-zinc-600 uppercase tracking-widest font-semibold mb-2 block">Summary</label>
          <Input
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="One-line summary for quick scanning..."
            className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500"
          />
        </div>

        {/* Key Facts */}
        <div>
          <label className="text-xs dark:text-zinc-500 text-zinc-600 uppercase tracking-widest font-semibold mb-2 block">Key Facts</label>
          <div className="space-y-1.5 mb-2">
            {form.key_facts.map((fact, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 flex-shrink-0" />
                <span className="text-sm dark:text-zinc-300 text-zinc-900 flex-1">{fact}</span>
                <button onClick={() => setForm({ ...form, key_facts: form.key_facts.filter((_, j) => j !== i) })}
                  className="opacity-0 group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-red-400 text-zinc-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFact())}
              placeholder="Add a key fact..."
              className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:text-sm dark:placeholder:text-zinc-600 bg-zinc-100 border-zinc-300 text-zinc-900 text-sm placeholder:text-zinc-500"
            />
            <Button onClick={addFact} size="sm" variant="ghost" className="text-zinc-500">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Type-Specific Fields */}
        {form.entity_type && (
          <div>
            <label className="text-xs dark:text-zinc-500 text-zinc-600 uppercase tracking-widest font-semibold mb-3 block capitalize">
              {form.entity_type.replace('_', ' ')} Details
            </label>
            <TypeSpecificFields
              entityType={form.entity_type}
              extraData={form.extra_data}
              onChange={(data) => setForm({ ...form, extra_data: data })}
            />
          </div>
        )}

        {/* Stat Block (for NPCs, Creatures, Encounters) */}
        {['npc', 'creature', 'encounter'].includes(form.entity_type) && (
          <StatBlock
            extraData={form.extra_data}
            system={system}
            description={form.description}
          />
        )}

        {/* Initiative Tracker (Encounters only) */}
        {form.entity_type === 'encounter' && (
          <div>
            <label className="text-xs dark:text-zinc-500 text-zinc-600 uppercase tracking-widest font-semibold mb-3 block">Initiative Tracker</label>
            <InitiativeTracker campaignId={form.campaign_id} />
          </div>
        )}

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <label className="text-xs dark:text-zinc-500 text-zinc-600 uppercase tracking-widest font-semibold">Description</label>
              <div className="flex items-center gap-0.5 dark:bg-zinc-900 dark:border dark:border-zinc-800 bg-zinc-100 border border-zinc-300 rounded-lg p-0.5">
                <button
                  onClick={() => setDescriptionMode('edit')}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${descriptionMode === 'edit' ? 'dark:bg-zinc-700 dark:text-zinc-200 bg-zinc-300 text-zinc-900' : 'dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-600 hover:text-zinc-800'}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setDescriptionMode('preview')}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${descriptionMode === 'preview' ? 'dark:bg-zinc-700 dark:text-zinc-200 bg-zinc-300 text-zinc-900' : 'dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-600 hover:text-zinc-800'}`}
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          {descriptionMode === 'edit' ? (
            <EntityMentionTextarea
              value={form.description}
              onChange={(val) => setForm({ ...form, description: val })}
              campaignId={form.campaign_id}
              placeholder="Full description, history, notes... Type @ to link a world entity"
              rows={12}
            />
          ) : (
            <div className="dark:bg-zinc-900/60 dark:border dark:border-zinc-800 bg-zinc-100 border border-zinc-300 rounded-lg p-4 min-h-[200px] text-sm dark:text-zinc-300 text-zinc-900 leading-relaxed">
              {form.description ? (
                <EntityMentionRenderer
                  text={form.description}
                  entities={campaignEntities}
                  campaignId={form.campaign_id}
                />
              ) : (
                <span className="dark:text-zinc-600 text-zinc-500">No description yet.</span>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs dark:text-zinc-500 text-zinc-600 uppercase tracking-widest font-semibold mb-2 block">Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="dark:border-zinc-700 dark:text-zinc-400 border-zinc-300 text-zinc-700 text-xs cursor-pointer dark:hover:border-red-500/50 dark:hover:text-red-400 hover:border-red-400/50 hover:text-red-600"
                onClick={() => setForm({ ...form, tags: form.tags.filter((_, j) => j !== i) })}>
                {tag} <X className="w-2.5 h-2.5 ml-1" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag..."
              className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:text-sm dark:placeholder:text-zinc-600 bg-zinc-100 border-zinc-300 text-zinc-900 text-sm placeholder:text-zinc-500 max-w-xs"
            />
          </div>
        </div>

        {/* Relationships */}
        {!isNew && relationships.length > 0 && (
          <div>
            <label className="text-xs dark:text-zinc-500 text-zinc-600 uppercase tracking-widest font-semibold mb-2 block">Relationships</label>
            <div className="space-y-1.5">
              {relationships.map((rel) => {
                const isSource = rel.source_entity_id === entityId;
                const linkedName = isSource ? rel.target_name : rel.source_name;
                const linkedId = isSource ? rel.target_entity_id : rel.source_entity_id;
                return (
                  <Link
                    key={rel.id}
                    to={createPageUrl('EntityDetail') + `?id=${linkedId}&campaign_id=${form.campaign_id}`}
                    className="flex items-center gap-2 p-2 rounded-lg dark:hover:bg-zinc-800/50 hover:bg-zinc-100/50 group"
                  >
                    <span className="text-xs dark:text-zinc-600 text-zinc-500 w-24 text-right">{rel.relationship_type?.replace('_', ' ')}</span>
                    <span className="text-xs dark:text-zinc-700 text-zinc-600">→</span>
                    <span className="text-sm dark:text-zinc-300 dark:group-hover:text-amber-400 text-zinc-900 group-hover:text-amber-600">{linkedName}</span>
                    {rel.status !== 'active' && (
                      <Badge variant="outline" className="text-[10px] dark:border-zinc-700 dark:text-zinc-600 border-zinc-300 text-zinc-600 capitalize ml-auto">
                        {rel.status}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EntityDetail() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const campaignId = params.get('campaign_id');

  const { data: campaignData } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (d) => d?.[0],
    staleTime: 60000,
  });

  return (
    <CampaignProvider campaign={campaignData}>
      <EntityDetailInner />
    </CampaignProvider>
  );
}

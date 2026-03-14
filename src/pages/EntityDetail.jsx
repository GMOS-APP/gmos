import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorldEntity, Relationship, InvokeLLM, Campaign } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, Trash2, Plus, X, BookOpen, Loader2, Wand2, Search, Download,
} from 'lucide-react';
import StatBlock from '@/components/entity/StatBlock';
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
import AiGate from '@/components/ui/AiGate';
import { CampaignProvider, useCampaign } from '@/lib/CampaignContext';

const entityTypes = ['npc', 'creature', 'location', 'faction', 'thread', 'item', 'player_character', 'event', 'lore', 'deity', 'encounter', 'shop'];
const statuses = ['active', 'inactive', 'dead', 'destroyed', 'resolved', 'unknown'];
const visibilities = ['gm_only', 'players_know', 'players_suspect', 'false_info'];

function EntityDetailInner() {
  const { system } = useCampaign();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const entityId = params.get('id');
  const campaignId = params.get('campaign_id');
  const isNew = params.get('new') === 'true';
  const defaultType = params.get('type') || 'npc';
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    campaign_id: campaignId || '',
    name: '', entity_type: defaultType, summary: '', description: '',
    status: 'active', visibility: 'gm_only', tags: [], key_facts: [],
    last_seen_session: null, image_url: '', npc_data: null, extra_data: {},
  });
  const [newTag, setNewTag] = useState('');
  const [newFact, setNewFact] = useState('');
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [entryMode, setEntryMode] = useState(isNew ? null : 'manual');
  const [srdSearch, setSrdSearch] = useState('');
  const [srdResults, setSrdResults] = useState([]);
  const [searching, setSearching] = useState(false);
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
    setGenerating(false);
    setEntryMode(isNew ? null : 'manual');
    setSrdSearch('');
    setSrdResults([]);
    setDescriptionMode('edit');
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
      if (isNew && result?.id) {
        window.history.replaceState(null, '', `/${window.location.pathname.split('/').pop()}?id=${result.id}&campaign_id=${form.campaign_id}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => WorldEntity.delete(entityId),
    onSuccess: () => {
      window.location.href = createPageUrl('EntityBrowser') + `?campaign_id=${form.campaign_id}`;
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

  const generateContent = async () => {
    setGenerating(true);
    const systemName = system.promptName;

    const typePrompts = {
      npc: `Generate content for this NPC suitable for ${systemName}, including:
- Stat block or equivalent mechanics
- Traits and special abilities
- Actions and reactions
- Personality traits, ideals, bonds, flaws
- Physical description and mannerisms
- Roleplay suggestions`,
      creature: `Generate content for this creature suitable for ${systemName}, including:
- Stat block or equivalent mechanics
- Traits and special abilities
- Actions and reactions
- Physical description and mannerisms
- Roleplay suggestions`,
      location: `Generate content for this location suitable for ${systemName}, including:
- Detailed physical description
- Notable features and points of interest
- Inhabitants and their motivations
- Potential encounters or hazards
- Secrets and hidden elements
- Hooks for adventure`,
      item: `Generate content for this item suitable for ${systemName}, including:
- Item type and rarity
- Properties and mechanics
- History and lore
- Potential side effects or drawbacks`,
      faction: `Generate content for this faction suitable for ${systemName}, including:
- Organizational structure
- Goals and motivations
- Resources and capabilities
- Key figures and their roles
- Joining requirements and ranks`,
      thread: `Generate content for this plot thread suitable for ${systemName}, including:
- Current situation and stakes
- Key figures involved
- Potential developments and branches
- Success/failure outcomes
- Connections to other threads`,
      event: `Generate content for this event suitable for ${systemName}, including:
- Timeline and trigger conditions
- Key participants and witnesses
- Aftermath and consequences
- Ways players can influence the outcome`,
      lore: `Generate content for this lore element suitable for ${systemName}, including:
- Historical context and timeline
- Key figures and their contributions
- Impact on the current world state
- Common knowledge vs. secret information`,
      player_character: `Generate content for this player character suitable for ${systemName}, including:
- Background suggestions
- Personality traits, ideals, bonds, flaws
- Character arc possibilities
- Personal quest hooks
- Roleplay suggestions`,
      deity: `Generate content for this deity suitable for ${systemName}, including:
- Domain(s) and alignment
- Holy symbol and iconography
- Tenets and commandments
- Worshippers and clergy structure
- Temples and sacred sites
- Myths and legends`,
      encounter: `Generate content for this encounter suitable for ${systemName}, including:
- Encounter difficulty
- Terrain and environmental features
- Enemy composition and tactics
- Treasure and rewards
- Read-aloud description
- Potential complications`,
      shop: `Generate content for this shop suitable for ${systemName}, including:
- Shop type and specialty
- Shopkeeper personality and appearance
- Available inventory with prices
- Services offered
- Quest hooks or rumors`,
    };

    const prompt = typePrompts[form.entity_type] || typePrompts.npc;

    const context = `Entity: ${form.name || 'Unnamed'}
Type: ${form.entity_type}
System: ${systemName}
Current Summary: ${form.summary || 'None'}
Current Description: ${form.description || 'None'}
Key Facts: ${form.key_facts?.join(', ') || 'None'}
Tags: ${form.tags?.join(', ') || 'None'}

${prompt}

Keep content practical for table use. Use markdown formatting. Focus on actionable information for the GM.`;

    const result = await InvokeLLM({
      prompt: context,
    });

    setForm({ ...form, description: result });
    setGenerating(false);
  };

  const searchSRD = async () => {
    if (!srdSearch.trim()) return;
    setSearching(true);
    
    const prompt = `Search ${system.promptName} rules for creatures/adversaries matching: "${srdSearch}"

Return a JSON array of matching creatures with this exact schema:
{
  "creatures": [
    {
      "name": "exact creature name",
      "type": "creature type (e.g., humanoid, beast, undead)",
      "cr": "challenge rating",
      "summary": "one-line description"
    }
  ]
}

If no exact matches, find similar creatures. Return up to 5 matches.`;

    const result = await InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          creatures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                cr: { type: "string" },
                summary: { type: "string" }
              }
            }
          }
        }
      }
    });

    setSrdResults(result.creatures || []);
    setSearching(false);
  };

  const importCreature = async (creature) => {
    setGenerating(true);
    
    const prompt = `Import the complete stat block and information for: ${creature.name} (from ${system.promptName})

Include:
- Full stat block (AC, HP, Speed, ability scores, skills, senses, languages)
- Traits and special abilities
- Actions, bonus actions, and reactions
- Legendary actions (if applicable)
- Lair actions (if applicable)
- Description and lore
- Tactics and combat behavior

Format with markdown for readability.`;

    const content = await InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
    });

    setForm({
      ...form,
      name: creature.name,
      entity_type: 'npc',
      summary: creature.summary,
      description: content,
      tags: [creature.type, `CR ${creature.cr}`],
    });

    setEntryMode('manual');
    setSrdResults([]);
    setSrdSearch('');
    setGenerating(false);
  };

  if (isLoading && !isNew) {
    return <div className="p-8"><div className="h-8 w-48 dark:bg-zinc-800 bg-gray-200 rounded animate-pulse" /></div>;
  }

  // Entry mode selection for new entities
  if (isNew && !entryMode) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <Link
          to={createPageUrl('EntityBrowser') + `?campaign_id=${campaignId}`}
          className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to entities
        </Link>

        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="text-2xl font-bold dark:text-zinc-100 text-gray-900 mb-1 text-center capitalize">
            New {defaultType.replace('_', ' ')}
          </h2>
          <p className="text-sm dark:text-zinc-500 text-gray-600 text-center mb-8">Choose how you'd like to create this {defaultType.replace('_', ' ')}</p>
          
          <div className={`grid gap-4 ${defaultType === 'creature' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <AiGate>
            <button
              onClick={async () => {
                setEntryMode('auto');
                setGenerating(true);
                await generateContent();
                setGenerating(false);
              }}
              className="group p-6 rounded-xl dark:border-2 dark:border-zinc-800 dark:bg-zinc-900/40 border-2 border-gray-300 bg-gray-50 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Wand2 className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold dark:text-zinc-100 text-gray-900 mb-1">Auto Generate</h3>
                  <p className="text-xs dark:text-zinc-500 text-gray-600">AI generates content for your system</p>
                </div>
              </div>
            </button>
            </AiGate>

            {defaultType === 'creature' && system.hasSrdImport && (
              <button
                onClick={() => setEntryMode('srd_import')}
                className="group p-6 rounded-xl dark:border-2 dark:border-zinc-800 dark:bg-zinc-900/40 border-2 border-gray-300 bg-gray-50 dark:hover:border-green-500/50 dark:hover:bg-green-500/5 hover:border-green-500/50 hover:bg-green-500/5 transition-all"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                    <Download className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold dark:text-zinc-100 text-gray-900 mb-1">Import from SRD</h3>
                    <p className="text-xs dark:text-zinc-500 text-gray-600">Search and import from the rulebook</p>
                  </div>
                </div>
              </button>
            )}

            <button
              onClick={() => setEntryMode('manual')}
              className="group p-6 rounded-xl dark:border-2 dark:border-zinc-800 dark:bg-zinc-900/40 border-2 border-gray-300 bg-gray-50 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold dark:text-zinc-100 text-gray-900 mb-1">Manual Entry</h3>
                  <p className="text-xs dark:text-zinc-500 text-gray-600">Write your own content from scratch</p>
                </div>
              </div>
            </button>
          </div>

          {defaultType === 'player_character' && system.hasDndBeyondImport && (
            <div className="mt-4">
              <button
                onClick={() => setEntryMode('dnd_import')}
                className="group w-full p-5 rounded-xl dark:border-2 dark:border-zinc-800 dark:bg-zinc-900/40 border-2 border-gray-300 bg-gray-50 dark:hover:border-purple-500/50 dark:hover:bg-purple-500/5 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <Download className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold dark:text-zinc-100 text-gray-900 mb-0.5">Import from D&D Beyond</h3>
                    <p className="text-xs dark:text-zinc-500 text-gray-600">Pull character data directly from your D&D Beyond sheet</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {generating && (
            <div className="mt-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto mb-2" />
              <p className="text-sm dark:text-zinc-500 text-gray-600">Generating content...</p>
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

  // SRD Import mode
  if (isNew && entryMode === 'srd_import') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <button
          onClick={() => setEntryMode(null)}
          className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to options
        </button>

        <div className="max-w-2xl mx-auto mt-8">
          <h2 className="text-2xl font-bold dark:text-zinc-100 text-gray-900 mb-2">Import Creature from SRD</h2>
          <p className="text-sm dark:text-zinc-500 text-gray-600 mb-6">Search the D&D 5e System Reference Document 5.2.1</p>

          <div className="flex gap-2 mb-6">
            <Input
              value={srdSearch}
              onChange={(e) => setSrdSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchSRD()}
              placeholder="Search for creature (e.g., Goblin, Ancient Red Dragon)..."
              className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 bg-gray-100 border-gray-300 text-gray-900"
            />
            <AiGate>
              <Button
                onClick={searchSRD}
                disabled={searching || !srdSearch.trim()}
                className="bg-green-500 hover:bg-green-400 text-zinc-950"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </AiGate>
          </div>

          {searching && (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-400 mx-auto mb-2" />
              <p className="text-sm dark:text-zinc-500 text-gray-600">Searching SRD...</p>
            </div>
          )}

          {!searching && srdResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs dark:text-zinc-500 text-gray-600 mb-3">Found {srdResults.length} creature(s):</p>
              {srdResults.map((creature, idx) => (
                <button
                  key={idx}
                  onClick={() => importCreature(creature)}
                  disabled={generating}
                  className="w-full p-4 rounded-lg dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/60 dark:hover:border-green-500/50 border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-green-500/50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold dark:text-zinc-100 dark:group-hover:text-green-400 text-gray-900 group-hover:text-green-600 mb-1">{creature.name}</h3>
                      <p className="text-xs dark:text-zinc-500 text-gray-600 mb-2">{creature.summary}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 capitalize">
                          {creature.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                          CR {creature.cr}
                        </Badge>
                      </div>
                    </div>
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-green-400 ml-4" />
                    ) : (
                      <Download className="w-4 h-4 dark:text-zinc-600 dark:group-hover:text-green-400 text-gray-400 group-hover:text-green-600 ml-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searching && srdResults.length === 0 && srdSearch && (
            <div className="text-center py-8 dark:text-zinc-500 text-gray-600 text-sm">
              No creatures found. Try a different search term.
            </div>
          )}

          {generating && (
            <div className="mt-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-green-400 mx-auto mb-2" />
              <p className="text-sm dark:text-zinc-500 text-gray-600">Importing creature data...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Back */}
      <Link
        to={createPageUrl('EntityBrowser') + `?campaign_id=${form.campaign_id}`}
        className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to entities
      </Link>

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
            className="text-2xl font-bold bg-transparent border-none p-0 dark:text-zinc-100 dark:placeholder:text-zinc-700 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 h-auto"
          />
          <div className="flex items-center gap-3 mt-3">
            <Select value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: v })}>
              <SelectTrigger className="w-40 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 bg-white border-gray-300 text-gray-900 text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800 bg-white border-gray-300">
                {entityTypes.map((t) => (
                  <SelectItem key={t} value={t} className="text-zinc-300 capitalize text-xs">
                    {t.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="w-32 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 bg-white border-gray-300 text-gray-900 text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800 bg-white border-gray-300">
                {statuses.map((s) => (
                  <SelectItem key={s} value={s} className="dark:text-zinc-300 text-gray-900 capitalize text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
              <SelectTrigger className="w-36 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 bg-white border-gray-300 text-gray-900 text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800 bg-white border-gray-300">
                {visibilities.map((v) => (
                  <SelectItem key={v} value={v} className="dark:text-zinc-300 text-gray-900 text-xs capitalize">{v.replace('_', ' ')}</SelectItem>
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
          <label className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-widest font-semibold mb-2 block">Summary</label>
          <Input
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="One-line summary for quick scanning..."
            className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
        </div>

        {/* Key Facts */}
        <div>
          <label className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-widest font-semibold mb-2 block">Key Facts</label>
          <div className="space-y-1.5 mb-2">
            {form.key_facts.map((fact, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 flex-shrink-0" />
                <span className="text-sm dark:text-zinc-300 text-gray-900 flex-1">{fact}</span>
                <button onClick={() => setForm({ ...form, key_facts: form.key_facts.filter((_, j) => j !== i) })}
                  className="opacity-0 group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-red-400 text-gray-400 hover:text-red-500">
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
              className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:text-sm dark:placeholder:text-zinc-600 bg-gray-100 border-gray-300 text-gray-900 text-sm placeholder:text-gray-500"
            />
            <Button onClick={addFact} size="sm" variant="ghost" className="text-zinc-500">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Type-Specific Fields */}
        {form.entity_type && (
          <div>
            <label className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-widest font-semibold mb-3 block capitalize">
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
        {['npc', 'creature', 'encounter'].includes(form.entity_type) && form.description && (
          <div>
            <label className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-widest font-semibold mb-2 block">Stat Block</label>
            <StatBlock description={form.description} />
          </div>
        )}

        {/* Initiative Tracker (Encounters only) */}
        {form.entity_type === 'encounter' && (
          <div>
            <label className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-widest font-semibold mb-3 block">Initiative Tracker</label>
            <InitiativeTracker campaignId={form.campaign_id} />
          </div>
        )}

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <label className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-widest font-semibold">Description</label>
              <div className="flex items-center gap-0.5 dark:bg-zinc-900 dark:border dark:border-zinc-800 bg-gray-100 border border-gray-300 rounded-lg p-0.5">
                <button
                  onClick={() => setDescriptionMode('edit')}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${descriptionMode === 'edit' ? 'dark:bg-zinc-700 dark:text-zinc-200 bg-gray-300 text-gray-900' : 'dark:text-zinc-500 dark:hover:text-zinc-300 text-gray-600 hover:text-gray-800'}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setDescriptionMode('preview')}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${descriptionMode === 'preview' ? 'dark:bg-zinc-700 dark:text-zinc-200 bg-gray-300 text-gray-900' : 'dark:text-zinc-500 dark:hover:text-zinc-300 text-gray-600 hover:text-gray-800'}`}
                >
                  Preview
                </button>
              </div>
            </div>
            <AiGate>
              <Button
                onClick={generateContent}
                disabled={generating || !form.name.trim()}
                size="sm"
                variant="outline"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-7 text-xs"
              >
                {generating ? (
                  <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="w-3 h-3 mr-1.5" /> Generate SRD Content</>
                )}
              </Button>
            </AiGate>
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
            <div className="dark:bg-zinc-900/60 dark:border dark:border-zinc-800 bg-gray-100 border border-gray-300 rounded-lg p-4 min-h-[200px] text-sm dark:text-zinc-300 text-gray-900 leading-relaxed">
              {form.description ? (
                <EntityMentionRenderer
                  text={form.description}
                  entities={campaignEntities}
                  campaignId={form.campaign_id}
                />
              ) : (
                <span className="dark:text-zinc-600 text-gray-500">No description yet.</span>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-widest font-semibold mb-2 block">Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="dark:border-zinc-700 dark:text-zinc-400 border-gray-300 text-gray-700 text-xs cursor-pointer dark:hover:border-red-500/50 dark:hover:text-red-400 hover:border-red-400/50 hover:text-red-600"
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
              className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:text-sm dark:placeholder:text-zinc-600 bg-gray-100 border-gray-300 text-gray-900 text-sm placeholder:text-gray-500 max-w-xs"
            />
          </div>
        </div>

        {/* Relationships */}
        {!isNew && relationships.length > 0 && (
          <div>
            <label className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-widest font-semibold mb-2 block">Relationships</label>
            <div className="space-y-1.5">
              {relationships.map((rel) => {
                const isSource = rel.source_entity_id === entityId;
                const linkedName = isSource ? rel.target_name : rel.source_name;
                const linkedId = isSource ? rel.target_entity_id : rel.source_entity_id;
                return (
                  <Link
                    key={rel.id}
                    to={createPageUrl('EntityDetail') + `?id=${linkedId}&campaign_id=${form.campaign_id}`}
                    className="flex items-center gap-2 p-2 rounded-lg dark:hover:bg-zinc-800/50 hover:bg-gray-100/50 group"
                  >
                    <span className="text-xs dark:text-zinc-600 text-gray-500 w-24 text-right">{rel.relationship_type?.replace('_', ' ')}</span>
                    <span className="text-xs dark:text-zinc-700 text-gray-600">→</span>
                    <span className="text-sm dark:text-zinc-300 dark:group-hover:text-amber-400 text-gray-900 group-hover:text-amber-600">{linkedName}</span>
                    {rel.status !== 'active' && (
                      <Badge variant="outline" className="text-[10px] dark:border-zinc-700 dark:text-zinc-600 border-gray-300 text-gray-600 capitalize ml-auto">
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
  const entityId = params.get('id');

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

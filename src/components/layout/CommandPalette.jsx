import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { WorldEntity, Session } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { ENTITY_CREATE_TYPES } from '@/lib/entityCreateTypes';
import { getEntityColors } from '@/lib/entityColors';
import EntityAvatar from '@/components/entity/EntityAvatar';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from '@/components/ui/command';
import {
  LayoutDashboard, Search, Network, Map, CalendarDays,
  StickyNote, Dices, History, Eye, Settings, Plus,
} from 'lucide-react';

export default function CommandPalette({ open, onOpenChange, campaignId }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data: entities = [] } = useQuery({
    queryKey: ['global-search-entities', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId }, '-updated_date', 500),
    enabled: !!campaignId,
    staleTime: 30000,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['global-search-sessions', campaignId],
    queryFn: () => Session.filter({ campaign_id: campaignId }, '-session_number', 100),
    enabled: !!campaignId,
    staleTime: 30000,
  });

  // Go-to pages mirror the sidebar's URL construction (Dashboard uses ?id=).
  const goToPages = useMemo(() => [
    { page: 'CampaignDashboard', label: 'Dashboard', Icon: LayoutDashboard, query: `?id=${campaignId}` },
    { page: 'EntityBrowser', label: 'All Entities', Icon: Search, query: `?campaign_id=${campaignId}` },
    { page: 'RelationshipMap', label: 'Relationship Map', Icon: Network, query: `?campaign_id=${campaignId}` },
    { page: 'CampaignMap', label: 'Campaign Map', Icon: Map, query: `?campaign_id=${campaignId}` },
    { page: 'SessionBrowser', label: 'Sessions', Icon: CalendarDays, query: `?campaign_id=${campaignId}` },
    { page: 'CampaignNotes', label: 'Notes', Icon: StickyNote, query: `?campaign_id=${campaignId}` },
    { page: 'RandomTableBrowser', label: 'Random Tables', Icon: Dices, query: `?campaign_id=${campaignId}` },
    { page: 'CampaignTimeline', label: 'Timeline', Icon: History, query: `?campaign_id=${campaignId}` },
    { page: 'PlayerView', label: 'Player View', Icon: Eye, query: `?campaign_id=${campaignId}` },
    { page: 'CampaignSettings', label: 'Settings', Icon: Settings, query: `?campaign_id=${campaignId}` },
  ], [campaignId]);

  const q = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (q.length < 1) return [];
    return [
      ...entities
        .filter((e) =>
          e.name?.toLowerCase().includes(q) ||
          e.summary?.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q))
        )
        .slice(0, 8)
        .map((e) => ({
          id: e.id,
          label: e.name,
          sub: e.summary || e.entity_type,
          type: e.entity_type,
          image_url: e.image_url || null,
          href: createPageUrl('EntityDetail') + `?id=${e.id}&campaign_id=${campaignId}`,
        })),
      ...sessions
        .filter((s) => (s.title || `Session ${s.session_number}`).toLowerCase().includes(q))
        .slice(0, 4)
        .map((s) => ({
          id: s.id,
          label: s.title || `Session #${s.session_number}`,
          sub: s.date
            ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : `Session #${s.session_number}`,
          type: 'session',
          href: createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${s.id}`,
        })),
    ];
  }, [q, entities, sessions, campaignId]);

  const matches = (label) => !q || label.toLowerCase().includes(q);
  const createItems = ENTITY_CREATE_TYPES.filter((t) => matches(`new ${t.label}`) || matches(t.label));
  const goToItems = goToPages.filter((p) => matches(p.label) || matches(`go to ${p.label}`));

  const run = (href) => {
    onOpenChange(false);
    setQuery('');
    navigate(href);
  };

  const handleOpenChange = (next) => {
    if (!next) setQuery('');
    onOpenChange(next);
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Search, create, or jump to…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {searchResults.length > 0 && (
          <CommandGroup heading="Search results">
            {searchResults.map((r) => {
              const isSession = r.type === 'session';
              const color = isSession ? 'text-zinc-500' : getEntityColors(r.type).text;
              return (
                <CommandItem key={`result-${r.id}`} value={`result-${r.id}`} onSelect={() => run(r.href)}>
                  {isSession
                    ? <CalendarDays className={`flex-shrink-0 ${color}`} />
                    : <EntityAvatar entity={{ entity_type: r.type, image_url: r.image_url, name: r.label }} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{r.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate capitalize">{r.sub}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground capitalize flex-shrink-0">
                    {isSession ? 'session' : r.type?.replace('_', ' ')}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {createItems.length > 0 && (
          <CommandGroup heading="Create">
            {createItems.map(({ type, label, Icon }) => (
              <CommandItem
                key={`create-${type}`}
                value={`create-${type}`}
                onSelect={() => run(createPageUrl('EntityDetail') + `?new=true&type=${type}&campaign_id=${campaignId}`)}
              >
                <Plus className="text-amber-500" />
                <Icon className="text-amber-500" />
                <span>New {label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {goToItems.length > 0 && (
          <CommandGroup heading="Go to">
            {goToItems.map(({ page, label, Icon, query: pageQuery }) => (
              <CommandItem
                key={`goto-${page}`}
                value={`goto-${page}`}
                onSelect={() => run(createPageUrl(page) + pageQuery)}
              >
                <Icon />
                <span>{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

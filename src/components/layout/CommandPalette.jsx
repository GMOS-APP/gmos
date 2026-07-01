import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { WorldEntity, Session } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { getEntityColors } from '@/lib/entityColors';
import { useCampaignEntityTypes } from '@/lib/entityTypes';
import { useAuth } from '@/lib/AuthContext';
import EntityAvatar from '@/components/entity/EntityAvatar';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from '@/components/ui/command';
import { CalendarDays, Plus, Dices, Compass, HelpCircle, Shapes, ShieldCheck } from 'lucide-react';
import { CAMPAIGN_NAV_ITEMS, navHref } from '@/lib/navItems';
import { useWindowManager } from '@/lib/WindowManager';
import { useNotifications } from '@/lib/NotificationContext';

// Inline dice: "2d6+3", "d20", "roll 1d8-1".
const DICE_RE = /^\s*(?:roll\s+)?(\d*)\s*d\s*(\d+)\s*([+-]\s*\d+)?\s*$/i;
function parseDice(input) {
  const m = (input || '').match(DICE_RE);
  if (!m) return null;
  const count = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2], 10);
  const mod = m[3] ? parseInt(m[3].replace(/\s+/g, ''), 10) : 0;
  if (count < 1 || count > 100 || sides < 1 || sides > 1000) return null;
  return { count, sides, mod, label: `${count}d${sides}${mod ? (mod > 0 ? `+${mod}` : `${mod}`) : ''}` };
}
function rollDice({ count, sides, mod }) {
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) + mod };
}

export default function CommandPalette({ open, onOpenChange, campaignId, onStartTour }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const wm = useWindowManager();
  const notifier = useNotifications();

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

  const q = query.trim().toLowerCase();
  const dice = useMemo(() => parseDice(query), [query]);
  const diceRoll = useMemo(() => (dice ? rollDice(dice) : null), [dice]);

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

  const { types: enabledTypes } = useCampaignEntityTypes(campaignId);
  const { isAdmin } = useAuth();
  const matches = (label) => !q || label.toLowerCase().includes(q);
  const createItems = enabledTypes
    .map((t) => ({ type: t.key, label: t.labelSingular, Icon: t.Icon }))
    .filter((t) => matches(`new ${t.label}`) || matches(t.label));
  const goToItems = CAMPAIGN_NAV_ITEMS.filter((p) => matches(p.label) || matches(`go to ${p.label}`));

  const run = (href) => {
    onOpenChange(false);
    setQuery('');
    if (wm) wm.openWindow(href); else navigate(href);
  };

  const handleOpenChange = (next) => {
    if (!next) setQuery('');
    onOpenChange(next);
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Search, create, jump, or roll 2d6…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {dice && diceRoll && (
          <CommandGroup heading="Command">
            <CommandItem
              value="cmd-roll"
              onSelect={() => {
                notifier?.notify({
                  title: `🎲 ${dice.label} → ${diceRoll.total}`,
                  body: `rolls: ${diceRoll.rolls.join(', ')}${dice.mod ? ` (${dice.mod > 0 ? '+' : ''}${dice.mod})` : ''}`,
                  type: 'success',
                });
                handleOpenChange(false);
              }}
            >
              <Dices className="text-amber-500" />
              <span>Roll {dice.label}</span>
              <span className="ml-auto font-mono text-sm tabular-nums">
                {diceRoll.total}
                <span className="text-[10px] text-muted-foreground ml-1.5">({diceRoll.rolls.join(', ')})</span>
              </span>
            </CommandItem>
          </CommandGroup>
        )}

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

        {isAdmin && (matches('admin') || matches('admin console') || matches('console')) && (
          <CommandGroup heading="Admin">
            <CommandItem
              value="admin-console"
              onSelect={() => { onOpenChange(false); setQuery(''); navigate('/admin'); }}
            >
              <ShieldCheck className="text-amber-500" />
              <span>Open admin console</span>
            </CommandItem>
          </CommandGroup>
        )}

        {(matches('entity type') || matches('custom type') || matches('new type') ||
          matches('type builder') || matches('manage types')) && (
          <CommandGroup heading="Entity types">
            <CommandItem
              value="manage-entity-types"
              onSelect={() => run(createPageUrl('EntityTypes') + `?campaign_id=${campaignId}`)}
            >
              <Shapes className="text-amber-500" />
              <span>Manage entity types</span>
            </CommandItem>
          </CommandGroup>
        )}

        {goToItems.length > 0 && (
          <CommandGroup heading="Go to">
            {goToItems.map((item) => (
              <CommandItem
                key={`goto-${item.page}`}
                value={`goto-${item.page}`}
                onSelect={() => run(navHref(item, campaignId))}
              >
                <item.Icon />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(q === 'xyzzy' || q === 'plugh') && (
          <CommandGroup heading="???">
            <CommandItem
              value="deep-delve"
              onSelect={() => {
                onOpenChange(false);
                setQuery('');
                window.dispatchEvent(new CustomEvent('gmos:easter-egg', { detail: 'delve' }));
              }}
            >
              <Compass className="text-amber-500" />
              <span>A hollow voice says &ldquo;Deep Delve&rdquo;…</span>
            </CommandItem>
          </CommandGroup>
        )}

        {(matches('manual') || matches('help') || matches('docs') || matches('guide') ||
          (onStartTour && (matches('take the tour') || matches('tour') || matches('walkthrough')))) && (
          <CommandGroup heading="Help">
            {(matches('manual') || matches('help') || matches('docs') || matches('guide')) && (
              <CommandItem
                value="open-manual"
                onSelect={() => run(createPageUrl('Help'))}
              >
                <HelpCircle className="text-amber-500" />
                <span>Open the manual</span>
              </CommandItem>
            )}
            {onStartTour && (matches('take the tour') || matches('tour') || matches('help') || matches('walkthrough')) && (
              <CommandItem
                value="start-tour"
                onSelect={() => { onOpenChange(false); setQuery(''); onStartTour(); }}
              >
                <Compass className="text-amber-500" />
                <span>Take the interactive tour</span>
              </CommandItem>
            )}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

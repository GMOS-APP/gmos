import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { WorldEntity, Session } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';
import { useEntityTypes } from '@/lib/entityTypes';

export default function Breadcrumbs({ currentPageName, campaign }) {
  const params = new URLSearchParams(window.location.search);
  const { byKey } = useEntityTypes(campaign);
  // campaign_id is explicit on most pages; 'id' is used by Dashboard & SessionPage for campaign
  const campaignId = campaign?.id;
  const entityId = currentPageName === 'EntityDetail' ? params.get('id') : null;
  const sessionId = currentPageName === 'SessionPage' ? params.get('session_id') : null;
  const isNew = params.get('new') === 'true';

  const { data: entity } = useQuery({
    queryKey: ['bc-entity', entityId],
    queryFn: () => WorldEntity.filter({ id: entityId }),
    enabled: !!entityId && !isNew,
    select: (d) => d?.[0],
    staleTime: 60000,
  });

  const { data: session } = useQuery({
    queryKey: ['bc-session', sessionId],
    queryFn: () => Session.filter({ id: sessionId }),
    enabled: !!sessionId,
    select: (d) => d?.[0],
    staleTime: 60000,
  });

  if (!campaign) return null;

  const crumbs = [];

  // Always: campaign name → dashboard
  crumbs.push({
    label: campaign.name,
    href: createPageUrl('CampaignDashboard') + `?id=${campaignId}`,
  });

  switch (currentPageName) {
    case 'EntityBrowser': {
      const typeFilter = params.get('type');
      crumbs.push({ label: 'Entities', href: typeFilter ? createPageUrl('EntityBrowser') + `?campaign_id=${campaignId}` : null });
      if (typeFilter) {
        crumbs.push({ label: byKey[typeFilter]?.label || typeFilter, href: null });
      }
      break;
    }
    case 'EntityDetail': {
      crumbs.push({ label: 'Entities', href: createPageUrl('EntityBrowser') + `?campaign_id=${campaignId}` });
      crumbs.push({ label: isNew ? 'New Entity' : (entity?.name || '…'), href: null });
      break;
    }
    case 'SessionBrowser':
      crumbs.push({ label: 'Sessions', href: null });
      break;
    case 'SessionPage': {
      crumbs.push({ label: 'Sessions', href: createPageUrl('SessionBrowser') + `?campaign_id=${campaignId}` });
      if (isNew) {
        crumbs.push({ label: 'New Session', href: null });
      } else if (session) {
        crumbs.push({ label: session.title || `Session #${session.session_number}`, href: null });
      }
      break;
    }
    case 'RelationshipMap':
      crumbs.push({ label: 'Relationship Map', href: null });
      break;
    case 'EntityTypes':
      crumbs.push({ label: 'Entity Types', href: null });
      break;
    case 'CampaignMap':
      crumbs.push({ label: 'Campaign Map', href: null });
      break;
    case 'CampaignDashboard':
    default:
      break;
  }

  return (
    <nav className="flex items-center gap-1 px-4 py-2 text-xs border-b border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 flex-shrink-0 overflow-hidden">
      <Link
        to={createPageUrl('CampaignList')}
        className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-semibold flex-shrink-0"
      >
        GM/OS
      </Link>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700 flex-shrink-0" />
          {crumb.href ? (
            <Link
              to={crumb.href}
              className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 truncate max-w-[140px]"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[160px]">
              {crumb.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
import {
  LayoutDashboard, Search, Network, Map, CalendarDays,
  StickyNote, Dices, History, Eye, Settings,
} from 'lucide-react';
import { createPageUrl } from '@/utils';

// Single source of truth for the campaign-scoped primary navigation, shared by
// the Sidebar and the command palette's "Go to" group. `param` captures the
// quirk that the Dashboard keys off ?id= while everything else uses ?campaign_id=.
export const CAMPAIGN_NAV_ITEMS = [
  { page: 'CampaignDashboard', label: 'Dashboard', Icon: LayoutDashboard, param: 'id' },
  { page: 'EntityBrowser', label: 'All Entities', Icon: Search, param: 'campaign_id' },
  { page: 'RelationshipMap', label: 'Relationship Map', Icon: Network, param: 'campaign_id' },
  { page: 'CampaignMap', label: 'Campaign Map', Icon: Map, param: 'campaign_id' },
  { page: 'SessionBrowser', label: 'Sessions', Icon: CalendarDays, param: 'campaign_id' },
  { page: 'CampaignNotes', label: 'Notes', Icon: StickyNote, param: 'campaign_id' },
  { page: 'RandomTableBrowser', label: 'Random Tables', Icon: Dices, param: 'campaign_id' },
  { page: 'CampaignTimeline', label: 'Timeline', Icon: History, param: 'campaign_id' },
  { page: 'PlayerView', label: 'Player View', Icon: Eye, param: 'campaign_id' },
  { page: 'CampaignSettings', label: 'Settings', Icon: Settings, param: 'campaign_id' },
];

export const navHref = (item, campaignId) =>
  createPageUrl(item.page) + `?${item.param}=${campaignId}`;

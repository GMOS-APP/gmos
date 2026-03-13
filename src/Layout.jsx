import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import GlobalSearch from '@/components/layout/GlobalSearch';
import { Menu, Loader2 } from 'lucide-react';
import BootSequence from '@/components/layout/BootSequence';

const CAMPAIGN_PAGES = ['CampaignDashboard', 'EntityDetail', 'EntityBrowser', 'RelationshipMap', 'CampaignMap', 'SessionPage', 'SessionBrowser'];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [booting, setBooting] = useState(() => !sessionStorage.getItem('gmos_booted'));
  const { user, isLoadingAuth } = useAuth();

  const handleBootComplete = () => {
    sessionStorage.setItem('gmos_booted', '1');
    setBooting(false);
  };

  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id') || (CAMPAIGN_PAGES.includes(currentPageName) && !params.get('campaign_id') ? params.get('id') : null);
  const isCampaignPage = CAMPAIGN_PAGES.includes(currentPageName);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => base44.entities.Campaign.filter({ id: campaignId }),
    enabled: !!campaignId && isCampaignPage && !isLoadingAuth,
    select: (data) => data?.[0],
  });

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
  }

  if (booting) {
    return <BootSequence userName={user?.full_name || user?.email} onComplete={handleBootComplete} />;
  }

  // Full-bleed layout
  if (!isCampaignPage || !campaignId) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <style>{`body { overflow: hidden; }`}</style>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless mobileOpen, always visible on md+ */}
      <div className={`
        fixed inset-y-0 left-0 z-30 md:relative md:flex md:flex-col
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar
          campaign={campaign}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onNavClick={() => setMobileOpen(false)}
        />
      </div>

      <main className="flex-1 h-full overflow-y-auto flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 md:hidden flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-400">{campaign?.name}</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 flex-shrink-0">
          <Breadcrumbs currentPageName={currentPageName} campaign={campaign} />
          <div className="ml-auto hidden sm:block">
            <GlobalSearch campaignId={campaignId} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
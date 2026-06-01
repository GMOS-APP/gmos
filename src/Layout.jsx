import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Campaign } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import QuickCapture from '@/components/layout/QuickCapture';
import CommandPalette from '@/components/layout/CommandPalette';
import ShortcutsHelp from '@/components/layout/ShortcutsHelp';
import Taskbar from '@/components/layout/Taskbar';
import StartMenu from '@/components/layout/StartMenu';
import ToolDock from '@/components/layout/ToolDock';
import Footer from '@/components/layout/Footer';
import { useHotkeys } from '@/lib/useHotkeys';
import { useHotkeysEnabled } from '@/lib/useHotkeysEnabled';
import { Loader2 } from 'lucide-react';
const CAMPAIGN_PAGES = ['CampaignDashboard', 'EntityDetail', 'EntityBrowser', 'RelationshipMap', 'CampaignMap', 'SessionPage', 'SessionBrowser', 'RandomTableBrowser', 'CampaignTimeline', 'PlayerView', 'CampaignNotes', 'CampaignSettings'];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const { isLoadingAuth } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id') || (CAMPAIGN_PAGES.includes(currentPageName) && !params.get('campaign_id') ? params.get('id') : null);
  const isCampaignPage = CAMPAIGN_PAGES.includes(currentPageName);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => Campaign.filter({ id: campaignId }),
    enabled: !!campaignId && isCampaignPage && !isLoadingAuth,
    select: (data) => data?.[0],
  });

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const hotkeysEnabled = useHotkeysEnabled();
  const hotkeysActive = isCampaignPage && !!campaignId && hotkeysEnabled;
  useHotkeys(hotkeysActive ? [
    { code: 'KeyK', mod: true, allowInInput: true, handler: () => setPaletteOpen((o) => !o) },
    { code: 'KeyN', alt: true, handler: () => setCreateOpen(true) },
    { code: 'Slash', shift: true, handler: () => setHelpOpen(true) },
  ] : []);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
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
    <div className="flex flex-col h-screen overflow-hidden max-w-[1920px] mx-auto">
      <style>{`body { overflow: hidden; }`}</style>

      <Taskbar
        campaign={campaign}
        currentPageName={currentPageName}
        startActive={startOpen}
        onStart={() => setStartOpen((o) => !o)}
        onSearch={() => setPaletteOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar — desktop only, toggleable from the Start menu */}
        {!sidebarHidden && (
          <div className="hidden md:flex md:flex-col flex-shrink-0">
            <Sidebar
              campaign={campaign}
              collapsed={collapsed}
              onToggle={() => setCollapsed(!collapsed)}
              onNavClick={() => {}}
            />
          </div>
        )}

        <main className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto min-h-0">
            {children}
            <Footer />
          </div>
        </main>
      </div>

      <StartMenu
        open={startOpen}
        onClose={() => setStartOpen(false)}
        campaign={campaign}
        campaignId={campaignId}
        onOpenPalette={() => setPaletteOpen(true)}
        onCreate={() => setCreateOpen(true)}
        onToggleSidebar={() => setSidebarHidden((h) => !h)}
        sidebarHidden={sidebarHidden}
      />
      <ToolDock />
      <QuickCapture campaignId={campaignId} open={createOpen} onOpenChange={setCreateOpen} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} campaignId={campaignId} />
      <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}

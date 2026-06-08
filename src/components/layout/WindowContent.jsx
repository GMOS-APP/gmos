import React, { useContext, useMemo } from 'react';
import {
  UNSAFE_LocationContext as LocationContext,
  UNSAFE_NavigationContext as NavigationContext,
  UNSAFE_RouteContext as RouteContext,
} from 'react-router-dom';
import { useWindowManager, WINDOW_PAGES, pageKeyOf } from '@/lib/WindowManager';

import CampaignDashboard from '@/pages/CampaignDashboard';
import EntityBrowser from '@/pages/EntityBrowser';
import EntityDetail from '@/pages/EntityDetail';
import RelationshipMap from '@/pages/RelationshipMap';
import CampaignMap from '@/pages/CampaignMap';
import BattleMap from '@/pages/BattleMap';
import SessionBrowser from '@/pages/SessionBrowser';
import SessionPage from '@/pages/SessionPage';
import RandomTableBrowser from '@/pages/RandomTableBrowser';
import CampaignTimeline from '@/pages/CampaignTimeline';
import CampaignNotes from '@/pages/CampaignNotes';
import CampaignSettings from '@/pages/CampaignSettings';
import PartyInventory from '@/pages/PartyInventory';
import PlayerView from '@/pages/PlayerView';

const PAGES = {
  CampaignDashboard, EntityBrowser, EntityDetail, RelationshipMap, CampaignMap, BattleMap,
  SessionBrowser, SessionPage, RandomTableBrowser, CampaignTimeline,
  CampaignNotes, CampaignSettings, PartyInventory, PlayerView,
};

const splitUrl = (url) => {
  const [pathname, search = ''] = (url || '/').split('?');
  return { pathname: pathname || '/', search: search ? `?${search}` : '' };
};
const toHref = (to) => (typeof to === 'string' ? to : `${to.pathname || ''}${to.search || ''}${to.hash || ''}`);

// Each window gets its own react-router location + navigator by providing the
// router contexts directly (NOT a nested <Router>, which v6 forbids). This makes
// useLocation/useNavigate/<Link> resolve to *this window's* URL, and routes any
// in-window navigation back through the WindowManager — no page changes needed.
export default function WindowContent({ id, url }) {
  const wm = useWindowManager();
  const parentNav = useContext(NavigationContext); // inherit basename/future from the top router
  const { pathname, search } = splitUrl(url);

  const location = useMemo(
    () => ({ pathname, search, hash: '', state: null, key: url || 'default' }),
    [pathname, search, url],
  );

  const navigator = useMemo(() => {
    const navTo = (to) => {
      const full = toHref(to);
      if (WINDOW_PAGES.includes(pageKeyOf(full))) wm.updateWindowUrl(id, full);
      else wm.escape(full);
    };
    return {
      createHref: toHref,
      encodeLocation: (to) => { const s = splitUrl(toHref(to)); return { ...s, hash: '' }; },
      push: navTo,
      replace: navTo,
      go: () => {},
    };
  }, [id, wm]);

  // Inherit the parent's future flags (v7_relativeSplatPath, etc.) but force an
  // EMPTY basename: useNavigate/<Link> otherwise prepend the app basename
  // (/GM-OS/ in production) before calling our navigator, so navTo would see
  // "/GM-OS/EntityDetail", mis-route it (pageKeyOf → "GM-OS/…"), escape to the
  // top router, and double the basename → 404. With basename '' the navigator
  // receives clean paths like "/EntityDetail".
  const navContext = useMemo(() => ({ ...parentNav, navigator, static: false, basename: '' }), [parentNav, navigator]);
  const locContext = useMemo(() => ({ location, navigationType: 'PUSH' }), [location]);
  const routeContext = useMemo(() => ({ outlet: null, matches: [], isDataRoute: false }), []);

  const Page = PAGES[pageKeyOf(url)];

  return (
    <NavigationContext.Provider value={navContext}>
      <LocationContext.Provider value={locContext}>
        <RouteContext.Provider value={routeContext}>
          {Page ? <Page /> : <div className="p-6 text-sm text-zinc-500">Unknown page.</div>}
        </RouteContext.Provider>
      </LocationContext.Provider>
    </NavigationContext.Provider>
  );
}

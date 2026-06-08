import React, { useContext, useMemo, Suspense, lazy } from 'react';
import {
  UNSAFE_LocationContext as LocationContext,
  UNSAFE_NavigationContext as NavigationContext,
  UNSAFE_RouteContext as RouteContext,
} from 'react-router-dom';
import { useWindowManager, WINDOW_PAGES, pageKeyOf } from '@/lib/WindowManager';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import PageLoader from '@/components/common/PageLoader';

// Lazy so each window page is its own chunk (loaded when first opened). These
// dynamic imports resolve to the same chunks as pages.config.js — Rollup dedupes.
const CampaignDashboard = lazy(() => import('@/pages/CampaignDashboard'));
const EntityBrowser = lazy(() => import('@/pages/EntityBrowser'));
const EntityDetail = lazy(() => import('@/pages/EntityDetail'));
const RelationshipMap = lazy(() => import('@/pages/RelationshipMap'));
const CampaignMap = lazy(() => import('@/pages/CampaignMap'));
const BattleMap = lazy(() => import('@/pages/BattleMap'));
const SessionBrowser = lazy(() => import('@/pages/SessionBrowser'));
const SessionPage = lazy(() => import('@/pages/SessionPage'));
const RandomTableBrowser = lazy(() => import('@/pages/RandomTableBrowser'));
const CampaignTimeline = lazy(() => import('@/pages/CampaignTimeline'));
const CampaignNotes = lazy(() => import('@/pages/CampaignNotes'));
const CampaignSettings = lazy(() => import('@/pages/CampaignSettings'));
const PartyInventory = lazy(() => import('@/pages/PartyInventory'));
const PlayerView = lazy(() => import('@/pages/PlayerView'));

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
          <ErrorBoundary scope="window" resetKey={url}>
            <Suspense fallback={<PageLoader />}>
              {Page ? <Page /> : <div className="p-6 text-sm text-zinc-500">Unknown page.</div>}
            </Suspense>
          </ErrorBoundary>
        </RouteContext.Provider>
      </LocationContext.Provider>
    </NavigationContext.Provider>
  );
}

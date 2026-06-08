import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import LandingPage from '@/components/layout/LandingPage';
import PageLoader from '@/components/common/PageLoader';
const PublicPlayerView = lazy(() => import('@/pages/PublicPlayerView'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Help = lazy(() => import('@/pages/Help'));
const AdminConsole = lazy(() => import('@/pages/AdminConsole'));
import AccentSync from '@/lib/AccentSync';
import ChangelogDialog from '@/components/layout/ChangelogDialog';
import EasterEggHost from '@/components/easter/EasterEggHost';
import BootSequence from '@/components/layout/BootSequence';
import { AudioPlayerProvider } from '@/lib/AudioPlayerContext';
import { NotificationProvider } from '@/lib/NotificationContext';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <>
    <BootSequence />
    <ChangelogDialog />
    <EasterEggHost />
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AudioPlayerProvider>
          <NotificationProvider>
            <AccentSync />
            <Router basename={import.meta.env.BASE_URL}>
              <NavigationTracker />
              <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/player-view/public" element={<PublicPlayerView />} />
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                <Route path="/Terms" element={<Terms />} />
                <Route path="/Help" element={<Help />} />
                <Route path="/admin" element={<AdminConsole />} />
                <Route path="/*" element={<AuthenticatedApp />} />
              </Routes>
              </Suspense>
            </Router>
            <Toaster />
          </NotificationProvider>
        </AudioPlayerProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App

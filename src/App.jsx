import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import LoginPage from '@/components/layout/LoginPage';
import PublicPlayerView from '@/pages/PublicPlayerView';
import ChangelogDialog from '@/components/layout/ChangelogDialog';
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
    return <LoginPage />;
  }

  return (
    <>
    <BootSequence />
    <ChangelogDialog />
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
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AudioPlayerProvider>
          <NotificationProvider>
            <Router basename={import.meta.env.BASE_URL}>
              <NavigationTracker />
              <Routes>
                <Route path="/player-view/public" element={<PublicPlayerView />} />
                <Route path="/*" element={<AuthenticatedApp />} />
              </Routes>
            </Router>
            <Toaster />
          </NotificationProvider>
        </AudioPlayerProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App

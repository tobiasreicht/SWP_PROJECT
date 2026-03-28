import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { Home } from './pages/Home';
import { useAuthStore, useSettingsStore } from './store';

// Lazy-load all non-home pages — reduces initial bundle size significantly
const Explore = lazy(() => import('./pages/Explore').then(m => ({ default: m.Explore })));
const Watchlist = lazy(() => import('./pages/Watchlist').then(m => ({ default: m.Watchlist })));
const Social = lazy(() => import('./pages/Social').then(m => ({ default: m.Social })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const ActorProfile = lazy(() => import('./pages/ActorProfile').then(m => ({ default: m.ActorProfile })));

const PageFallback = () => (
  <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

export default function App() {
  const { initializeAuth } = useAuthStore();
  const { theme } = useSettingsStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') {
      html.classList.add('light-mode');
      html.classList.remove('dark-mode');
    } else {
      html.classList.remove('light-mode');
      html.classList.add('dark-mode');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/social" element={<Social />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/actors/:actorId" element={<ActorProfile />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

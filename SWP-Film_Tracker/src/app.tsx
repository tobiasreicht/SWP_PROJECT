import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Explore } from './pages/Explore';
import { Watchlist } from './pages/Watchlist';
import { Social } from './pages/Social';
import { Profile } from './pages/Profile';
import { Auth } from './pages/Auth';
import { useAuthStore, useSettingsStore } from './store';

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/social" element={<Social />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

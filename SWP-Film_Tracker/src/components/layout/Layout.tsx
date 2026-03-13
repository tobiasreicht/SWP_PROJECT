import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ChatWindowModal } from '../chat';
import { useSettingsStore } from '../../store';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  const { theme } = useSettingsStore();
  const bgClass =
    theme === 'light'
      ? 'bg-gradient-to-b from-slate-200 via-slate-100 to-slate-50'
      : 'bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950';
  return (
    <div className={`min-h-screen ${bgClass} flex flex-col`}>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      <ChatWindowModal />
    </div>
  );
};

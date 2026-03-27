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
  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-slate-100' : 'bg-[#08080e]'}`}>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      <ChatWindowModal />
    </div>
  );
};

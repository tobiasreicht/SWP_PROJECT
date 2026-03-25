import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, LogOut } from 'lucide-react';
import { Input, Button } from '../ui';
import { useAuthStore, useMessengerStore } from '../../store';
import { messagesAPI } from '../../services/api';
import { SocialMessage } from '../../types';

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [inbox, setInbox] = useState<SocialMessage[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { openMessenger } = useMessengerStore();

  const unreadCount = useMemo(
    () => inbox.filter((message) => !message.readAt).length,
    [inbox]
  );

  const loadInbox = async () => {
    if (!user) {
      setInbox([]);
      return;
    }

    try {
      const response = await messagesAPI.getInbox();
      setInbox((response.data || []) as SocialMessage[]);
    } catch {
      setInbox([]);
    }
  };

  useEffect(() => {
    loadInbox();
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadInbox();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user]);

  const handleOpenInboxItem = async (message: SocialMessage) => {
    try {
      await messagesAPI.markInboxRead({ senderId: message.senderId });
      await loadInbox();
    } catch {
    }

    setShowInbox(false);
    openMessenger({ friendId: message.senderId });
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/explore', label: 'Explore' },
    { path: '/watchlist', label: 'Watchlist' },
    { path: '/social', label: 'Social' },
    { path: '/dashboard', label: 'Dashboard' },
  ];

  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.displayName || user?.email || 'User'
  )}&background=1f2937&color=ffffff`;

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-neutral-900 via-neutral-900/80 to-transparent backdrop-blur-md border-b border-white/10">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-3xl font-bold text-red-600">
              Watch
            </span>
             <span className="text-2xl font-bold text-gray-600">
              Together
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-red-600 bg-red-600/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              {showSearch ? (
                <Input
                  type="text"
                  placeholder="Search movies, series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48"
                  autoFocus
                  onBlur={() => setShowSearch(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSearch(true)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Search size={20} />
                </button>
              )}
            </form>

            {/* Notifications */}
            <div className="relative">
              <button
                className="p-2 text-gray-400 hover:text-white transition-colors relative"
                onClick={() => setShowInbox((previous) => !previous)}
                type="button"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-600 rounded-full text-[10px] text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showInbox && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl z-50">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">Inbox</p>
                  </div>

                  <div className="p-2 space-y-1">
                    {inbox.length === 0 ? (
                      <p className="text-xs text-gray-400 p-2">No messages</p>
                    ) : (
                      inbox.map((message) => (
                        <button
                          key={message.id}
                          type="button"
                          onClick={() => handleOpenInboxItem(message)}
                          className={`w-full text-left rounded-lg p-2 transition-colors ${
                            message.readAt ? 'bg-white/5 hover:bg-white/10' : 'bg-red-600/10 border border-red-500/30 hover:bg-red-600/20'
                          }`}
                        >
                          <p className="text-xs text-gray-300 mb-1">{message.sender.name}</p>
                          {message.movieTitle && <p className="text-xs text-red-300 mb-1">🎬 {message.movieTitle}</p>}
                          {message.text && <p className="text-sm text-white line-clamp-2">{message.text}</p>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="rounded-full ring-1 ring-white/10 hover:ring-red-500/60 transition-all"
                  aria-label="Open profile"
                >
                  <img
                    src={user.avatar || avatarFallback}
                    alt={user.displayName || 'Profile'}
                    className="w-9 h-9 rounded-full object-cover bg-white/10"
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

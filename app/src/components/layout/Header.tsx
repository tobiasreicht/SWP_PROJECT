import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Bookmark, Users, BarChart2, Bell, Search, LogOut, X } from 'lucide-react';
import { useAuthStore, useMessengerStore } from '../../store';
import { messagesAPI } from '../../services/api';
import { SocialMessage } from '../../types';

const NAV_ITEMS = [
  { path: '/',          label: 'Home',      icon: Home },
  { path: '/explore',   label: 'Explore',   icon: Compass },
  { path: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { path: '/social',    label: 'Social',    icon: Users },
  { path: '/dashboard', label: 'Stats',     icon: BarChart2 },
];

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [inbox, setInbox] = useState<SocialMessage[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { openMessenger } = useMessengerStore();

  const unreadCount = useMemo(() => inbox.filter(m => !m.readAt).length, [inbox]);

  const loadInbox = async () => {
    if (!user) { setInbox([]); return; }
    try {
      const res = await messagesAPI.getInbox();
      setInbox((res.data || []) as SocialMessage[]);
    } catch { setInbox([]); }
  };

  useEffect(() => { loadInbox(); }, [user, location.pathname]);
  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(loadInbox, 30000);
    return () => window.clearInterval(id);
  }, [user]);

  const handleOpenInboxItem = async (msg: SocialMessage) => {
    try { await messagesAPI.markInboxRead({ senderId: msg.senderId }); await loadInbox(); } catch {}
    setShowInbox(false);
    openMessenger({ friendId: msg.senderId });
  };

  const handleLogout = () => { logout(); navigate('/auth'); };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=1f2937&color=ffffff`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08080e]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-14 gap-4">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 group">
            <span className="h-10 w-16 rounded-xl grid place-items-center overflow-hidden px-1">
              <img
                src="/watch-togther-logo.png"
                alt="Watch Together"
                className="h-9 w-14 object-contain"
              />
            </span>
            <span className="text-sm md:text-base font-semibold tracking-wide text-white/80 group-hover:text-white transition-colors">
              Watch Together
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'text-white bg-white/[0.08]'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-red-500' : ''} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1">

            {/* Search */}
            {showSearch ? (
              <form onSubmit={handleSearch} className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search movies or actors…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                  className="w-44 px-3 py-1.5 rounded-lg bg-white/[0.08] border border-white/[0.1] text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500/50"
                />
                <button type="button" onClick={() => setShowSearch(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06]">
                  <X size={16} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <Search size={18} />
              </button>
            )}

            {/* Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowInbox(v => !v)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showInbox && (
                <div className="absolute right-0 mt-2 w-76 max-h-80 overflow-y-auto rounded-2xl border border-white/[0.09] bg-[#111118]/95 backdrop-blur-xl shadow-2xl z-50">
                  <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Inbox</p>
                    {unreadCount > 0 && (
                      <span className="text-xs text-red-400 font-medium">{unreadCount} unread</span>
                    )}
                  </div>
                  <div className="p-2 space-y-1">
                    {inbox.length === 0 ? (
                      <p className="text-sm text-gray-500 p-3 text-center">No messages yet</p>
                    ) : inbox.map(msg => (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => handleOpenInboxItem(msg)}
                        className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                          msg.readAt ? 'hover:bg-white/[0.05]' : 'bg-red-600/[0.12] border border-red-500/20 hover:bg-red-600/[0.18]'
                        }`}
                      >
                        <p className="text-xs font-semibold text-white mb-0.5">{msg.sender.name}</p>
                        {msg.movieTitle && <p className="text-xs text-red-400 mb-0.5">🎬 {msg.movieTitle}</p>}
                        {msg.text && <p className="text-xs text-gray-400 line-clamp-2">{msg.text}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            {user ? (
              <div className="flex items-center gap-1 ml-1">
                <Link to="/profile" className="rounded-full ring-1 ring-white/[0.1] hover:ring-red-500/50 transition-all">
                  <img
                    src={user.avatar || avatarFallback}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="ml-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden items-center justify-around border-t border-white/[0.06] px-2 py-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                active ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
};

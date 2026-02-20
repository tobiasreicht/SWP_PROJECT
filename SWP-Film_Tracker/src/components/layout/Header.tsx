import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, Bell, LogOut } from 'lucide-react';
import { Input, Button } from '../ui';
import { useAuthStore } from '../../store';

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

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

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-neutral-900 via-neutral-900/80 to-transparent backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-3xl font-bold text-red-600">
              🎬 FilmTracker
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
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
            </button>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="p-2 text-gray-400 hover:text-white transition-colors">
                  <User size={20} />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
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

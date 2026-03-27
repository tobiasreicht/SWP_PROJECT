import React, { useEffect, useRef, useState } from 'react';
import {
  Settings, LogOut, Edit2, Save, Moon, Sun, Bell, Shield,
  Sliders, User, Trash2, Download, Key, Check, AlertTriangle,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../components/ui';
import { useAuthStore, useSettingsStore } from '../store';
import { usersAPI, authAPI, ratingsAPI, watchlistAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const settings = useSettingsStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    bio: '',
    favoriteGenres: [] as string[],
    avatar: '',
  });
  const [stats, setStats] = useState([
    { label: 'Movies Watched', value: 0 },
    { label: 'Average Rating', value: '0.0/10' },
    { label: 'Series Started', value: 0 },
    { label: 'Friends', value: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Settings state
  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'privacy' | 'content' | 'account' | 'danger'>('appearance');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const [profileResponse, statsResponse] = await Promise.all([
          usersAPI.getProfile(user.id),
          usersAPI.getStatistics(user.id),
        ]);

        const profileData = profileResponse.data;
        const statsData = statsResponse.data;

        setProfile((previous) => ({
          ...previous,
          displayName: profileData.displayName || user.displayName,
          email: profileData.email || user.email,
          bio: profileData.bio || '',
          avatar: profileData.avatar || '',
          favoriteGenres: statsData.favoriteGenres || previous.favoriteGenres,
        }));

        setStats([
          { label: 'Movies Watched', value: statsData.totalMoviesWatched || 0 },
          { label: 'Average Rating', value: `${(statsData.averageRating || 0).toFixed(1)}/10` },
          { label: 'Series Started', value: statsData.totalSeriesWatched || 0 },
          { label: 'Friends', value: statsData.totalFriends || 0 },
        ]);
      } catch (error) {
        setProfile((previous) => ({
          ...previous,
          displayName: user.displayName,
          email: user.email,
        }));
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const resizeAvatar = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxSize = 512;
          const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
          const targetWidth = Math.round(image.width * scale);
          const targetHeight = Math.round(image.height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Could not process image'));
            return;
          }

          context.drawImage(image, 0, 0, targetWidth, targetHeight);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        };

        image.onerror = () => reject(new Error('Invalid image file'));
        image.src = String(reader.result);
      };

      reader.onerror = () => reject(new Error('Could not read image file'));
      reader.readAsDataURL(file);
    });

  const handleAvatarSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setIsProcessingAvatar(true);
      const optimizedAvatar = await resizeAvatar(file);
      setProfile((previous) => ({
        ...previous,
        avatar: optimizedAvatar,
      }));
    } catch {
      alert('Could not process selected image');
    } finally {
      setIsProcessingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    try {
      const response = await usersAPI.updateProfile(user.id, {
        displayName: profile.displayName,
        bio: profile.bio,
        avatar: profile.avatar,
      });

      setUser({
        ...user,
        displayName: response.data.displayName || profile.displayName,
        avatar: response.data.avatar || profile.avatar,
        bio: response.data.bio || profile.bio,
      });
      setIsEditing(false);
    } catch (error) {
      alert('Could not save profile changes');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const showSavedFeedback = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    try {
      setIsChangingPassword(true);
      await authAPI.changePassword({ currentPassword: passwordForm.current, newPassword: passwordForm.next });
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    try {
      setIsExportingData(true);
      const [ratingsRes, watchlistRes, profileRes, statsRes] = await Promise.all([
        ratingsAPI.getUserRatings(),
        watchlistAPI.getAll(),
        usersAPI.getProfile(user.id),
        usersAPI.getStatistics(user.id),
      ]);
      const data = {
        exportedAt: new Date().toISOString(),
        profile: profileRes.data,
        statistics: statsRes.data,
        ratings: ratingsRes.data,
        watchlist: watchlistRes.data,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `film-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not export data. Please try again.');
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== user.username) return;
    try {
      setIsDeletingAccount(true);
      await usersAPI.deleteAccount(user.id);
      logout();
      navigate('/auth');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete account. Please try again.');
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-inner max-w-4xl">
          <div className="h-8 w-32 rounded-xl bg-white/[0.05] animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-inner max-w-4xl">
        {/* Profile Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-6">Profile</h1>
          <div className="flex items-start justify-between">
            <div className="flex gap-5">
              <div className="flex flex-col items-center gap-2">
                <img
                  src={profile.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.displayName || profile.email || 'User') + '&background=dc2626&color=ffffff'}
                  alt={profile.displayName}
                  className="w-20 h-20 rounded-2xl object-cover ring-1 ring-white/[0.1]"
                />
                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelection}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingAvatar}
                    >
                      {isProcessingAvatar ? 'Processing…' : 'Change Photo'}
                    </Button>
                  </>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{profile.displayName}</h1>
                <p className="text-gray-400 mb-3">{profile.email}</p>
                <div className="flex gap-2 flex-wrap">
                  {profile.favoriteGenres.map((genre) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setIsEditing(true);
                }
              }}
              className="flex items-center gap-2"
            >
              {isEditing ? (
                <>
                  <Save size={18} />
                  Save
                </>
              ) : (
                <>
                  <Edit2 size={18} />
                  Edit
                </>
              )}
            </Button>
          </div>

          {/* Bio */}
          {isEditing ? (
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
              rows={3}
            />
          ) : (
            <p className="text-gray-300 text-lg">{profile.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Settings size={17} className="text-gray-400" />
            Settings
          </h2>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 border border-white/[0.05]">
            {(
              [
                { id: 'appearance', label: 'Appearance', icon: Sun },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'privacy', label: 'Privacy', icon: Shield },
                { id: 'content', label: 'Content', icon: Sliders },
                { id: 'account', label: 'Account', icon: User },
                { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
              ] as { id: typeof activeTab; label: string; icon: React.ElementType }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === id
                    ? id === 'danger'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Appearance ─────────────────────────────────────────────── */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme */}
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-white font-semibold mb-1">Theme</h3>
                <p className="text-gray-400 text-sm mb-4">Choose how the app looks on your device.</p>
                <div className="flex gap-3">
                  {(['dark', 'light'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { settings.setTheme(t); showSavedFeedback(); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        settings.theme === t
                          ? 'border-red-500 bg-red-600/20 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {t === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                      {t === 'dark' ? 'Dark' : 'Light'}
                      {settings.theme === t && <Check size={14} className="ml-1 text-red-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name while in settings */}
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-white font-semibold mb-1">Display Name</h3>
                <p className="text-gray-400 text-sm mb-3">Update how your name appears across the app.</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 text-sm"
                    placeholder="Display name"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveProfile}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-white font-semibold mb-1">Bio</h3>
                <p className="text-gray-400 text-sm mb-3">Tell others a little about yourself.</p>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 text-sm resize-none"
                  placeholder="Write something about yourself..."
                />
                <Button variant="primary" size="sm" className="mt-2" onClick={handleSaveProfile}>
                  Save Bio
                </Button>
              </div>
            </div>
          )}

          {/* ── Notifications ─────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="space-y-1">
              <p className="text-gray-400 text-sm mb-6">
                Control which notifications you receive. These preferences are saved locally.
              </p>
              {(
                [
                  { key: 'friendRequests', label: 'Friend Requests', desc: 'Notify when someone sends you a friend request' },
                  { key: 'newReleases', label: 'New Releases', desc: 'Get notified about new movies and series releases' },
                  { key: 'friendActivity', label: 'Friend Activity', desc: 'See when friends watch or rate movies' },
                  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary of your activity and recommendations' },
                ] as { key: keyof typeof settings.notifications; label: string; desc: string }[]
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={settings.notifications[key]}
                    onClick={() => { settings.setNotification(key, !settings.notifications[key]); showSavedFeedback(); }}
                    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                      settings.notifications[key] ? 'bg-red-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.notifications[key] ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Privacy ───────────────────────────────────────────────── */}
          {activeTab === 'privacy' && (
            <div className="space-y-1">
              <p className="text-gray-400 text-sm mb-4">
                Manage who can see your activity and profile information.
              </p>

              {/* Profile Visibility */}
              <div className="border-b border-white/10 pb-6 mb-6">
                <h3 className="text-white font-semibold mb-1 text-sm">Profile Visibility</h3>
                <p className="text-gray-400 text-xs mb-3">Who can view your full profile.</p>
                <div className="flex gap-2">
                  {([
                    { v: 'public', label: 'Public' },
                    { v: 'friends', label: 'Friends Only' },
                    { v: 'private', label: 'Private' },
                  ] as { v: typeof settings.privacy.profileVisibility; label: string }[]).map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => { settings.setPrivacy('profileVisibility', v); showSavedFeedback(); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        settings.privacy.profileVisibility === v
                          ? 'bg-red-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Toggles */}
              {(
                [
                  { key: 'showWatchlist', label: 'Show Watchlist', desc: 'Let friends see what you plan to watch' },
                  { key: 'showRatings', label: 'Show Ratings & Reviews', desc: 'Let others see your movie ratings' },
                  { key: 'showActivity', label: 'Show Activity Feed', desc: 'Show your watch history in the social feed' },
                  { key: 'allowFriendRequests', label: 'Allow Friend Requests', desc: 'Let other users send you friend requests' },
                ] as { key: keyof typeof settings.privacy; label: string; desc: string }[]
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={settings.privacy[key] as boolean}
                    onClick={() => { settings.setPrivacy(key, !settings.privacy[key]); showSavedFeedback(); }}
                    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                      settings.privacy[key] ? 'bg-red-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.privacy[key] ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Content Preferences ──────────────────────────────────── */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <p className="text-gray-400 text-sm">
                Set your default browsing preferences for the Explore and Watchlist pages.
              </p>

              {/* Default Content Type */}
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-white font-semibold text-sm mb-1">Default Content Type</h3>
                <p className="text-gray-400 text-xs mb-3">What to show first when browsing.</p>
                <div className="flex gap-2">
                  {([
                    { v: 'all', label: 'All' },
                    { v: 'movies', label: 'Movies' },
                    { v: 'series', label: 'Series' },
                  ] as { v: typeof settings.content.defaultType; label: string }[]).map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => { settings.setContent('defaultType', v); showSavedFeedback(); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        settings.content.defaultType === v
                          ? 'bg-red-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Sort */}
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-white font-semibold text-sm mb-1">Default Sort Order</h3>
                <p className="text-gray-400 text-xs mb-3">How items are sorted by default in your watchlist.</p>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { v: 'addedAt', label: 'Date Added' },
                    { v: 'rating', label: 'Rating' },
                    { v: 'title', label: 'Title A–Z' },
                  ] as { v: typeof settings.content.defaultSort; label: string }[]).map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => { settings.setContent('defaultSort', v); showSavedFeedback(); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        settings.content.defaultSort === v
                          ? 'bg-red-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items per page */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Items Per Page</h3>
                <p className="text-gray-400 text-xs mb-3">How many items to display per page.</p>
                <div className="flex gap-2">
                  {([10, 20, 50] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => { settings.setContent('itemsPerPage', n); showSavedFeedback(); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        settings.content.itemsPerPage === n
                          ? 'bg-red-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Account ──────────────────────────────────────────────── */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              {/* Change Password */}
              <div className="border-b border-white/10 pb-8">
                <div className="flex items-center gap-2 mb-1">
                  <Key size={16} className="text-red-400" />
                  <h3 className="text-white font-semibold">Change Password</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">Use a strong password of at least 8 characters.</p>

                {passwordSuccess && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm mb-4">
                    <Check size={16} />
                    Password changed successfully!
                  </div>
                )}

                {passwordError && (
                  <div className="px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm mb-4">
                    {passwordError}
                  </div>
                )}

                <div className="space-y-3 max-w-sm">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 text-sm"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={passwordForm.next}
                    onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 text-sm"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 text-sm"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleChangePassword}
                    isLoading={isChangingPassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? 'Updating…' : 'Update Password'}
                  </Button>
                </div>
              </div>

              {/* Export Data */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Download size={16} className="text-blue-400" />
                  <h3 className="text-white font-semibold">Export My Data</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Download a JSON file containing your profile, ratings, watchlist, and statistics.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportData}
                  disabled={isExportingData}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  {isExportingData ? 'Preparing export…' : 'Download My Data'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Danger Zone ───────────────────────────────────────────── */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              {/* Log Out */}
              <div className="flex items-start justify-between py-4 border-b border-white/10">
                <div>
                  <p className="text-white font-medium">Log Out</p>
                  <p className="text-gray-400 text-sm mt-0.5">Sign out of your account on this device.</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <LogOut size={16} />
                  Log Out
                </Button>
              </div>

              {/* Delete Account */}
              <div className="flex items-start justify-between py-4">
                <div>
                  <p className="text-red-400 font-medium">Delete Account</p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    Permanently delete your account and all data. This cannot be undone.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 flex-shrink-0"
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Saved feedback toast */}
          {savedFeedback && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/90 text-white text-sm font-medium shadow-2xl">
              <Check size={16} />
              Saved
            </div>
          )}
        </div>

        {/* Delete Account Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => !isDeletingAccount && setShowDeleteModal(false)}
          title="Delete Account"
          size="sm"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
              <p className="text-gray-300 text-sm">
                This will permanently delete your account, ratings, watchlist, and all other data.
                <strong className="text-white"> This action cannot be undone.</strong>
              </p>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">
                Type your username <span className="text-white font-semibold">{user?.username}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={user?.username}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-red-400 border border-red-500/40 hover:bg-red-600/20 disabled:opacity-40"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== user?.username || isDeletingAccount}
              >
                {isDeletingAccount ? 'Deleting…' : 'Delete My Account'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

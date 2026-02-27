import React, { useEffect, useState } from 'react';
import { Settings, LogOut, Edit2, Save } from 'lucide-react';
import { Card, Button, Input, Badge } from '../components/ui';
import { useAuthStore } from '../store';
import { usersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex gap-6">
              <img
                src={profile.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.displayName || profile.email || 'User') + '&background=1f2937&color=ffffff'}
                alt={profile.displayName}
                className="w-24 h-24 rounded-lg object-cover"
              />
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 text-center">
              <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Settings size={24} />
            Settings
          </h2>

          <div className="space-y-6">
            {/* Theme */}
            <div className="border-b border-white/10 pb-6">
              <h3 className="font-semibold text-white mb-3">Theme</h3>
              <div className="flex gap-4">
                <Button
                  variant="primary"
                  size="sm"
                  className="opacity-100"
                >
                  Dark
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                >
                  Light
                </Button>
              </div>
            </div>

            {/* Notifications */}
            <div className="border-b border-white/10 pb-6">
              <h3 className="font-semibold text-white mb-3">Notifications</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-white">Email notifications</span>
              </label>
            </div>

            {/* Privacy */}
            <div className="border-b border-white/10 pb-6">
              <h3 className="font-semibold text-white mb-3">Privacy</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-white">Make profile public</span>
              </label>
            </div>

            {/* Danger Zone */}
            <div>
              <h3 className="font-semibold text-red-600 mb-3">Danger Zone</h3>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-red-400 hover:text-red-300"
                  onClick={handleLogout}
              >
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

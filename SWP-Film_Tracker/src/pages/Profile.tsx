import React, { useState } from 'react';
import { Settings, LogOut, Edit2, Save } from 'lucide-react';
import { Card, Button, Input, Badge } from '../components/ui';

export const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    displayName: 'John Doe',
    email: 'john@example.com',
    bio: 'Movie enthusiast and series binge-watcher',
    favoriteGenres: ['Sci-Fi', 'Thriller', 'Drama'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  });

  const stats = [
    { label: 'Movies Watched', value: 47 },
    { label: 'Average Rating', value: '7.8/10' },
    { label: 'Series Started', value: 12 },
    { label: 'Friends', value: 8 },
  ];

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex gap-6">
              <img
                src={profile.avatar}
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
              onClick={() => setIsEditing(!isEditing)}
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

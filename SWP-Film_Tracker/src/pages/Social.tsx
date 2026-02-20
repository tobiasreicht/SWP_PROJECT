import React, { useState } from 'react';
import { Users, ActivitySquare } from 'lucide-react';
import { FriendCard, ActivityFeedItem } from '../components/social';
import { Card, Button } from '../components/ui';

const mockFriends = [
  {
    id: '1',
    name: 'Alex Johnson',
    avatar: 'https://images.unsplash.com/photo-1535713566343-cde7cdc96c3d?w=100&h=100&fit=crop',
    tasteMatch: 87,
    commonMovies: 12,
    isAdded: true,
  },
  {
    id: '2',
    name: 'Sarah Williams',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    tasteMatch: 76,
    commonMovies: 8,
    isAdded: true,
  },
  {
    id: '3',
    name: 'Mike Chen',
    tasteMatch: 64,
    commonMovies: 5,
    isAdded: false,
  },
];

const mockActivityFeed = [
  {
    id: '1',
    username: 'Alex Johnson',
    action: 'rated' as const,
    movieTitle: 'Breaking Bad',
    moviePoster: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=100&h=150&fit=crop',
    rating: 9,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    username: 'Sarah Williams',
    action: 'watched' as const,
    movieTitle: 'Inception',
    moviePoster: 'https://images.unsplash.com/photo-1478720568477-152d9e3fb27f?w=100&h=150&fit=crop',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
];

export const Social: React.FC = () => {
  const [friends, setFriends] = useState(mockFriends);

  const handleAddFriend = (id: string) => {
    setFriends(friends.map((f) => (f.id === id ? { ...f, isAdded: true } : f)));
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Social</h1>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Friends Section - Left */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users size={24} />
                Friends
              </h2>
              <Button variant="primary" size="sm">
                Add Friend
              </Button>
            </div>

            <div className="space-y-4">
              {friends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  {...friend}
                  onAddFriend={() => handleAddFriend(friend.id)}
                />
              ))}
            </div>
          </div>

          {/* Activity & Recommendations - Right */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Tabs */}
              <div className="space-y-6">
                {/* Activity Feed */}
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                    <ActivitySquare size={24} />
                    Friend Activity
                  </h2>

                  <div className="divide-y divide-white/10">
                    {mockActivityFeed.map((item) => (
                      <ActivityFeedItem key={item.id} {...item} />
                    ))}
                  </div>
                </div>

                {/* Joint Recommendations */}
                <div className="border-t border-white/10 pt-6">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    What You Should Watch Together
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: 'Interstellar', compatibility: 92, mutualRaters: 3 },
                      { title: 'The Matrix', compatibility: 88, mutualRaters: 2 },
                    ].map((rec) => (
                      <Card
                        key={rec.title}
                        className="p-4 flex gap-4 items-start hover:border-red-500/50"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-white mb-2">{rec.title}</h3>
                          <p className="text-sm text-gray-400 mb-3">
                            {rec.mutualRaters} friends rate it highly
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Compatibility</span>
                            <span className="font-bold text-red-600">{rec.compatibility}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${rec.compatibility}%` }}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

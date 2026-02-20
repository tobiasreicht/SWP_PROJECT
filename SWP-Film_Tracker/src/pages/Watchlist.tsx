import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useWatchlistStore } from '../store';
import { WatchlistItem } from '../types';

export const Watchlist: React.FC = () => {
  const { items, isLoading, fetchWatchlist, removeFromWatchlist } = useWatchlistStore();
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const filteredItems = items.filter((item: WatchlistItem) =>
    filter === 'all' ? true : item.priority === filter
  );

  const priorityColors = {
    high: 'border-red-600/50 bg-red-600/10',
    medium: 'border-yellow-600/50 bg-yellow-600/10',
    low: 'border-blue-600/50 bg-blue-600/10',
  };

  const priorityBadgeColors = {
    high: 'bg-red-600 text-white',
    medium: 'bg-yellow-600 text-white',
    low: 'bg-blue-600 text-white',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <h1 className="text-4xl font-bold text-white mb-8">My Watchlist</h1>

        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => setFilter(priority)}
              className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                filter === priority
                  ? 'bg-red-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {priority === 'all' ? 'All Items' : `${priority} Priority`}
            </button>
          ))}
        </div>

        {/* Watchlist Items */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading watchlist...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item: WatchlistItem) => (
              <Card
                key={item.id}
                className={`p-4 flex gap-4 items-start transition-all hover:border-red-500/50 ${
                  priorityColors[item.priority as keyof typeof priorityColors]
                }`}
              >
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Movie #{item.movieId.slice(0,8)}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
                            priorityBadgeColors[item.priority as keyof typeof priorityBadgeColors]
                          }`}
                        >
                          {item.priority} Priority
                        </span>
                        <span className="text-sm text-gray-400">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-sm text-gray-300 mb-3">"{item.notes}"</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => removeFromWatchlist(item.movieId)}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-red-400 hover:text-red-300 bg-red-600/10 hover:bg-red-600/20 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {filter === 'all' ? 'Your watchlist is empty' : `No ${filter} priority items`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

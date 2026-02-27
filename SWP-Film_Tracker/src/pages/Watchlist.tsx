import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useRatingStore, useWatchlistStore } from '../store';
import { WatchlistItem } from '../types';

export const Watchlist: React.FC = () => {
  const {
    items,
    summary,
    isLoading,
    fetchWatchlist,
    fetchWatchlistCount,
    updateWatchlistItem,
    removeFromWatchlist,
  } = useWatchlistStore();
  const { ratings, fetchUserRatings, createRating } = useRatingStore();
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'watching' | 'watched'>('all');
  const [sortBy, setSortBy] = useState<'addedAt' | 'priority'>('addedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchWatchlist({ sortBy, sortOrder });
    fetchWatchlistCount();
    fetchUserRatings();
  }, [sortBy, sortOrder]);

  const ratingsByMovieId = ratings.reduce<Record<string, number>>((result, ratingItem) => {
    result[ratingItem.movieId] = ratingItem.rating;
    return result;
  }, {});

  const filteredItems = items.filter((item: WatchlistItem) => {
    const itemStatus = item.status || 'planned';
    const priorityMatch = filter === 'all' ? true : item.priority === filter;
    const statusMatch = statusFilter === 'all' ? true : itemStatus === statusFilter;
    return priorityMatch && statusMatch;
  });

  const getDaysOnList = (addedAt: Date | string) => {
    const added = new Date(addedAt);
    const now = new Date();
    const diff = Math.max(0, now.getTime() - added.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

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

  const handlePriorityChange = async (
    movieId: string,
    priority: 'high' | 'medium' | 'low'
  ) => {
    await updateWatchlistItem(movieId, { priority });
  };

  const handleStatusChange = async (
    movieId: string,
    status: 'planned' | 'watching' | 'watched'
  ) => {
    await updateWatchlistItem(movieId, { status });

    if (status === 'watched' && !ratingsByMovieId[movieId]) {
      setRatingDrafts((previous) => ({
        ...previous,
        [movieId]: previous[movieId] ?? 8,
      }));
    }
  };

  const handleSaveRating = async (item: WatchlistItem) => {
    const selectedRating = ratingDrafts[item.movieId] ?? ratingsByMovieId[item.movieId];

    if (!selectedRating || selectedRating < 1 || selectedRating > 10) {
      return;
    }

    await createRating(item.movieId, selectedRating);
    await fetchUserRatings();
  };

  const statusBadgeColors = {
    planned: 'bg-slate-600 text-white',
    watching: 'bg-indigo-600 text-white',
    watched: 'bg-emerald-600 text-white',
  };

  const handleSaveNotes = async (item: WatchlistItem) => {
    const nextNotes = noteDrafts[item.movieId] ?? item.notes ?? '';
    await updateWatchlistItem(item.movieId, { notes: nextNotes.trim() || '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <h1 className="text-4xl font-bold text-white mb-8">My Watchlist</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card className="p-4 text-center">
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{summary.total}</p>
          </Card>
          <Card className="p-4 text-center border-red-600/30">
            <p className="text-gray-400 text-sm">High</p>
            <p className="text-2xl font-bold text-red-500">{summary.high}</p>
          </Card>
          <Card className="p-4 text-center border-yellow-600/30">
            <p className="text-gray-400 text-sm">Medium</p>
            <p className="text-2xl font-bold text-yellow-500">{summary.medium}</p>
          </Card>
          <Card className="p-4 text-center border-blue-600/30">
            <p className="text-gray-400 text-sm">Low</p>
            <p className="text-2xl font-bold text-blue-500">{summary.low}</p>
          </Card>
        </div>

        {/* Filters + Sorting */}
        <div className="flex gap-2 mb-8 flex-wrap items-center">
          <div className="flex gap-2 flex-wrap">
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

          <div className="flex gap-2 flex-wrap">
            {(['all', 'planned', 'watching', 'watched'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {status === 'all' ? 'All Statuses' : status}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'addedAt' | 'priority')}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="addedAt" className="bg-neutral-900">Sort: Added Date</option>
              <option value="priority" className="bg-neutral-900">Sort: Priority</option>
            </select>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="desc" className="bg-neutral-900">Descending</option>
              <option value="asc" className="bg-neutral-900">Ascending</option>
            </select>
          </div>
        </div>

        {/* Watchlist Items */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading watchlist...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item: WatchlistItem) => (
              (() => {
                const waitingDays = getDaysOnList(item.addedAt);
                const currentRating = ratingsByMovieId[item.movieId];
                const itemStatus = item.status || 'planned';

                return (
              <Card
                key={item.id}
                className={`p-4 flex gap-4 items-start transition-all hover:border-red-500/50 ${
                  priorityColors[item.priority as keyof typeof priorityColors]
                }`}
              >
                {item.movie?.poster && (
                  <img
                    src={item.movie.poster}
                    alt={item.movie.title}
                    className="w-20 h-28 object-cover rounded-md flex-shrink-0"
                  />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{item.movie?.title || `Movie #${item.movieId.slice(0, 8)}`}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
                            priorityBadgeColors[item.priority as keyof typeof priorityBadgeColors]
                          }`}
                        >
                          {item.priority} Priority
                        </span>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
                            statusBadgeColors[itemStatus as keyof typeof statusBadgeColors]
                          }`}
                        >
                          {itemStatus}
                        </span>
                        <span className="text-sm text-gray-400">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-400">
                          Waiting {waitingDays} day{waitingDays === 1 ? '' : 's'}
                        </span>
                        {itemStatus === 'watched' && currentRating ? (
                          <span className="text-sm text-yellow-400 font-semibold">
                            Your Rating: {currentRating}/10
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-3 space-y-2">
                    <label className="text-xs text-gray-400">Notes</label>
                    <textarea
                      rows={2}
                      value={noteDrafts[item.movieId] ?? item.notes ?? ''}
                      onChange={(event) =>
                        setNoteDrafts((previous) => ({
                          ...previous,
                          [item.movieId]: event.target.value,
                        }))
                      }
                      placeholder="Add notes..."
                      className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white text-sm placeholder-gray-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={item.priority}
                      onChange={(event) =>
                        handlePriorityChange(item.movieId, event.target.value as 'high' | 'medium' | 'low')
                      }
                      className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white text-sm"
                    >
                      <option value="high" className="bg-neutral-900">High</option>
                      <option value="medium" className="bg-neutral-900">Medium</option>
                      <option value="low" className="bg-neutral-900">Low</option>
                    </select>
                    <select
                      value={itemStatus}
                      onChange={(event) =>
                        handleStatusChange(item.movieId, event.target.value as 'planned' | 'watching' | 'watched')
                      }
                      className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white text-sm"
                    >
                      <option value="planned" className="bg-neutral-900">Planned</option>
                      <option value="watching" className="bg-neutral-900">Watching</option>
                      <option value="watched" className="bg-neutral-900">Watched</option>
                    </select>

                    {itemStatus === 'watched' && (
                      <>
                        <select
                          value={String(ratingDrafts[item.movieId] ?? currentRating ?? 8)}
                          onChange={(event) =>
                            setRatingDrafts((previous) => ({
                              ...previous,
                              [item.movieId]: Number(event.target.value),
                            }))
                          }
                          className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white text-sm"
                        >
                          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                            <option key={value} value={value} className="bg-neutral-900">
                              Rating: {value}/10
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSaveRating(item)}
                        >
                          Save Rating
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSaveNotes(item)}
                    >
                      Save Notes
                    </Button>
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
                );
              })()
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

import React, { useEffect, useState } from 'react';
import { Activity, Eye, Star } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ActivityChart, GenreChart, RatingChart } from '../components/dashboard/Charts';
import { Card } from '../components/ui';
import { useAuthStore, useRatingStore } from '../store';
import { analyticsAPI } from '../services/api';

interface DashboardStats {
  totalMoviesWatched: number;
  averageRating: number;
  favoriteGenres: string[];
  genreDistribution: Record<string, number>;
  monthlyStats: { month: string; count: number; averageRating: number }[];
  streakDays: number;
  watchlistCount: number;
  friendsCount: number;
  achievements: string[];
}

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { ratings, fetchUserRatings } = useRatingStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        await fetchUserRatings();
        const response = await analyticsAPI.getDashboard();
        setStats(response.data);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <p className="text-gray-400">Loading your stats...</p>
      </div>
    );
  }

  const genreArray = Object.entries(stats.genreDistribution || {}).map(([name, count]) => ({
    name,
    value: count,
  }));

  const topRated = ratings
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 py-12">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Your Stats</h1>
        <p className="text-gray-400">Track your movie journey and discover insights about your viewing habits.</p>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard
          icon={Eye}
          label="Movies Watched"
          value={stats.totalMoviesWatched}
          color="red"
        />
        <StatsCard
          icon={Star}
          label="Average Rating"
          value={stats.averageRating.toFixed(1)}
          color="purple"
        />
        <StatsCard
          icon={Activity}
          label="Current Streak"
          value={`${stats.streakDays || 0} day${stats.streakDays === 1 ? '' : 's'}`}
          color="blue"
        />
        <StatsCard
          icon={Activity}
          label="Watchlist Items"
          value={stats.watchlistCount || 0}
          color="green"
        />
      </div>

      {/* Charts */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <RatingChart data={stats.monthlyStats || []} />
        <GenreChart data={genreArray} />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <ActivityChart
          data={(stats.monthlyStats || []).map((item) => ({
            month: item.month,
            count: item.count,
          }))}
        />

        {/* Top Rated Movies */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-6">Your Top Rated</h3>
          {topRated.length > 0 ? (
            <div className="space-y-4">
              {topRated.map((rating, index) => (
                <div key={rating.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-sm">
                      #{index + 1}
                    </div>
                    <span className="text-white font-medium truncate max-w-xs">
                      {rating.movieId || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">{rating.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No rated movies yet</p>
          )}
        </Card>
      </div>

      {/* Favorite Genres */}
      {stats.favoriteGenres && stats.favoriteGenres.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <h2 className="text-2xl font-bold text-white mb-6">Your Favorite Genres</h2>
          <div className="flex flex-wrap gap-3">
            {stats.favoriteGenres.map((genre) => (
              <div
                key={genre}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold"
              >
                {genre}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.achievements && stats.achievements.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-12 mt-10">
          <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>
          <div className="flex flex-wrap gap-3">
            {stats.achievements.map((achievement) => (
              <div
                key={achievement}
                className="px-4 py-2 rounded-full bg-white/10 text-white border border-white/10"
              >
                {achievement}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

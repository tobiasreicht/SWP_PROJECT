import React, { useEffect, useState } from 'react';
import { Eye, Star, Zap, Bookmark, TrendingUp, Award } from 'lucide-react';
import { ActivityChart, GenreChart, RatingChart } from '../components/dashboard/Charts';
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

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent?: string;
}> = ({ icon: Icon, label, value, accent = 'text-red-400' }) => (
  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 flex items-center gap-4">
    <div className={`w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-gray-400 text-xs mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { ratings, fetchUserRatings } = useRatingStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        await fetchUserRatings();
        const res = await analyticsAPI.getDashboard();
        setStats(res.data);
      } catch { /* silent */ } finally { setIsLoading(false); }
    };
    load();
  }, [user]);

  if (isLoading || !stats) {
    return (
      <div className="page-container">
        <div className="page-inner">
          <div className="mb-10">
            <div className="h-8 w-40 rounded-xl bg-white/[0.05] animate-pulse mb-2" />
            <div className="h-4 w-64 rounded-lg bg-white/[0.03] animate-pulse" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const genreArray = Object.entries(stats.genreDistribution || {}).map(([name, value]) => ({ name, value }));
  const topRated = [...ratings].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);

  return (
    <div className="page-container">
      <div className="page-inner">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Stats</h1>
          <p className="text-gray-400 mt-1 text-sm">Track your viewing habits and discover insights</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Eye} label="Movies Watched" value={stats.totalMoviesWatched} accent="text-red-400" />
          <StatCard icon={Star} label="Avg Rating" value={stats.averageRating.toFixed(1)} accent="text-yellow-400" />
          <StatCard icon={Zap} label="Streak" value={`${stats.streakDays || 0}d`} accent="text-orange-400" />
          <StatCard icon={Bookmark} label="Watchlist" value={stats.watchlistCount || 0} accent="text-blue-400" />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <RatingChart data={stats.monthlyStats || []} />
          <GenreChart data={genreArray} />
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <ActivityChart data={(stats.monthlyStats || []).map(m => ({ month: m.month, count: m.count }))} />

          {/* Top rated */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-yellow-400" />
              <h3 className="text-white font-semibold">Your Top Rated</h3>
            </div>
            {topRated.length > 0 ? (
              <div className="space-y-3">
                {topRated.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-white text-sm truncate">{r.movieId || 'Unknown'}</span>
                    </div>
                    <span className="flex items-center gap-1 text-yellow-400 text-sm font-semibold flex-shrink-0">
                      <Star size={12} className="fill-yellow-400" />
                      {r.rating}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Rate some movies to see them here</p>
            )}
          </div>
        </div>

        {/* Favorite genres */}
        {stats.favoriteGenres && stats.favoriteGenres.length > 0 && (
          <div className="mb-8">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Star size={15} className="text-yellow-400" /> Favorite Genres
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.favoriteGenres.map(g => (
                <span key={g} className="px-4 py-1.5 rounded-full bg-red-600/15 border border-red-500/25 text-red-300 text-sm font-medium">
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {stats.achievements && stats.achievements.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Award size={15} className="text-yellow-400" /> Achievements
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.map(a => (
                <span key={a} className="px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-300 text-sm">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

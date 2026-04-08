import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Bookmark, Search, Star, CheckCircle2, Clock3, Film } from 'lucide-react';
import { useRatingStore, useWatchlistStore } from '../store';
import { WatchlistItem } from '../types';
import { getPosterFallbackUrl, resolvePosterUrl } from '../utils/media';

const PRIORITY_COLORS = {
  high:   'border-red-500/30 bg-red-500/[0.06]',
  medium: 'border-yellow-500/30 bg-yellow-500/[0.04]',
  low:    'border-blue-500/30 bg-blue-500/[0.04]',
} as const;

const PRIORITY_BADGE = {
  high:   'bg-red-500/20 text-red-300 border border-red-500/25',
  medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/25',
  low:    'bg-blue-500/20 text-blue-300 border border-blue-500/25',
} as const;

const STATUS_BADGE = {
  planned:  'bg-slate-500/20 text-slate-300 border border-slate-500/25',
  watching: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/25',
  watched:  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/25',
} as const;

const SummaryCard: React.FC<{
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string;
  hint?: string;
}> = ({ label, value, icon: Icon, accent = 'text-white', hint }) => (
  <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-gray-400 text-xs tracking-wide uppercase">{label}</p>
      <Icon size={15} className="text-white/60" />
    </div>
    <p className={`text-2xl font-extrabold ${accent}`}>{value}</p>
    {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
  </div>
);

export const Watchlist: React.FC = () => {
  const { items, summary, isLoading, fetchWatchlist, fetchWatchlistCount, updateWatchlistItem, removeFromWatchlist } = useWatchlistStore();
  const { ratings, fetchUserRatings, createRating } = useRatingStore();
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'watching' | 'watched'>('all');
  const [sortBy, setSortBy] = useState<'addedAt' | 'priority'>('addedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnratedOnly, setShowUnratedOnly] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, number>>({});
  const posterFallback = getPosterFallbackUrl();

  useEffect(() => {
    fetchWatchlist({ sortBy, sortOrder });
    fetchWatchlistCount();
    fetchUserRatings();
  }, [sortBy, sortOrder]);

  const ratingsByMovieId = useMemo(() => ratings.reduce<Record<string, number>>((acc, r) => {
    acc[r.movieId] = r.rating; return acc;
  }, {}), [ratings]);

  const statusCounts = useMemo(() => items.reduce(
    (acc, item) => {
      const s = item.status || 'planned';
      acc[s] += 1;
      return acc;
    },
    { planned: 0, watching: 0, watched: 0 } as Record<'planned' | 'watching' | 'watched', number>,
  ), [items]);

  const completionPct = summary.total > 0
    ? Math.round((statusCounts.watched / summary.total) * 100)
    : 0;

  const filteredItems = items.filter((item: WatchlistItem) => {
    const status = item.status || 'planned';
    const title = item.movie?.title || '';
    const titleMatch = !searchQuery.trim() || title.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const unratedMatch = !showUnratedOnly || !ratingsByMovieId[item.movieId];
    return (priorityFilter === 'all' || item.priority === priorityFilter) &&
           (statusFilter === 'all' || status === statusFilter) &&
           titleMatch &&
           unratedMatch;
  });

  const getDaysOnList = (addedAt: Date | string) =>
    Math.max(0, Math.floor((Date.now() - new Date(addedAt).getTime()) / 86400000));

  const handleSaveRating = async (item: WatchlistItem) => {
    const r = ratingDrafts[item.movieId] ?? ratingsByMovieId[item.movieId];
    if (!r || r < 1 || r > 10) return;
    await createRating(item.movieId, r);
    await fetchUserRatings();
  };

  return (
    <div className="page-container">
      <div className="page-inner">

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#1a1020] via-[#141421] to-[#101722] p-5 md:p-6 mb-8">
          <div className="absolute -top-20 -right-16 w-56 h-56 bg-red-500/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-8 w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-red-300 text-xs font-semibold tracking-[0.16em] uppercase mb-2">Collection Hub</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">My Watchlist</h1>
                <p className="text-gray-300 mt-2 text-sm">Track progress, organize priorities, and rate only when you have watched.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.1] bg-black/20 px-4 py-3 min-w-[220px]">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Completion</p>
                <p className="text-2xl font-extrabold text-white">{completionPct}%</p>
                <div className="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <SummaryCard label="Total" value={summary.total} icon={Film} hint="All saved titles" />
          <SummaryCard label="Watched" value={statusCounts.watched} icon={CheckCircle2} accent="text-emerald-300" hint="Completed" />
          <SummaryCard label="Watching" value={statusCounts.watching} icon={Clock3} accent="text-indigo-300" hint="In progress" />
          <SummaryCard label="High Priority" value={summary.high} icon={Star} accent="text-red-300" hint="Watch soon" />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 md:p-4 mb-6">
          <div className="flex gap-2 items-center mb-3">
            <div className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-black/25 px-3 py-1.5 w-full sm:w-[320px]">
              <Search size={13} className="text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search title"
                className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
              />
            </div>
            <button
              onClick={() => setShowUnratedOnly(v => !v)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                showUnratedOnly
                  ? 'bg-yellow-500/20 border-yellow-500/35 text-yellow-300'
                  : 'bg-white/[0.04] border-white/[0.1] text-gray-300 hover:bg-white/[0.08]'
              }`}
            >
              Unrated only
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'high', 'medium', 'low'] as const).map(p => (
                <button key={p} onClick={() => setPriorityFilter(p)} className={`pill text-xs ${priorityFilter === p ? 'pill-active' : 'pill-inactive'}`}>
                  {p === 'all' ? 'All priorities' : p}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-white/[0.08] mx-1 hidden sm:block" />
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'planned', 'watching', 'watched'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`pill text-xs ${statusFilter === s ? 'bg-indigo-600 text-white' : 'pill-inactive'}`}>
                  {s === 'all' ? 'All statuses' : s}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'addedAt' | 'priority')}
                className="field py-1.5 text-xs"
              >
                <option value="addedAt" className="bg-[#111118]">Date Added</option>
                <option value="priority" className="bg-[#111118]">Priority</option>
              </select>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="field py-1.5 text-xs"
              >
                <option value="desc" className="bg-[#111118]">Newest first</option>
                <option value="asc" className="bg-[#111118]">Oldest first</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item: WatchlistItem) => {
              const status = item.status || 'planned';
              const days = getDaysOnList(item.addedAt);
              const currentRating = ratingsByMovieId[item.movieId];
              return (
                <article
                  key={item.id}
                  className={`rounded-3xl border p-3.5 md:p-4 flex gap-3 md:gap-4 items-start transition-all hover:-translate-y-[2px] hover:border-white/25 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.9)] ${PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || 'border-white/[0.07] bg-white/[0.04]'}`}
                >
                  {/* Poster */}
                  {item.movie && (
                    <img
                      src={resolvePosterUrl(item.movie.poster)}
                      alt={item.movie.title}
                      loading="lazy"
                      className="w-[68px] h-[102px] md:w-[78px] md:h-[116px] object-cover rounded-2xl flex-shrink-0 border border-white/[0.08]"
                      onError={e => { e.currentTarget.src = posterFallback; }}
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-[15px] md:text-base truncate">
                          {item.movie?.title || `Movie #${item.movieId.slice(0, 6)}`}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {item.movie?.type === 'series' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border border-indigo-500/30 bg-indigo-500/12 text-indigo-200">
                              {item.movie.seasonCount ? `${item.movie.seasonCount} Season${item.movie.seasonCount > 1 ? 's' : ''}` : 'Series'}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${PRIORITY_BADGE[item.priority as keyof typeof PRIORITY_BADGE]}`}>
                            {item.priority}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_BADGE[status as keyof typeof STATUS_BADGE]}`}>
                            {status}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {days === 0 ? 'Today' : `${days}d ago`}
                          </span>
                          {status === 'watched' && currentRating && (
                            <span className="text-[10px] text-yellow-400 font-semibold">★ {currentRating}/10</span>
                          )}
                          {item.movie?.rating ? (
                            <span className="text-[10px] text-gray-400">TMDB {item.movie.rating.toFixed(1)}</span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromWatchlist(item.movieId)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex-shrink-0"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-2.5 md:p-3">
                      {/* Notes */}
                      <textarea
                        rows={1}
                        value={noteDrafts[item.movieId] ?? item.notes ?? ''}
                        onChange={e => setNoteDrafts(p => ({ ...p, [item.movieId]: e.target.value }))}
                        placeholder="Add a note..."
                        className="field text-xs resize-none mb-2 py-1.5"
                      />

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap items-center">
                      <select
                        value={item.priority}
                        onChange={e => updateWatchlistItem(item.movieId, { priority: e.target.value as 'high' | 'medium' | 'low' })}
                        className="field py-1 text-xs w-auto"
                      >
                        <option value="high" className="bg-[#111118]">High</option>
                        <option value="medium" className="bg-[#111118]">Medium</option>
                        <option value="low" className="bg-[#111118]">Low</option>
                      </select>
                      <select
                        value={status}
                        onChange={e => {
                          const s = e.target.value as 'planned' | 'watching' | 'watched';
                          updateWatchlistItem(item.movieId, { status: s });
                          if (s === 'watched' && !ratingsByMovieId[item.movieId]) {
                            setRatingDrafts(p => ({ ...p, [item.movieId]: p[item.movieId] ?? 8 }));
                          }
                        }}
                        className="field py-1 text-xs w-auto"
                      >
                        <option value="planned" className="bg-[#111118]">Planned</option>
                        <option value="watching" className="bg-[#111118]">Watching</option>
                        <option value="watched" className="bg-[#111118]">Watched</option>
                      </select>

                      {status === 'watched' && (
                        <>
                          <select
                            value={String(ratingDrafts[item.movieId] ?? currentRating ?? 8)}
                            onChange={e => setRatingDrafts(p => ({ ...p, [item.movieId]: Number(e.target.value) }))}
                            className="field py-1 text-xs w-auto"
                          >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                              <option key={n} value={n} className="bg-[#111118]">{n}/10</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSaveRating(item)}
                            className="px-3 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/25 text-yellow-300 text-xs font-medium hover:bg-yellow-500/25 transition-colors"
                          >
                            Save rating
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => updateWatchlistItem(item.movieId, { notes: (noteDrafts[item.movieId] ?? item.notes ?? '').trim() })}
                        className="px-3 py-1 rounded-lg bg-white/[0.06] border border-white/[0.09] text-gray-300 text-xs font-medium hover:bg-white/[0.1] transition-colors"
                      >
                        Save note
                      </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
              <Bookmark size={22} className="text-gray-500" />
            </div>
            <p className="text-white font-medium">
              {priorityFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim() || showUnratedOnly
                ? 'No items match your filters'
                : 'Your watchlist is empty'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery.trim() || showUnratedOnly
                ? 'Try removing some filters or searching a different title.'
                : 'Browse Explore and add movies to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

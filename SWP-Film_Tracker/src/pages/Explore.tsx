import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { MovieCard, MovieModal } from '../components/movie';
import { Movie } from '../types';
import { moviesAPI } from '../services/tmdb';
import { useWatchlistStore } from '../store';

const INITIAL_VISIBLE_MOVIES = 20;
const LOAD_MORE_STEP = 20;

const GENRES = [
  'Action', 'Comedy', 'Crime', 'Drama', 'Fantasy',
  'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'History',
  'Animation', 'Documentary',
];

export const Explore: React.FC = () => {
  const { fetchWatchlist, fetchWatchlistCount } = useWatchlistStore();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_MOVIES);

  useEffect(() => { fetchWatchlist(); fetchWatchlistCount(); }, []);

  const visibleMovies = useMemo(() => movies.slice(0, visibleCount), [movies, visibleCount]);
  const hasMore = movies.length > visibleCount;

  useEffect(() => { setVisibleCount(INITIAL_VISIBLE_MOVIES); }, [movies]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setSelectedGenre('');
    setSearchQuery(inputValue.trim());
    try {
      const res = await moviesAPI.search(inputValue.trim());
      setMovies(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { /* silent */ } finally { setIsLoading(false); }
  };

  const handleGenreSelect = async (genre: string) => {
    setSelectedGenre(genre);
    setSearchQuery('');
    setInputValue('');
    setIsLoading(true);
    try {
      const res = await moviesAPI.getByGenre(genre);
      setMovies(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { /* silent */ } finally { setIsLoading(false); }
  };

  const handleClear = () => {
    setInputValue('');
    setSearchQuery('');
    setSelectedGenre('');
    setMovies([]);
  };

  return (
    <div className="page-container">
      <div className="page-inner">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Explore</h1>
          <p className="text-gray-400 mt-1 text-sm">Search movies and series or browse by genre</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-xl">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search titles, actors…"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="field pl-10 pr-10 py-3"
            />
            {inputValue && (
              <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        {/* Genres */}
        <div className="flex flex-wrap gap-2 mb-10">
          {GENRES.map(genre => (
            <button
              key={genre}
              type="button"
              onClick={() => handleGenreSelect(genre)}
              className={`pill ${selectedGenre === genre ? 'pill-active' : 'pill-inactive'}`}
            >
              {genre}
            </button>
          ))}
          {(searchQuery || selectedGenre) && (
            <button type="button" onClick={handleClear} className="pill text-gray-500 hover:text-white border border-white/[0.07] hover:bg-white/[0.06]">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Results header */}
        {(searchQuery || selectedGenre) && !isLoading && (
          <p className="text-gray-400 text-sm mb-4">
            {movies.length} results {searchQuery ? `for "${searchQuery}"` : `in ${selectedGenre}`}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 35}ms` }} />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {visibleMovies.map(movie => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelect={m => { setSelectedMovie(m); setIsModalOpen(true); }}
                />
              ))}
            </div>

            {(hasMore || !hasMore) && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  disabled={!hasMore}
                  onClick={() => setVisibleCount(p => p + LOAD_MORE_STEP)}
                  className="px-6 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.09] text-white text-sm font-semibold hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {hasMore ? `Show ${LOAD_MORE_STEP} more` : 'All results shown'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
              <Search size={22} className="text-gray-500" />
            </div>
            <p className="text-white font-medium">
              {searchQuery || selectedGenre ? 'No results found' : 'Search or pick a genre to start'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery ? `Try a different search term` : 'Thousands of titles await'}
            </p>
          </div>
        )}
      </div>

      <MovieModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedMovie(null); }}
      />
    </div>
  );
};

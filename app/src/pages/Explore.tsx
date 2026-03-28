import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MovieCard, MovieModal } from '../components/movie';
import { Actor, Movie } from '../types';
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchWatchlist, fetchWatchlistCount } = useWatchlistStore();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_MOVIES);

  useEffect(() => { fetchWatchlist(); fetchWatchlistCount(); }, []);

  useEffect(() => {
    const query = searchParams.get('q') || '';
    if (!query.trim()) {
      return;
    }

    setInputValue(query);
    void runSearch(query);
  }, [searchParams]);

  const visibleMovies = useMemo(() => movies.slice(0, visibleCount), [movies, visibleCount]);
  const hasMore = movies.length > visibleCount;

  useEffect(() => { setVisibleCount(INITIAL_VISIBLE_MOVIES); }, [movies]);

  const runSearch = async (query: string) => {
    setIsLoading(true);
    setSelectedGenre('');
    setSearchQuery(query.trim());
    try {
      const [movieRes, actorRes] = await Promise.all([
        moviesAPI.search(query.trim()),
        moviesAPI.searchActors(query.trim()),
      ]);
      setMovies(movieRes.data);
      setActors(actorRes.data);
    } catch { /* silent */ } finally { setIsLoading(false); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setSearchParams({ q: inputValue.trim() });
    await runSearch(inputValue.trim());
  };

  const handleGenreSelect = async (genre: string) => {
    setSelectedGenre(genre);
    setSearchQuery('');
    setActors([]);
    setInputValue('');
    setSearchParams({});
    setIsLoading(true);
    try {
      const res = await moviesAPI.getByGenre(genre);
      setMovies(res.data);
    } catch { /* silent */ } finally { setIsLoading(false); }
  };

  const handleClear = () => {
    setInputValue('');
    setSearchQuery('');
    setSelectedGenre('');
    setMovies([]);
    setActors([]);
    setSearchParams({});
  };

  return (
    <div className="page-container">
      <div className="page-inner">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Explore</h1>
          <p className="text-gray-400 mt-1 text-sm">Search movies and actors or browse by genre</p>
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
            {searchQuery
              ? `${movies.length} movies and ${actors.length} actors for "${searchQuery}"`
              : `${movies.length} results in ${selectedGenre}`}
          </p>
        )}

        {searchQuery && actors.length > 0 && !isLoading && (
          <>
            <h2 className="text-white text-lg font-semibold mb-3">Actors</h2>
            <div className="flex gap-3 overflow-x-auto pb-3 mb-7 scrollbar-hide">
              {actors.map(actor => (
                <button
                  key={String(actor.id)}
                  type="button"
                  onClick={() => navigate(`/actors/${actor.id}`)}
                  className="min-w-[160px] text-left rounded-2xl bg-white/[0.04] border border-white/[0.1] p-3 hover:bg-white/[0.1] transition-colors"
                >
                  <img
                    src={actor.profilePath || 'https://placehold.co/200x300/1f2937/e5e7eb?text=Actor'}
                    alt={actor.name}
                    className="w-full h-40 object-cover rounded-lg border border-white/[0.08]"
                  />
                  <p className="text-white font-semibold text-sm mt-2 line-clamp-2">{actor.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{actor.knownForDepartment || 'Actor'}</p>
                </button>
              ))}
            </div>
          </>
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
              {searchQuery ? `Try a different search term for movies and actors` : 'Thousands of titles await'}
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

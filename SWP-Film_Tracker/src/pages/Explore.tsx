import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { MovieCard, MovieModal } from '../components/movie';
import { Movie } from '../types';
import { moviesAPI } from '../services/api';
import { useWatchlistStore } from '../store';

export const Explore: React.FC = () => {
  const { fetchWatchlist, fetchWatchlistCount } = useWatchlistStore();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWatchlist();
    fetchWatchlistCount();
  }, []);

  const genres = [
    'Action',
    'Crime',
    'Drama',
    'Sci-Fi',
    'Thriller',
    'Biography',
    'History',
    'Romance',
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await moviesAPI.search(searchQuery);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setMovies(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenreSelect = async (genre: string) => {
    setSelectedGenre(genre);
    setIsLoading(true);
    try {
      const response = await moviesAPI.getByGenre(genre);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setMovies(data);
    } catch (error) {
      console.error('Genre filter error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <h1 className="text-4xl font-bold text-white mb-8">Explore</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search movies and series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <Search size={20} />
            </button>
          </div>
        </form>

        {/* Genre Filter */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Filter by Genre</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedGenre('');
                setMovies([]);
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedGenre === ''
                  ? 'bg-red-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              All
            </button>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreSelect(genre)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedGenre === genre
                    ? 'bg-red-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Movie Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading movies...</p>
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelect={(m) => {
                  setSelectedMovie(m);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {searchQuery || selectedGenre ? 'No movies found' : 'Use search or filter to find movies'}
            </p>
          </div>
        )}
      </div>

      {/* Movie Modal */}
      <MovieModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMovie(null);
        }}
      />
    </div>
  );
};

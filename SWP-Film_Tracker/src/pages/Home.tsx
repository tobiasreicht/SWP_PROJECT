import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { MovieRow, MovieModal } from '../components/movie';
import { Movie } from '../types';
import { moviesAPI } from '../services/api';

export const Home: React.FC = () => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback movie for hero section if no trending movies
  const heroMovie = trendingMovies[0] || {
    id: 'placeholder',
    title: 'Film Tracker',
    description: 'Discover and track your favorite movies and series',
    releaseDate: new Date(),
    type: 'movie' as const,
    genres: ['Drama'],
    cast: [],
    poster: '',
    backdrop: 'https://images.unsplash.com/photo-1478720568477-152d9e3fb27f?w=1600&h=900&fit=crop',
    rating: 0,
    streamingPlatforms: [],
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all movies (use a large limit to get the whole DB)
        const allMoviesRes = await moviesAPI.getAll(1, 1000);
        // API returns array of movies directly
        setMovies(allMoviesRes.data || []);

        // Fetch trending
        const trendingRes = await moviesAPI.getTrending();
        setTrendingMovies(trendingRes.data || []);

        // Fetch new releases
        const newRes = await moviesAPI.getNewReleases();
        setNewReleases(newRes.data || []);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const displayMovies = movies.length > 0 ? movies : [];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative h-screen w-full mb-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${heroMovie.backdrop}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-center px-4 md:px-12 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              {heroMovie.title}
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              {heroMovie.description}
            </p>
            {selectedMovie && (
              <div className="flex gap-4">
                <button
                  onClick={() => handleMovieSelect(heroMovie)}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Play size={20} fill="currentColor" />
                  Watch Now
                </button>
                <button
                  onClick={() => handleMovieSelect(heroMovie)}
                  className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition-colors"
                >
                  More Info
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <div className="px-4 md:px-12 pb-16">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading movies...</p>
          </div>
        ) : (
          <>
            {trendingMovies.length > 0 && (
              <MovieRow
                title="Trending Now"
                movies={trendingMovies}
                onMovieSelect={handleMovieSelect}
              />
            )}
            {newReleases.length > 0 && (
              <MovieRow
                title="New Releases"
                movies={newReleases}
                onMovieSelect={handleMovieSelect}
              />
            )}
            {displayMovies.length > 0 && (
              <MovieRow
                title="Popular Movies"
                movies={displayMovies}
                onMovieSelect={handleMovieSelect}
              />
            )}
          </>
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

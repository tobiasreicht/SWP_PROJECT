import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { MovieRow, MovieModal } from '../components/movie';
import { Movie } from '../types';
import { moviesAPI } from '../services/api';
import { useWatchlistStore } from '../store';

interface HomeRow {
  title: string;
  movies: Movie[];
}

interface HomeCachePayload {
  cachedAt: number;
  heroMovie: Movie | null;
  homeRows: HomeRow[];
}

const HOME_CACHE_TTL_MS = 5 * 60 * 1000;
const HOME_CACHE_PREFIX = 'home-cache-v1';

const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const uniqueMovies = (movies: Movie[]): Movie[] => {
  const seen = new Set<string>();
  return movies.filter((movie) => {
    const key = `${movie.id}-${movie.tmdbId || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const normalizeMovieResponse = (responseData: any): Movie[] =>
  (Array.isArray(responseData) ? responseData : responseData?.data || []) as Movie[];

const getHomeCacheKey = () => {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      return `${HOME_CACHE_PREFIX}:guest`;
    }

    const parsedUser = JSON.parse(rawUser);
    const userId = parsedUser?.id || 'guest';
    return `${HOME_CACHE_PREFIX}:${userId}`;
  } catch {
    return `${HOME_CACHE_PREFIX}:guest`;
  }
};

const readHomeCache = (cacheKey: string): HomeCachePayload | null => {
  try {
    const rawCache = localStorage.getItem(cacheKey);
    if (!rawCache) {
      return null;
    }

    const parsedCache = JSON.parse(rawCache) as HomeCachePayload;
    if (
      typeof parsedCache?.cachedAt !== 'number' ||
      !Array.isArray(parsedCache?.homeRows)
    ) {
      return null;
    }

    return parsedCache;
  } catch {
    return null;
  }
};

const writeHomeCache = (cacheKey: string, payload: Omit<HomeCachePayload, 'cachedAt'>) => {
  try {
    const cacheValue: HomeCachePayload = {
      cachedAt: Date.now(),
      ...payload,
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheValue));
  } catch {
    // ignore storage failures
  }
};

export const Home: React.FC = () => {
  const { fetchWatchlist, fetchWatchlistCount } = useWatchlistStore();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [homeRows, setHomeRows] = useState<HomeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cacheKey = getHomeCacheKey();

    const buildHomeData = async (): Promise<Omit<HomeCachePayload, 'cachedAt'>> => {
      const pagesToLoad = 8;
      const pageRequests = Array.from({ length: pagesToLoad }, (_, index) =>
        moviesAPI.getAll(index + 1, 20)
      );

      const genrePool = ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Crime', 'Romance', 'Adventure', 'Animation', 'Fantasy'];
      const shuffledGenres = shuffleArray(genrePool).slice(0, 4);
      const genreRequests = shuffledGenres.map((genre) => moviesAPI.getByGenre(genre));

      const [pagedResponses, trendingRes, newRes, ...genreResponses] = await Promise.all([
        Promise.all(pageRequests),
        moviesAPI.getTrending(),
        moviesAPI.getNewReleases(),
        ...genreRequests,
      ]);

      const pagedMovies = pagedResponses.flatMap((response) => normalizeMovieResponse(response.data));
      const trendingMovies = normalizeMovieResponse(trendingRes.data);
      const newReleaseMovies = normalizeMovieResponse(newRes.data);
      const genreMoviesByRow = genreResponses.map((response) => normalizeMovieResponse(response.data));

      const bigPool = uniqueMovies([
        ...pagedMovies,
        ...trendingMovies,
        ...newReleaseMovies,
        ...genreMoviesByRow.flat(),
      ]);

      const mixedPool = shuffleArray(bigPool);
      const mixedTrending = shuffleArray(trendingMovies);
      const mixedNewReleases = shuffleArray(newReleaseMovies);

      const heroCandidates = shuffleArray(
        uniqueMovies([...mixedTrending, ...mixedNewReleases, ...mixedPool]).filter(
          (movie) => Boolean(movie.backdrop || movie.poster)
        )
      );

      const curatedRows: HomeRow[] = [
        { title: 'Trending Now', movies: mixedTrending },
        { title: 'New Releases', movies: mixedNewReleases },
        { title: 'Because You Might Like', movies: mixedPool.slice(0, 25) },
        { title: 'Top Picks Tonight', movies: mixedPool.slice(25, 50) },
        { title: 'Hidden Gems', movies: mixedPool.slice(50, 75) },
        { title: 'More to Explore', movies: mixedPool.slice(75, 110) },
      ];

      const genreRows: HomeRow[] = genreMoviesByRow
        .map((movies, index) => ({
          title: `${shuffledGenres[index]} Spotlight`,
          movies: uniqueMovies(shuffleArray(movies)).slice(0, 20),
        }))
        .filter((row) => row.movies.length > 0);

      const mergedRows = [...curatedRows, ...genreRows].filter((row) => row.movies.length > 0);

      return {
        heroMovie: heroCandidates[0] || null,
        homeRows: mergedRows,
      };
    };

    const fetchMovies = async (showSpinner: boolean) => {
      try {
        if (showSpinner) {
          setIsLoading(true);
        }

        const payload = await buildHomeData();
        setHeroMovie(payload.heroMovie);
        setHomeRows(payload.homeRows);
        writeHomeCache(cacheKey, payload);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const cachedData = readHomeCache(cacheKey);
    const cacheAgeMs = cachedData ? Date.now() - cachedData.cachedAt : Number.POSITIVE_INFINITY;
    const hasFreshCache = Boolean(cachedData && cacheAgeMs < HOME_CACHE_TTL_MS);

    if (cachedData) {
      setHeroMovie(cachedData.heroMovie);
      setHomeRows(cachedData.homeRows);
      setIsLoading(false);
    }

    if (!hasFreshCache) {
      fetchMovies(!cachedData);
    }

    fetchWatchlist();
    fetchWatchlistCount();
  }, []);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative h-screen w-full mb-0">
        {heroMovie?.trailerUrl ? (
          <div className="absolute inset-0 overflow-hidden bg-black">
            <iframe
              title={`${heroMovie.title} trailer`}
              src={heroMovie.trailerUrl}
              className="absolute left-1/2 top-1/2 h-[122%] w-[122%] max-w-none -translate-x-1/2 -translate-y-[60%] pointer-events-none"
              allow="autoplay; encrypted-media; picture-in-picture "
              allowFullScreen
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/60 to-transparent" />
          </div>
        ) : heroMovie?.backdrop ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${heroMovie.backdrop}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/60 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 to-neutral-800" />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-150 bg-gradient-to-b from-transparent via-neutral-900/55 to-neutral-900 backdrop-blur-sm" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-center px-4 md:px-12 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              {heroMovie?.title || 'No trending title available'}
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              {heroMovie?.description || 'Trending content will appear here once available from the backend.'}
            </p>
            {heroMovie && (
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
      <div className="relative z-20 -mt-60 w-full pb-16">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading movies...</p>
          </div>
        ) : (
          <>
            {homeRows.map((row) => (
              <MovieRow
                key={row.title}
                title={row.title}
                movies={row.movies}
                onMovieSelect={handleMovieSelect}
              />
            ))}
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

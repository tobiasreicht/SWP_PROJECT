import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { MovieRow, MovieModal } from '../components/movie';
import { Movie } from '../types';
import { moviesAPI } from '../services/tmdb';
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
const HOME_CACHE_PREFIX = 'home-cache-v5';
const RECENT_RELEASE_WINDOW_DAYS = 60;

const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const uniqueMovies = (movies: Movie[]): Movie[] => {
  const seen = new Set<string>();
  return movies.filter((m) => {
    const key = `${m.id}-${m.tmdbId || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseMovieDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const splitReleaseBuckets = (movies: Movie[]) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const recentCutoff = new Date(now);
  recentCutoff.setDate(recentCutoff.getDate() - RECENT_RELEASE_WINDOW_DAYS);

  const released = movies
    .filter((movie) => {
      const releaseDate = parseMovieDate(movie.releaseDate);
      if (!releaseDate) return false;
      return releaseDate <= now && releaseDate >= recentCutoff;
    })
    .sort((a, b) => {
      const aTime = parseMovieDate(a.releaseDate)?.getTime() ?? 0;
      const bTime = parseMovieDate(b.releaseDate)?.getTime() ?? 0;
      return bTime - aTime;
    });

  const upcomingThisYear = movies
    .filter((movie) => {
      const releaseDate = parseMovieDate(movie.releaseDate);
      if (!releaseDate) return false;
      return releaseDate > now && releaseDate.getFullYear() === currentYear;
    })
    .sort((a, b) => {
      const aTime = parseMovieDate(a.releaseDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = parseMovieDate(b.releaseDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

  return { released, upcomingThisYear };
};

const withVerifiedTrailer = async (candidates: Movie[], maxChecks = 12): Promise<Movie | null> => {
  const checked = candidates.slice(0, maxChecks);

  for (const candidate of checked) {
    try {
      const id = String(candidate.tmdbId || candidate.id);
      const detail = await moviesAPI.getById(id);
      if (detail.data?.trailerUrl) {
        return detail.data;
      }
    } catch {
      // ignore single candidate failures
    }
  }

  return null;
};

const normalizeMovieResponse = (responseData: any): Movie[] =>
  (Array.isArray(responseData) ? responseData : responseData?.data || []) as Movie[];

const getHomeCacheKey = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return `${HOME_CACHE_PREFIX}:guest`;
    const user = JSON.parse(raw);
    return `${HOME_CACHE_PREFIX}:${user?.id || 'guest'}`;
  } catch {
    return `${HOME_CACHE_PREFIX}:guest`;
  }
};

const readHomeCache = (cacheKey: string): HomeCachePayload | null => {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeCachePayload;
    if (typeof parsed?.cachedAt !== 'number' || !Array.isArray(parsed?.homeRows)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeHomeCache = (cacheKey: string, payload: Omit<HomeCachePayload, 'cachedAt'>) => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), ...payload }));
  } catch {}
};

const MovieRowSkeleton: React.FC<{ title?: string }> = ({ title }) => (
  <div className="relative mb-8">
    {title && (
      <h2 className="text-2xl md:text-3xl font-bold text-neutral-600 mb-6 px-4 md:px-6 animate-pulse">
        {title}
      </h2>
    )}
    <div className="flex gap-4 px-4 md:px-6 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="h-80 w-60 flex-shrink-0 rounded-lg bg-neutral-800 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  </div>
);

export const Home: React.FC = () => {
  const { fetchWatchlist, fetchWatchlistCount } = useWatchlistStore();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [homeRows, setHomeRows] = useState<HomeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = getHomeCacheKey();

    const fetchCritical = async () => {
      // Phase 1: Get enough data to build meaningful release buckets
      const [trendingRes, newRes, page1Res, page2Res] = await Promise.all([
        moviesAPI.getTrending(),
        moviesAPI.getNewReleases(),
        moviesAPI.getAll(1, 20),
        moviesAPI.getAll(2, 20),
      ]);

      const trending = normalizeMovieResponse(trendingRes.data);
      const allReleaseCandidates = normalizeMovieResponse(newRes.data);
      const { released: newReleases, upcomingThisYear } = splitReleaseBuckets(allReleaseCandidates);
      const page1 = normalizeMovieResponse(page1Res.data);
      const page2 = normalizeMovieResponse(page2Res.data);
      const releaseCandidatePool = uniqueMovies([...allReleaseCandidates, ...page1, ...page2, ...trending]);
      const { released: robustNewReleases, upcomingThisYear: robustUpcomingThisYear } = splitReleaseBuckets(releaseCandidatePool);

      const heroPool = shuffleArray(
        uniqueMovies([...trending, ...newReleases, ...page1]).filter(m => Boolean(m.backdrop || m.poster))
      );
      const heroMovie = await withVerifiedTrailer(heroPool, 15);

      const rows: HomeRow[] = [
        { title: 'Trending Now', movies: shuffleArray(trending) },
        { title: 'New Releases (Last 60 Days)', movies: shuffleArray(robustNewReleases) },
        { title: 'Upcoming This Year', movies: robustUpcomingThisYear },
        { title: 'Popular Movies', movies: uniqueMovies(page1) },
      ];

      return { heroMovie, homeRows: rows, trending, newReleases, page1 };
    };

    const fetchExtra = async (existing: Movie[]) => {
      // Phase 2: background — 2 pages + 3 genre rows
      const existingIds = new Set(existing.map(m => `${m.id}-${m.tmdbId || ''}`));
      const genrePool = ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Crime', 'Romance', 'Adventure'];
      const genres = shuffleArray(genrePool).slice(0, 3);

      const [page2Res, page3Res, ...genreResponses] = await Promise.all([
        moviesAPI.getAll(2, 20),
        moviesAPI.getAll(3, 20),
        ...genres.map(g => moviesAPI.getByGenre(g)),
      ]);

      const extraPool = shuffleArray(
        uniqueMovies([
          ...normalizeMovieResponse(page2Res.data),
          ...normalizeMovieResponse(page3Res.data),
        ]).filter(m => !existingIds.has(`${m.id}-${m.tmdbId || ''}`))
      );

      return [
        { title: 'Because You Might Like', movies: extraPool.slice(0, 20) },
        { title: 'Top Picks Tonight', movies: extraPool.slice(20, 40) },
        ...genres.map((g, i) => ({
          title: `${g} Spotlight`,
          movies: uniqueMovies(shuffleArray(normalizeMovieResponse(genreResponses[i].data))).slice(0, 20),
        })),
      ].filter(row => row.movies.length > 0);
    };

    const run = async () => {
      const cachedData = readHomeCache(cacheKey);
      const cacheAge = cachedData ? Date.now() - cachedData.cachedAt : Infinity;
      const hasFreshCache = cachedData && cacheAge < HOME_CACHE_TTL_MS;

      if (cachedData) {
        setHeroMovie(cachedData.heroMovie);
        setHomeRows(cachedData.homeRows);
        setIsLoading(false);
      }

      if (!hasFreshCache) {
        try {
          if (!cachedData) setIsLoading(true);

          const critical = await fetchCritical();
          if (cancelled) return;

          setHeroMovie(critical.heroMovie);
          setHomeRows(critical.homeRows);
          setIsLoading(false);
          setIsLoadingMore(true);

          const extraRows = await fetchExtra([...critical.trending, ...critical.newReleases, ...critical.page1]);
          if (cancelled) return;

          setHomeRows(prev => {
            const merged = [...prev, ...extraRows];
            writeHomeCache(cacheKey, { heroMovie: critical.heroMovie, homeRows: merged });
            return merged;
          });
        } catch (err) {
          console.error('Error fetching movies:', err);
        } finally {
          if (!cancelled) {
            setIsLoading(false);
            setIsLoadingMore(false);
          }
        }
      }
    };

    run();
    fetchWatchlist();
    fetchWatchlistCount();

    return () => { cancelled = true; };
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
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/60 to-transparent" />
          </div>
        ) : heroMovie?.backdrop ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${heroMovie.backdrop}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/60 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 to-neutral-800" />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-150 bg-gradient-to-b from-transparent via-neutral-900/55 to-neutral-900 backdrop-blur-sm" />

        <div className="relative h-full flex flex-col justify-center px-4 md:px-12 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              {heroMovie?.title || 'Welcome'}
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              {heroMovie?.description || "Discover movies and series you'll love."}
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
          <>
            <MovieRowSkeleton title="Trending Now" />
            <MovieRowSkeleton title="New Releases" />
            <MovieRowSkeleton title="Popular Movies" />
          </>
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
            {isLoadingMore && (
              <>
                <MovieRowSkeleton title="Loading more..." />
                <MovieRowSkeleton />
              </>
            )}
          </>
        )}
      </div>

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

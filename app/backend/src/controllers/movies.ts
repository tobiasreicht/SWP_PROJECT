import express from 'express';
import { PrismaClient } from '@prisma/client';
import { readTokenMiddleware } from '../middleware/index.js';
import {
  fetchMovieDetails,
  fetchMovieCast,
  fetchSeriesSeason,
  fetchActorProfile,
  searchTMDB,
  searchActorsTMDB,
  getTrendingMovies,
  getTrendingSeries,
  getNewReleases,
  getNewSeries,
  discoverMovies,
  discoverByGenreName,
  discoverSeries,
  discoverSeriesByGenreName,
} from '../services/tmdb.js';
import { adminMiddleware } from '../middleware/index.js';

const router = express.Router();
const prisma = new PrismaClient();

const parseJsonArray = (value: string | null | undefined) => {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const serializeMovie = (movie: any) => ({
  ...movie,
  genres: parseJsonArray(movie.genres),
  cast: parseJsonArray(movie.cast),
});

const hydrateStoredMovie = async (movie: any) => {
  const serialized = serializeMovie(movie);

  if (!process.env.TMDB_API_KEY || !movie.tmdbId) {
    return serialized;
  }

  try {
    const remote = await fetchMovieDetails(movie.tmdbId);
    return {
      ...serialized,
      poster: remote.poster || serialized.poster,
      backdrop: remote.backdrop || serialized.backdrop,
      trailerUrl: remote.trailerUrl || null,
      streamingPlatforms: remote.streamingPlatforms || [],
      runtime: remote.runtime ?? serialized.runtime,
      rating: remote.rating || serialized.rating,
      seasonCount: remote.seasonCount,
      episodeCount: remote.episodeCount,
      seriesStatus: remote.seriesStatus,
      seasons: remote.seasons,
    };
  } catch {
    return serialized;
  }
};

const serializeTmdbDetail = (detail: any) => ({
  id: String(detail.tmdbId),
  tmdbId: detail.tmdbId,
  title: detail.title,
  description: detail.description,
  releaseDate: detail.releaseDate,
  type: detail.type,
  genres: detail.genres,
  director: detail.director,
  cast: detail.cast,
  poster: detail.poster,
  backdrop: detail.backdrop,
  runtime: detail.runtime,
  rating: detail.rating,
  streamingPlatforms: detail.streamingPlatforms || [],
  trailerUrl: detail.trailerUrl || null,
  seasonCount: detail.seasonCount,
  episodeCount: detail.episodeCount,
  seriesStatus: detail.seriesStatus,
  seasons: detail.seasons,
});

const fallbackTmdbResult = (item: any) => ({
  id: String(item.id),
  tmdbId: item.id,
  title: item.title || item.original_title || item.name || item.original_name,
  description: item.overview || '',
  releaseDate: item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date) : null,
  type: item.media_type === 'tv' || item.name ? 'series' : 'movie',
  genres: item.genre_ids || [],
  director: null,
  cast: [],
  poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
  backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : '',
  runtime: null,
  rating: item.vote_average || 0,
  streamingPlatforms: [],
  trailerUrl: null,
});

const interleaveTmdbResults = (movies: any[], series: any[], limit: number) => {
  const mixed: Array<{ mediaPath: 'movie' | 'tv'; item: any }> = [];
  let movieIndex = 0;
  let seriesIndex = 0;

  while (mixed.length < limit && (movieIndex < movies.length || seriesIndex < series.length)) {
    for (let i = 0; i < 3 && mixed.length < limit && movieIndex < movies.length; i += 1) {
      mixed.push({ mediaPath: 'movie', item: movies[movieIndex] });
      movieIndex += 1;
    }

    if (mixed.length < limit && seriesIndex < series.length) {
      mixed.push({ mediaPath: 'tv', item: series[seriesIndex] });
      seriesIndex += 1;
    }
  }

  return mixed;
};

const serializeTmdbListItem = async (item: any, mediaPath: 'movie' | 'tv') => {
  try {
    const d = await fetchMovieDetails(item.id, mediaPath);
    return {
      id: String(d.tmdbId),
      tmdbId: d.tmdbId,
      title: d.title,
      description: d.description,
      releaseDate: d.releaseDate,
      type: d.type,
      genres: d.genres,
      director: d.director,
      cast: d.cast,
      poster: d.poster,
      backdrop: d.backdrop,
      runtime: d.runtime,
      rating: d.rating,
      streamingPlatforms: d.streamingPlatforms || [],
      trailerUrl: d.trailerUrl || null,
      seasonCount: d.seasonCount,
      episodeCount: d.episodeCount,
      seriesStatus: d.seriesStatus,
      seasons: d.seasons,
    };
  } catch {
    return {
      id: String(item.id),
      tmdbId: item.id,
      title: item.title || item.original_title || item.name || item.original_name,
      description: item.overview || '',
      releaseDate: item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date) : null,
      type: mediaPath === 'tv' ? 'series' : 'movie',
      genres: (item.genre_ids || []).map((id: number) => id),
      director: null,
      cast: [],
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
      backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : '',
      runtime: null,
      rating: item.vote_average || 0,
      streamingPlatforms: [],
      trailerUrl: null,
    };
  }
};

const hasDatabaseContent = async () => {
  const count = await prisma.movie.count();
  return count > 0;
};

const normalizeSearchText = (value: string | null | undefined) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const computeSearchRank = (
  item: { title?: string; description?: string; rating?: number },
  query: string,
  meta?: { popularity?: number; voteCount?: number; source?: 'db' | 'tmdb' },
) => {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTitle = normalizeSearchText(item.title);
  const normalizedDescription = normalizeSearchText(item.description);

  if (!normalizedQuery || !normalizedTitle) {
    return 0;
  }

  const queryWords = normalizedQuery.split(' ').filter(Boolean);
  const titleWords = normalizedTitle.split(' ').filter(Boolean);

  let score = 0;

  if (normalizedTitle === normalizedQuery) score += 1200;
  if (normalizedTitle.startsWith(normalizedQuery)) score += 700;
  if (normalizedTitle.includes(normalizedQuery)) score += 450;
  if (queryWords.every((word) => normalizedTitle.includes(word))) score += 220;
  if (queryWords.some((word) => titleWords.includes(word))) score += 140;
  if (normalizedDescription.includes(normalizedQuery)) score += 40;

  const lengthGap = Math.abs(normalizedTitle.length - normalizedQuery.length);
  score -= Math.min(90, lengthGap * 2);

  score += Math.min(120, (meta?.popularity || 0) / 4);
  score += Math.min(80, (meta?.voteCount || 0) / 60);
  score += Math.min(60, (item.rating || 0) * 5);
  score += meta?.source === 'tmdb' ? 20 : 0;

  return score;
};

const damerauLevenshtein = (aRaw: string, bRaw: string) => {
  const a = normalizeSearchText(aRaw);
  const b = normalizeSearchText(bRaw);

  const al = a.length;
  const bl = b.length;

  if (al === 0) return bl;
  if (bl === 0) return al;

  const dp: number[][] = Array.from({ length: al + 1 }, () => Array(bl + 1).fill(0));

  for (let i = 0; i <= al; i += 1) dp[i][0] = i;
  for (let j = 0; j <= bl; j += 1) dp[0][j] = j;

  for (let i = 1; i <= al; i += 1) {
    for (let j = 1; j <= bl; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );

      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }

  return dp[al][bl];
};

const fuzzyTitleScore = (query: string, title: string) => {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTitle = normalizeSearchText(title);

  if (!normalizedQuery || !normalizedTitle) return 0;

  if (normalizedTitle === normalizedQuery) return 2000;

  const distance = damerauLevenshtein(normalizedQuery, normalizedTitle);
  const maxLen = Math.max(normalizedQuery.length, normalizedTitle.length);
  const similarity = maxLen > 0 ? 1 - distance / maxLen : 0;

  let score = similarity * 1000;

  if (normalizedTitle.includes(normalizedQuery)) score += 260;
  if (normalizedTitle.startsWith(normalizedQuery)) score += 320;

  const queryPrefix = normalizedQuery.slice(0, 3);
  if (queryPrefix && normalizedTitle.startsWith(queryPrefix)) score += 120;

  return score;
};

const buildFuzzyTmdbFallback = async (
  query: string,
  existingTmdbIds: Set<number>,
) => {
  const [popularMovies, popularSeries, trendingMovies, trendingSeries] = await Promise.all([
    discoverMovies(1),
    discoverSeries(1),
    getTrendingMovies('week', 1),
    getTrendingSeries('week', 1),
  ]);

  const rawCandidates = [
    ...(popularMovies.results || []).map((item: any) => ({ ...item, media_type: 'movie' })),
    ...(popularSeries.results || []).map((item: any) => ({ ...item, media_type: 'tv' })),
    ...(trendingMovies.results || []).map((item: any) => ({ ...item, media_type: 'movie' })),
    ...(trendingSeries.results || []).map((item: any) => ({ ...item, media_type: 'tv' })),
  ];

  const deduped = new Map<string, any>();
  for (const candidate of rawCandidates) {
    const key = `${candidate.media_type}-${candidate.id}`;
    if (!deduped.has(key)) deduped.set(key, candidate);
  }

  const scored = [...deduped.values()]
    .filter((item: any) => !existingTmdbIds.has(item.id))
    .map((item: any) => {
      const title = item.title || item.original_title || item.name || item.original_name || '';
      const score = fuzzyTitleScore(query, title);
      const popularityBoost = Math.min(100, (item.popularity || 0) / 2);
      const voteBoost = Math.min(60, (item.vote_count || 0) / 100);
      return {
        item,
        score: score + popularityBoost + voteBoost,
      };
    })
    .filter(({ score, item }) => {
      const title = item.title || item.original_title || item.name || item.original_name || '';
      const normalizedTitle = normalizeSearchText(title);
      const normalizedQuery = normalizeSearchText(query);
      const distance = damerauLevenshtein(normalizedQuery, normalizedTitle);
      return score >= 420 || distance <= 2;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ item, score }) => ({
      ...fallbackTmdbResult(item),
      __searchRank: score,
    }));

  return scored;
};

// Get all movies with pagination (supports TMDB when configured)
router.get('/', readTokenMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (await hasDatabaseContent()) {
      const movies = await prisma.movie.findMany({
        skip,
        take: limit,
        orderBy: [
          { rating: 'desc' },
          { releaseDate: 'desc' },
        ],
      });

      return res.json(await Promise.all(movies.map(hydrateStoredMovie)));
    }

    const useTMDB = !!process.env.TMDB_API_KEY;
    if (useTMDB) {
      // TMDB pagination: 20 items per page by default
      const tmdbPage = Math.max(1, Math.ceil((page * limit) / 20));
      const [movieData, seriesData] = await Promise.all([
        discoverMovies(tmdbPage),
        discoverSeries(tmdbPage),
      ]);
      const mixed = interleaveTmdbResults(movieData.results || [], seriesData.results || [], limit);

      const detailed = await Promise.all(
        mixed.map(({ item, mediaPath }) => serializeTmdbListItem(item, mediaPath))
      );

      return res.json(detailed);
    }

    return res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// Get trending movies
router.get('/trending', readTokenMiddleware, async (req, res) => {
  try {
    if (await hasDatabaseContent()) {
      const movies = await prisma.movie.findMany({
        orderBy: [
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 10,
      });

      return res.json(await Promise.all(movies.map(hydrateStoredMovie)));
    }

    const useTMDB = !!process.env.TMDB_API_KEY;
    if (useTMDB) {
      const [movieData, seriesData] = await Promise.all([
        getTrendingMovies('week'),
        getTrendingSeries('week'),
      ]);
      const mixed = interleaveTmdbResults(movieData.results || [], seriesData.results || [], 10);

      const detailed = await Promise.all(
        mixed.map(({ item, mediaPath }) => serializeTmdbListItem(item, mediaPath))
      );

      return res.json(detailed);
    }

    return res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

// Get new releases
router.get('/new', readTokenMiddleware, async (req, res) => {
  try {
    if (await hasDatabaseContent()) {
      const movies = await prisma.movie.findMany({
        orderBy: { releaseDate: 'desc' },
        take: 10,
      });

      return res.json(await Promise.all(movies.map(hydrateStoredMovie)));
    }

    const useTMDB = !!process.env.TMDB_API_KEY;
    if (useTMDB) {
      const [movieData, seriesData] = await Promise.all([
        getNewReleases(),
        getNewSeries(),
      ]);
      const mixed = interleaveTmdbResults(movieData.results || [], seriesData.results || [], 10);

      const detailed = await Promise.all(
        mixed.map(({ item, mediaPath }) => serializeTmdbListItem(item, mediaPath))
      );

      return res.json(detailed);
    }

    return res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch new releases' });
  }
});

// Get movies by genre
router.get('/genre/:genre', readTokenMiddleware, async (req, res) => {
  try {
    const { genre } = req.params;
    if (await hasDatabaseContent()) {
      const movies = await prisma.movie.findMany({
        where: {
          genres: {
            contains: genre,
          },
        },
        take: 20,
        orderBy: [
          { rating: 'desc' },
          { releaseDate: 'desc' },
        ],
      });

      return res.json(await Promise.all(movies.map(hydrateStoredMovie)));
    }

    const useTMDB = !!process.env.TMDB_API_KEY;
    if (useTMDB) {
      const [movieData, seriesData] = await Promise.all([
        discoverByGenreName(genre),
        discoverSeriesByGenreName(genre),
      ]);
      const mixed = interleaveTmdbResults(movieData.results || [], seriesData.results || [], 20);

      const detailed = await Promise.all(
        mixed.map(({ item, mediaPath }) => serializeTmdbListItem(item, mediaPath))
      );

      return res.json(detailed);
    }

    return res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch movies by genre' });
  }
});

// Search movies
router.get('/search', readTokenMiddleware, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const databaseResults = await prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: q as string } },
          { description: { contains: q as string } },
        ],
      },
      take: 40,
      orderBy: [
        { rating: 'desc' },
        { releaseDate: 'desc' },
      ],
    });

    const hydratedDbResults = await Promise.all(databaseResults.map(hydrateStoredMovie));
    const serializedDbResults = hydratedDbResults.map((serialized) => {
      return {
        ...serialized,
        __searchRank: computeSearchRank(serialized, String(q), {
          source: 'db',
        }),
      };
    });
    const useTMDB = !!process.env.TMDB_API_KEY;

    if (useTMDB) {
      const data = await searchTMDB(String(q));
      const results = (data.results || []).filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');

      const tmdbResults = await Promise.all(
        results.slice(0, 40).map(async (item: any) => {
          try {
            const preferredMediaPath = item.media_type === 'tv' ? 'tv' : 'movie';
            const detail = await fetchMovieDetails(item.id, preferredMediaPath);
            return {
              ...serializeTmdbDetail(detail),
              __searchRank: computeSearchRank(detail, String(q), {
                popularity: item.popularity,
                voteCount: item.vote_count,
                source: 'tmdb',
              }),
            };
          } catch {
            const fallback = fallbackTmdbResult(item);
            return {
              ...fallback,
              __searchRank: computeSearchRank(fallback, String(q), {
                popularity: item.popularity,
                voteCount: item.vote_count,
                source: 'tmdb',
              }),
            };
          }
        })
      );

      let merged = [...serializedDbResults, ...tmdbResults].filter((item, index, array) => {
        const key = item.tmdbId ? `tmdb-${item.tmdbId}` : `${item.type}-${item.title}`;
        return array.findIndex((candidate) => {
          const candidateKey = candidate.tmdbId ? `tmdb-${candidate.tmdbId}` : `${candidate.type}-${candidate.title}`;
          return candidateKey === key;
        }) === index;
      }).sort((a, b) => {
        const rankDiff = (b.__searchRank || 0) - (a.__searchRank || 0);
        if (rankDiff !== 0) return rankDiff;
        return (b.rating || 0) - (a.rating || 0);
      });

      if (merged.length < 12) {
        const existingTmdbIds = new Set<number>(
          merged
            .map((item: any) => Number(item.tmdbId))
            .filter((id: number) => Number.isFinite(id))
        );

        const fuzzyFallback = await buildFuzzyTmdbFallback(String(q), existingTmdbIds);
        merged = [...merged, ...fuzzyFallback]
          .filter((item, index, array) => {
            const key = item.tmdbId ? `tmdb-${item.tmdbId}` : `${item.type}-${item.title}`;
            return array.findIndex((candidate) => {
              const candidateKey = candidate.tmdbId ? `tmdb-${candidate.tmdbId}` : `${candidate.type}-${candidate.title}`;
              return candidateKey === key;
            }) === index;
          })
          .sort((a, b) => {
            const rankDiff = (b.__searchRank || 0) - (a.__searchRank || 0);
            if (rankDiff !== 0) return rankDiff;
            return (b.rating || 0) - (a.rating || 0);
          });
      }

      return res.json(merged.slice(0, 20).map(({ __searchRank, ...item }) => item));
    }

    if (serializedDbResults.length > 0) {
      return res.json(
        serializedDbResults
          .sort((a, b) => (b.__searchRank || 0) - (a.__searchRank || 0))
          .slice(0, 20)
          .map(({ __searchRank, ...item }) => item)
      );
    }

    return res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// Search actors
router.get('/actors/search', readTokenMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const useTMDB = !!process.env.TMDB_API_KEY;
    if (!useTMDB) {
      return res.json([]);
    }

    const data = await searchActorsTMDB(String(q));
    return res.json(data.results || []);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to search actors' });
  }
});

router.get('/:id/seasons/:seasonNumber', readTokenMiddleware, async (req, res) => {
  try {
    const { id, seasonNumber } = req.params;
    const tmdbId = Number(id);
    const parsedSeason = Number(seasonNumber);

    if (!Number.isFinite(tmdbId) || !Number.isFinite(parsedSeason)) {
      return res.status(400).json({ error: 'Invalid series or season id' });
    }

    if (!process.env.TMDB_API_KEY) {
      return res.json([]);
    }

    const episodes = await fetchSeriesSeason(tmdbId, parsedSeason);
    return res.json(episodes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch season episodes' });
  }
});

// Get actor profile details and movie credits
router.get('/actors/:actorId', readTokenMiddleware, async (req, res) => {
  try {
    const { actorId } = req.params;
    const useTMDB = !!process.env.TMDB_API_KEY;

    if (!useTMDB) {
      return res.status(404).json({ error: 'Actor data not available without TMDB' });
    }

    const parsedId = Number(actorId);
    if (!Number.isFinite(parsedId)) {
      return res.status(400).json({ error: 'Invalid actor id' });
    }

    const profile = await fetchActorProfile(parsedId);
    return res.json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch actor profile' });
  }
});

// Get cast for a single movie
router.get('/:id/cast', readTokenMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const requestedType = String(req.query.type || '').toLowerCase();
    const preferredMediaPath = requestedType === 'series' ? 'tv' : requestedType === 'movie' ? 'movie' : undefined;
    const useTMDB = !!process.env.TMDB_API_KEY;

    const localMovie = await prisma.movie.findFirst({
      where: Number.isFinite(Number(id))
        ? {
            OR: [
              { id },
              { tmdbId: Number(id) },
            ],
          }
        : { id },
    });

    if (localMovie) {
      if (useTMDB && Number.isFinite(localMovie.tmdbId)) {
        const cast = await fetchMovieCast(localMovie.tmdbId, limit, preferredMediaPath);
        if (cast.length > 0) {
          return res.json(cast);
        }
      }

      const cast = parseJsonArray(localMovie.cast);
      return res.json(
        cast.slice(0, limit).map((name: string, index: number) => ({
          id: `local-${index}`,
          name,
          profilePath: '',
          character: undefined,
          knownForDepartment: 'Acting',
        }))
      );
    }

    if (!useTMDB) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const maybeTmdbId = Number(id);
    if (Number.isFinite(maybeTmdbId)) {
      const cast = await fetchMovieCast(maybeTmdbId, limit, preferredMediaPath);
      return res.json(cast);
    }

    return res.status(404).json({ error: 'Movie not found' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch cast' });
  }
});

// Get single movie by ID
router.get('/:id', readTokenMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const requestedType = String(req.query.type || '').toLowerCase();
    const preferredMediaPath = requestedType === 'series' ? 'tv' : requestedType === 'movie' ? 'movie' : undefined;
    const useTMDB = !!process.env.TMDB_API_KEY;

    const localMovie = await prisma.movie.findFirst({
      where: Number.isFinite(Number(id))
        ? {
            OR: [
              { id },
              { tmdbId: Number(id) },
            ],
          }
        : { id },
    });

    if (localMovie) {
      const hydrated = await hydrateStoredMovie(localMovie);
      return res.json({
        ...hydrated,
        trailerUrl: hydrated.trailerUrl || null,
        streamingPlatforms: hydrated.streamingPlatforms || [],
      });
    }

    if (useTMDB) {
      const maybeTmdbId = Number(id);

      if (Number.isFinite(maybeTmdbId)) {
        const details = await fetchMovieDetails(maybeTmdbId, preferredMediaPath);
        return res.json(serializeTmdbDetail(details));
      }

      return res.status(404).json({ error: 'Movie not found' });
    }

    return res.status(404).json({ error: 'Movie not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

// Admin/import endpoint - fetch movies from TMDB and upsert into DB
router.post('/import', async (req, res) => {
  try {
    const { tmdbIds } = req.body;

    if (!Array.isArray(tmdbIds) || tmdbIds.length === 0) {
      return res.status(400).json({ error: 'tmdbIds array is required' });
    }

    const results: any[] = [];

    for (const id of tmdbIds) {
      try {
        const details = await fetchMovieDetails(Number(id));

        const upserted = await prisma.movie.upsert({
          where: { tmdbId: details.tmdbId },
          update: {
            title: details.title,
            description: details.description,
            releaseDate: details.releaseDate,
            type: details.type,
            genres: JSON.stringify(details.genres || []),
            director: details.director,
            cast: JSON.stringify(details.cast || []),
            poster: details.poster,
            backdrop: details.backdrop,
            runtime: details.runtime,
            rating: details.rating,
          },
          create: {
            tmdbId: details.tmdbId,
            title: details.title,
            description: details.description,
            releaseDate: details.releaseDate,
            type: details.type,
            genres: JSON.stringify(details.genres || []),
            director: details.director,
            cast: JSON.stringify(details.cast || []),
            poster: details.poster,
            backdrop: details.backdrop,
            runtime: details.runtime,
            rating: details.rating,
          },
        });

        results.push({ tmdbId: id, success: true, movieId: upserted.id });
      } catch (err) {
        results.push({ tmdbId: id, success: false, error: String(err) });
      }
    }

    res.json({ imported: results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import movies' });
  }
});

// Bulk import popular/discover pages from TMDB (admin only)
router.post('/import/popular', adminMiddleware, async (req, res) => {
  try {
    const fromPage = parseInt(req.body.fromPage) || 1;
    const toPage = parseInt(req.body.toPage) || Math.max(1, fromPage + 4); // default 5 pages

    const imported: any[] = [];
    for (let p = fromPage; p <= toPage; p++) {
      try {
        const pageData = await discoverMovies(p);
        const results = pageData.results || [];

        for (const m of results) {
          try {
            // Fetch full details (with credits) to get cast/director
            const details = await fetchMovieDetails(m.id);

            const upserted = await prisma.movie.upsert({
              where: { tmdbId: details.tmdbId },
              update: {
                title: details.title,
                description: details.description,
                releaseDate: details.releaseDate,
                type: details.type,
                genres: JSON.stringify(details.genres || []),
                director: details.director,
                cast: JSON.stringify(details.cast || []),
                poster: details.poster,
                backdrop: details.backdrop,
                runtime: details.runtime,
                rating: details.rating,
              },
              create: {
                tmdbId: details.tmdbId,
                title: details.title,
                description: details.description,
                releaseDate: details.releaseDate,
                type: details.type,
                genres: JSON.stringify(details.genres || []),
                director: details.director,
                cast: JSON.stringify(details.cast || []),
                poster: details.poster,
                backdrop: details.backdrop,
                runtime: details.runtime,
                rating: details.rating,
              },
            });

            imported.push({ tmdbId: details.tmdbId, movieId: upserted.id, success: true });
          } catch (e) {
            imported.push({ tmdbId: m.id, success: false, error: String(e) });
          }
        }
        // small delay to avoid hitting rate limits
        await new Promise((r) => setTimeout(r, 200));
      } catch (pageErr) {
        imported.push({ page: p, success: false, error: String(pageErr) });
      }
    }

    res.json({ imported, pages: { fromPage, toPage } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Bulk import failed' });
  }
});

export default router;

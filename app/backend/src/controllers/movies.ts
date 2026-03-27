import express from 'express';
import { PrismaClient } from '@prisma/client';
import { readTokenMiddleware } from '../middleware/index.js';
import {
  fetchMovieDetails,
  searchTMDB,
  getTrendingMovies,
  getNewReleases,
  discoverMovies,
  discoverByGenreName,
} from '../services/tmdb.js';
import { adminMiddleware } from '../middleware/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all movies with pagination (supports TMDB when configured)
router.get('/', readTokenMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const useTMDB = !!process.env.TMDB_API_KEY;
    if (useTMDB) {
      // TMDB pagination: 20 items per page by default
      const tmdbPage = Math.max(1, Math.ceil((page * limit) / 20));
      const data = await discoverMovies(tmdbPage);
      const results = data.results || [];

      // Fetch full details (including providers) for each result to include streamingPlatforms
      const detailed = await Promise.all(
        results.slice(0, limit).map(async (m: any) => {
          try {
            const d = await fetchMovieDetails(m.id);
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
            };
          } catch (e) {
            return {
              id: String(m.id),
              tmdbId: m.id,
              title: m.title || m.original_title,
              description: m.overview || '',
              releaseDate: m.release_date ? new Date(m.release_date) : null,
              type: 'movie',
              genres: (m.genre_ids || []).map((id: number) => id),
              director: null,
              cast: [],
              poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
              backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : '',
              runtime: null,
              rating: m.vote_average || 0,
              streamingPlatforms: [],
              trailerUrl: null,
            };
          }
        })
      );

      return res.json(detailed);
    }

    const skip = (page - 1) * limit;

    const movies = await prisma.movie.findMany({
      skip,
      take: limit,
      orderBy: { rating: 'desc' },
    });

    res.json(
      movies.map((movie) => ({
        ...movie,
        genres: JSON.parse(movie.genres),
        cast: JSON.parse(movie.cast),
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// Get trending movies
router.get('/trending', readTokenMiddleware, async (req, res) => {
  try {
    const useTMDB = !!process.env.TMDB_API_KEY;
    if (useTMDB) {
      const data = await getTrendingMovies('week');
      const results = data.results || [];

      const detailed = await Promise.all(
        results.slice(0, 10).map(async (m: any) => {
          try {
            const d = await fetchMovieDetails(m.id);
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
            };
          } catch (e) {
            return {
              id: String(m.id),
              tmdbId: m.id,
              title: m.title || m.original_title,
              description: m.overview || '',
              releaseDate: m.release_date ? new Date(m.release_date) : null,
              type: 'movie',
              genres: (m.genre_ids || []).map((id: number) => id),
              director: null,
              cast: [],
              poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
              backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : '',
              runtime: null,
              rating: m.vote_average || 0,
              streamingPlatforms: [],
              trailerUrl: null,
            };
          }
        })
      );

      return res.json(detailed);
    }

    const movies = await prisma.movie.findMany({
      orderBy: { rating: 'desc' },
      take: 10,
    });

    res.json(
      movies.map((movie) => ({
        ...movie,
        genres: JSON.parse(movie.genres),
        cast: JSON.parse(movie.cast),
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

// Get new releases
router.get('/new', readTokenMiddleware, async (req, res) => {
  try {
    const useTMDB = !!process.env.TMDB_API_KEY;
    if (useTMDB) {
      const data = await getNewReleases();
      const results = data.results || [];

      const detailed = await Promise.all(
        results.slice(0, 10).map(async (m: any) => {
          try {
            const d = await fetchMovieDetails(m.id);
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
            };
          } catch (e) {
            return {
              id: String(m.id),
              tmdbId: m.id,
              title: m.title || m.original_title,
              description: m.overview || '',
              releaseDate: m.release_date ? new Date(m.release_date) : null,
              type: 'movie',
              genres: (m.genre_ids || []).map((id: number) => id),
              director: null,
              cast: [],
              poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
              backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : '',
              runtime: null,
              rating: m.vote_average || 0,
              streamingPlatforms: [],
              trailerUrl: null,
            };
          }
        })
      );

      return res.json(detailed);
    }

    const movies = await prisma.movie.findMany({
      orderBy: { releaseDate: 'desc' },
      take: 10,
    });

    res.json(
      movies.map((movie) => ({
        ...movie,
        genres: JSON.parse(movie.genres),
        cast: JSON.parse(movie.cast),
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch new releases' });
  }
});

// Get movies by genre
router.get('/genre/:genre', readTokenMiddleware, async (req, res) => {
  try {
    const { genre } = req.params;
    const useTMDB = !!process.env.TMDB_API_KEY;
    if (useTMDB) {
      const data = await discoverByGenreName(genre);
      const results = data.results || [];

      const detailed = await Promise.all(
        results.slice(0, 20).map(async (m: any) => {
          try {
            const d = await fetchMovieDetails(m.id);
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
            };
          } catch (e) {
            return {
              id: String(m.id),
              tmdbId: m.id,
              title: m.title || m.original_title,
              description: m.overview || '',
              releaseDate: m.release_date ? new Date(m.release_date) : null,
              type: 'movie',
              genres: (m.genre_ids || []).map((id: number) => id),
              director: null,
              cast: [],
              poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
              backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : '',
              runtime: null,
              rating: m.vote_average || 0,
              streamingPlatforms: [],
              trailerUrl: null,
            };
          }
        })
      );

      return res.json(detailed);
    }

    const movies = await prisma.movie.findMany({
      where: {
        genres: {
          contains: genre,
        },
      },
      take: 20,
    });

    res.json(
      movies.map((movie) => ({
        ...movie,
        genres: JSON.parse(movie.genres),
        cast: JSON.parse(movie.cast),
      }))
    );
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

    const useTMDB = !!process.env.TMDB_API_KEY;
    if (useTMDB) {
      const data = await searchTMDB(String(q));
      const results = data.results || [];

      const detailed = await Promise.all(
        results.slice(0, 20).map(async (m: any) => {
          try {
            const d = await fetchMovieDetails(m.id);
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
            };
          } catch (e) {
            return {
              id: String(m.id),
              tmdbId: m.id,
              title: m.title || m.original_title,
              description: m.overview || '',
              releaseDate: m.release_date ? new Date(m.release_date) : null,
              type: 'movie',
              genres: (m.genre_ids || []).map((id: number) => id),
              director: null,
              cast: [],
              poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
              backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : '',
              runtime: null,
              rating: m.vote_average || 0,
              streamingPlatforms: [],
              trailerUrl: null,
            };
          }
        })
      );

      return res.json(detailed);
    }

    const movies = await prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: q as string } },
          { description: { contains: q as string } },
        ],
      },
      take: 20,
    });

    res.json(
      movies.map((movie) => ({
        ...movie,
        genres: JSON.parse(movie.genres),
        cast: JSON.parse(movie.cast),
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// Get single movie by ID
router.get('/:id', readTokenMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const useTMDB = !!process.env.TMDB_API_KEY;

    if (useTMDB) {
      const maybeTmdbId = Number(id);

      if (Number.isFinite(maybeTmdbId)) {
        const details = await fetchMovieDetails(maybeTmdbId);
        return res.json({
          id: String(details.tmdbId),
          tmdbId: details.tmdbId,
          title: details.title,
          description: details.description,
          releaseDate: details.releaseDate,
          type: details.type,
          genres: details.genres,
          director: details.director,
          cast: details.cast,
          poster: details.poster,
          backdrop: details.backdrop,
          runtime: details.runtime,
          rating: details.rating,
          streamingPlatforms: details.streamingPlatforms || [],
          trailerUrl: details.trailerUrl || null,
        });
      }

      const localMovie = await prisma.movie.findUnique({ where: { id } });
      if (!localMovie) {
        return res.status(404).json({ error: 'Movie not found' });
      }

      if (localMovie.tmdbId) {
        const details = await fetchMovieDetails(localMovie.tmdbId);
        return res.json({
          ...localMovie,
          genres: JSON.parse(localMovie.genres),
          cast: JSON.parse(localMovie.cast),
          streamingPlatforms: details.streamingPlatforms || [],
          trailerUrl: details.trailerUrl || null,
        });
      }

      return res.json({
        ...localMovie,
        genres: JSON.parse(localMovie.genres),
        cast: JSON.parse(localMovie.cast),
        streamingPlatforms: [],
        trailerUrl: null,
      });
    }

    const movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({
      ...movie,
      genres: JSON.parse(movie.genres),
      cast: JSON.parse(movie.cast),
      trailerUrl: null,
    });
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

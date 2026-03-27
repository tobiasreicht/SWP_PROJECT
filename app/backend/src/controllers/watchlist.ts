import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth.js';
import { fetchMovieDetails } from '../services/tmdb.js';

const router = express.Router();
const prisma = new PrismaClient();

const allowedPriorities = ['high', 'medium', 'low'];
const allowedStatuses = ['planned', 'watching', 'watched'];

const isStatusSchemaMismatchError = (error: unknown) => {
  const message = String((error as any)?.message || '');
  return (
    message.includes('Unknown argument `status`') ||
    message.includes('has no column named status') ||
    message.includes('no such column: status')
  );
};

const parseMovieData = (item: any) => ({
  ...item,
  status: item.status || 'planned',
  movie: {
    ...item.movie,
    genres: JSON.parse(item.movie.genres),
    cast: JSON.parse(item.movie.cast),
  },
});

const resolveMovieId = async (movieIdInput: string) => {
  const direct = await prisma.movie.findUnique({ where: { id: movieIdInput } });
  if (direct) {
    return direct.id;
  }

  const tmdbId = Number(movieIdInput);
  if (!Number.isFinite(tmdbId)) {
    return null;
  }

  const existingByTmdb = await prisma.movie.findUnique({ where: { tmdbId } });
  if (existingByTmdb) {
    return existingByTmdb.id;
  }

  if (!process.env.TMDB_API_KEY) {
    return null;
  }

  const details = await fetchMovieDetails(tmdbId);

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

  return upserted.id;
};

// Add to watchlist
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { movieId, priority, notes, status } = req.body;
    const resolvedMovieId = await resolveMovieId(movieId);

    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (!resolvedMovieId) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Check if already in watchlist
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_movieId: {
          userId: req.userId,
          movieId: resolvedMovieId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already in watchlist' });
    }

    // Create watchlist item
    let item;
    try {
      item = await prisma.watchlistItem.create({
        data: {
          userId: req.userId,
          movieId: resolvedMovieId,
          priority: priority || 'medium',
          status: status || 'planned',
          notes,
        },
        include: {
          movie: true,
        },
      });
    } catch (createError) {
      if (!isStatusSchemaMismatchError(createError)) {
        throw createError;
      }

      item = await prisma.watchlistItem.create({
        data: {
          userId: req.userId,
          movieId: resolvedMovieId,
          priority: priority || 'medium',
          notes,
        },
        include: {
          movie: true,
        },
      });
    }

    res.json({
      ...item,
      movie: {
        ...item.movie,
        genres: JSON.parse(item.movie.genres),
        cast: JSON.parse(item.movie.cast),
      },
    });
  } catch (error) {
    console.error('Watchlist add failed:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// Get user watchlist
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const sortBy = String(req.query.sortBy || 'addedAt');
    const sortOrder = String(req.query.sortOrder || 'desc') === 'asc' ? 'asc' : 'desc';

    const items = await prisma.watchlistItem.findMany({
      where: { userId: req.userId },
      include: {
        movie: true,
      },
      orderBy: sortBy === 'priority' ? { addedAt: 'desc' } : { addedAt: sortOrder },
    });

    const withMovieData = items.map(parseMovieData);

    const priorityWeight: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    if (sortBy === 'priority') {
      withMovieData.sort((first: any, second: any) => {
        const diff = priorityWeight[second.priority] - priorityWeight[first.priority];
        if (diff !== 0) {
          return sortOrder === 'asc' ? -diff : diff;
        }

        const firstDate = new Date(first.addedAt).getTime();
        const secondDate = new Date(second.addedAt).getTime();
        return secondDate - firstDate;
      });
    }

    res.json(withMovieData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// Get watchlist count summary
router.get('/count', authMiddleware, async (req: any, res) => {
  try {
    const [total, high, medium, low] = await Promise.all([
      prisma.watchlistItem.count({ where: { userId: req.userId } }),
      prisma.watchlistItem.count({ where: { userId: req.userId, priority: 'high' } }),
      prisma.watchlistItem.count({ where: { userId: req.userId, priority: 'medium' } }),
      prisma.watchlistItem.count({ where: { userId: req.userId, priority: 'low' } }),
    ]);

    res.json({ total, high, medium, low });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watchlist count' });
  }
});

// Update watchlist item
router.patch('/:movieId', authMiddleware, async (req: any, res) => {
  try {
    const { movieId } = req.params;
    const { priority, notes, status } = req.body;

    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_movieId: {
          userId: req.userId,
          movieId,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    let updated;
    try {
      updated = await prisma.watchlistItem.update({
        where: {
          userId_movieId: {
            userId: req.userId,
            movieId,
          },
        },
        data: {
          ...(priority ? { priority } : {}),
          ...(status ? { status } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
        include: {
          movie: true,
        },
      });
    } catch (updateError) {
      if (!isStatusSchemaMismatchError(updateError)) {
        throw updateError;
      }

      updated = await prisma.watchlistItem.update({
        where: {
          userId_movieId: {
            userId: req.userId,
            movieId,
          },
        },
        data: {
          ...(priority ? { priority } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
        include: {
          movie: true,
        },
      });
    }

    res.json(parseMovieData(updated));
  } catch (error) {
    console.error('Watchlist update failed:', error);
    res.status(500).json({ error: 'Failed to update watchlist item' });
  }
});

// Remove from watchlist
router.delete('/:movieId', authMiddleware, async (req: any, res) => {
  try {
    const { movieId } = req.params;

    await prisma.watchlistItem.deleteMany({
      where: {
        userId: req.userId,
        movieId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

export default router;

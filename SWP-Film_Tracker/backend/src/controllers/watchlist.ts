import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Add to watchlist
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { movieId, priority, notes } = req.body;

    // Check if movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Check if already in watchlist
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_movieId: {
          userId: req.userId,
          movieId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already in watchlist' });
    }

    // Create watchlist item
    const item = await prisma.watchlistItem.create({
      data: {
        userId: req.userId,
        movieId,
        priority: priority || 'medium',
        notes,
      },
      include: {
        movie: true,
      },
    });

    res.json({
      ...item,
      movie: {
        ...item.movie,
        genres: JSON.parse(item.movie.genres),
        cast: JSON.parse(item.movie.cast),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// Get user watchlist
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const items = await prisma.watchlistItem.findMany({
      where: { userId: req.userId },
      include: {
        movie: true,
      },
      orderBy: { addedAt: 'desc' },
    });

    res.json(
      items.map((item) => ({
        ...item,
        movie: {
          ...item.movie,
          genres: JSON.parse(item.movie.genres),
          cast: JSON.parse(item.movie.cast),
        },
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
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

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create or update rating
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { movieId, rating, review, watchedDate, isFavorite } = req.body;

    // Check if movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Upsert rating
    const ratingRecord = await prisma.rating.upsert({
      where: {
        userId_movieId: {
          userId: req.userId,
          movieId,
        },
      },
      create: {
        userId: req.userId,
        movieId,
        rating,
        review,
        watchedDate: watchedDate ? new Date(watchedDate) : null,
        isFavorite: isFavorite || false,
      },
      update: {
        rating,
        review,
        watchedDate: watchedDate ? new Date(watchedDate) : null,
        isFavorite: isFavorite || false,
      },
    });

    res.json(ratingRecord);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create rating' });
  }
});

// Get user ratings
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { userId: req.userId },
      include: {
        movie: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      ratings.map((r) => ({
        ...r,
        movie: {
          ...r.movie,
          genres: JSON.parse(r.movie.genres),
          cast: JSON.parse(r.movie.cast),
        },
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Get user's favorite movies
router.get('/favorites', authMiddleware, async (req: any, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: {
        userId: req.userId,
        isFavorite: true,
      },
      include: {
        movie: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      ratings.map((r) => ({
        ...r,
        movie: {
          ...r.movie,
          genres: JSON.parse(r.movie.genres),
          cast: JSON.parse(r.movie.cast),
        },
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Delete rating
router.delete('/:movieId', authMiddleware, async (req: any, res) => {
  try {
    const { movieId } = req.params;

    await prisma.rating.deleteMany({
      where: {
        userId: req.userId,
        movieId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete rating' });
  }
});

export default router;

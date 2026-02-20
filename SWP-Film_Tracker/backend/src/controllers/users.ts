import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get user statistics
router.get('/:userId/statistics', async (req, res) => {
  try {
    const { userId } = req.params;

    const ratings = await prisma.rating.findMany({
      where: { userId },
    });

    const movies = await prisma.movie.findMany({
      where: {
        ratings: {
          some: {
            userId,
          },
        },
      },
    });

    const totalMoviesWatched = ratings.length;
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    // Genre distribution
    const genreMap: Record<string, number> = {};
    movies.forEach((movie) => {
      const genres = JSON.parse(movie.genres);
      genres.forEach((genre: string) => {
        genreMap[genre] = (genreMap[genre] || 0) + 1;
      });
    });

    res.json({
      totalMoviesWatched,
      averageRating: Math.round(averageRating * 10) / 10,
      favoriteGenres: Object.entries(genreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre),
      genreDistribution: genreMap,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Update user profile (requires auth)
router.put('/:userId', authMiddleware, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { displayName, bio, avatar } = req.body;

    // Only allow user to update their own profile
    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName,
        bio,
        avatar,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;

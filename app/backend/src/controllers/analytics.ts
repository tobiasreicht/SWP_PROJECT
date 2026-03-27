import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const safeJsonParse = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const getStreakDays = (dates: Date[]) => {
  if (dates.length === 0) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(dates.map((date) => new Date(date).toISOString().slice(0, 10)))
  )
    .sort()
    .reverse();

  let streak = 0;
  let cursor = new Date();

  while (true) {
    const day = cursor.toISOString().slice(0, 10);
    if (!uniqueDays.includes(day)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

router.get('/dashboard', authMiddleware, async (req: any, res) => {
  try {
    const [ratings, watchlistItems, friendCount] = await Promise.all([
      prisma.rating.findMany({
        where: { userId: req.userId },
        include: { movie: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.watchlistItem.count({ where: { userId: req.userId } }),
      prisma.friend.count({
        where: {
          status: 'accepted',
          OR: [{ userId: req.userId }, { friendId: req.userId }],
        },
      }),
    ]);

    const totalMoviesWatched = ratings.length;
    const averageRating =
      ratings.length > 0
        ? Number((ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length).toFixed(1))
        : 0;

    const genreDistribution: Record<string, number> = {};
    ratings.forEach((item) => {
      const genres = safeJsonParse<string[]>(item.movie.genres, []);
      genres.forEach((genre) => {
        genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
      });
    });

    const favoriteGenres = Object.entries(genreDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    const monthlyMap: Record<string, { month: string; count: number; ratingTotal: number }> = {};
    ratings.forEach((item) => {
      const date = new Date(item.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = date.toLocaleString('default', { month: 'short' });

      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: monthLabel, count: 0, ratingTotal: 0 };
      }

      monthlyMap[key].count += 1;
      monthlyMap[key].ratingTotal += item.rating;
    });

    const monthlyStats = Object.entries(monthlyMap)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-12)
      .map(([, value]) => ({
        month: value.month,
        count: value.count,
        averageRating: Number((value.ratingTotal / value.count).toFixed(1)),
      }));

    const streakDays = getStreakDays(
      ratings.map((item) => (item.watchedDate ? item.watchedDate : item.createdAt))
    );

    const achievements = [
      totalMoviesWatched >= 1 ? 'First Watch' : null,
      totalMoviesWatched >= 10 ? 'Movie Explorer' : null,
      totalMoviesWatched >= 25 ? 'Cinephile' : null,
      averageRating >= 8 ? 'Critic Choice' : null,
      friendCount >= 3 ? 'Social Starter' : null,
      watchlistItems >= 10 ? 'Wishlist Planner' : null,
      streakDays >= 3 ? 'On a Roll' : null,
    ].filter(Boolean);

    res.json({
      totalMoviesWatched,
      averageRating,
      favoriteGenres,
      genreDistribution,
      monthlyStats,
      streakDays,
      watchlistCount: watchlistItems,
      friendsCount: friendCount,
      achievements,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

router.get('/genres', authMiddleware, async (req: any, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { userId: req.userId },
      include: { movie: true },
    });

    const distribution: Record<string, number> = {};

    ratings.forEach((item) => {
      const genres = safeJsonParse<string[]>(item.movie.genres, []);
      genres.forEach((genre) => {
        distribution[genre] = (distribution[genre] || 0) + 1;
      });
    });

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch genre distribution' });
  }
});

router.get('/monthly', authMiddleware, async (req: any, res) => {
  try {
    const months = Math.max(1, Number(req.query.months || 12));

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const ratings = await prisma.rating.findMany({
      where: {
        userId: req.userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyMap: Record<string, { month: string; count: number; ratingTotal: number }> = {};

    for (let index = 0; index < months; index += 1) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + index);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      monthlyMap[key] = {
        month: date.toLocaleString('default', { month: 'short' }),
        count: 0,
        ratingTotal: 0,
      };
    }

    ratings.forEach((item) => {
      const date = new Date(item.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: date.toLocaleString('default', { month: 'short' }),
          count: 0,
          ratingTotal: 0,
        };
      }

      monthlyMap[key].count += 1;
      monthlyMap[key].ratingTotal += item.rating;
    });

    const result = Object.entries(monthlyMap)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([, value]) => ({
        month: value.month,
        count: value.count,
        averageRating: value.count ? Number((value.ratingTotal / value.count).toFixed(1)) : 0,
      }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly stats' });
  }
});

export default router;

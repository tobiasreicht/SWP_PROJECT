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

const getFavoriteGenres = async (userId: string): Promise<string[]> => {
  const ratings = await prisma.rating.findMany({
    where: { userId, rating: { gte: 7 } },
    include: { movie: true },
  });

  const genresMap: Record<string, number> = {};
  ratings.forEach((item) => {
    const genres = safeJsonParse<string[]>(item.movie.genres, []);
    genres.forEach((genre) => {
      genresMap[genre] = (genresMap[genre] || 0) + 1;
    });
  });

  return Object.entries(genresMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([genre]) => genre);
};

const getTasteMatch = async (userId: string, friendId: string) => {
  const [userRatings, friendRatings] = await Promise.all([
    prisma.rating.findMany({ where: { userId } }),
    prisma.rating.findMany({ where: { userId: friendId } }),
  ]);

  const userMap = new Map(userRatings.map((r) => [r.movieId, r.rating]));
  const common = friendRatings.filter((r) => userMap.has(r.movieId));

  if (common.length === 0) {
    return { tasteMatch: 0, commonMovies: 0 };
  }

  const avgDiff =
    common.reduce((sum, r) => sum + Math.abs((userMap.get(r.movieId) || 0) - r.rating), 0) /
    common.length;

  return {
    tasteMatch: Math.max(0, Math.round(100 - avgDiff * 10)),
    commonMovies: common.length,
  };
};

router.get('/personal', authMiddleware, async (req: any, res) => {
  try {
    const limit = Math.max(1, Number(req.query.limit || 10));

    const [rated, watchlist] = await Promise.all([
      prisma.rating.findMany({ where: { userId: req.userId }, select: { movieId: true } }),
      prisma.watchlistItem.findMany({ where: { userId: req.userId }, select: { movieId: true } }),
    ]);

    const excludedIds = new Set([...rated.map((r) => r.movieId), ...watchlist.map((w) => w.movieId)]);
    const favoriteGenres = await getFavoriteGenres(req.userId);

    const movies = await prisma.movie.findMany({
      orderBy: [{ rating: 'desc' }, { releaseDate: 'desc' }],
      take: 100,
    });

    const recommendations = movies
      .filter((movie) => !excludedIds.has(movie.id))
      .map((movie) => {
        const genres = safeJsonParse<string[]>(movie.genres, []);
        const genreScore = genres.filter((genre) => favoriteGenres.includes(genre)).length;
        return {
          movieId: movie.id,
          title: movie.title,
          poster: movie.poster,
          score: movie.rating + genreScore * 0.7,
          reason:
            genreScore > 0
              ? `Matches your favorite genres: ${genres
                  .filter((genre) => favoriteGenres.includes(genre))
                  .join(', ')}`
              : 'Highly rated by community',
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch personal recommendations' });
  }
});

router.get('/taste-match/:friendId', authMiddleware, async (req: any, res) => {
  try {
    const { friendId } = req.params;
    const result = await getTasteMatch(req.userId, friendId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate taste match' });
  }
});

router.get('/joint/:friendId', authMiddleware, async (req: any, res) => {
  try {
    const { friendId } = req.params;

    const [myRated, friendRated] = await Promise.all([
      prisma.rating.findMany({ where: { userId: req.userId }, select: { movieId: true } }),
      prisma.rating.findMany({ where: { userId: friendId }, select: { movieId: true } }),
    ]);

    const excluded = new Set([...myRated.map((r) => r.movieId), ...friendRated.map((r) => r.movieId)]);

    const [myGenres, friendGenres, friendFavorites] = await Promise.all([
      getFavoriteGenres(req.userId),
      getFavoriteGenres(friendId),
      prisma.rating.findMany({
        where: { userId: friendId, rating: { gte: 8 } },
        include: { movie: true },
        take: 50,
      }),
    ]);

    const overlapGenres = [...new Set(myGenres.filter((genre) => friendGenres.includes(genre)))];

    const recommendations = friendFavorites
      .map((item) => item.movie)
      .filter((movie) => !excluded.has(movie.id))
      .map((movie) => {
        const genres = safeJsonParse<string[]>(movie.genres, []);
        const overlap = genres.filter((genre) => overlapGenres.includes(genre)).length;
        const compatibilityScore = Math.min(99, Math.round(movie.rating * 10 + overlap * 8));

        return {
          movieId: movie.id,
          title: movie.title,
          poster: movie.poster,
          compatibilityScore,
          mutualRaters: 1,
        };
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 8);

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch joint recommendations' });
  }
});

router.get('/friends', authMiddleware, async (req: any, res) => {
  try {
    const friendRelations = await prisma.friend.findMany({
      where: {
        status: 'accepted',
        OR: [{ userId: req.userId }, { friendId: req.userId }],
      },
    });

    const friendIds = friendRelations.map((relation) =>
      relation.userId === req.userId ? relation.friendId : relation.userId
    );

    if (friendIds.length === 0) {
      return res.json([]);
    }

    const [rated, watchlist] = await Promise.all([
      prisma.rating.findMany({ where: { userId: req.userId }, select: { movieId: true } }),
      prisma.watchlistItem.findMany({ where: { userId: req.userId }, select: { movieId: true } }),
    ]);

    const excluded = new Set([...rated.map((r) => r.movieId), ...watchlist.map((w) => w.movieId)]);

    const friendRatings = await prisma.rating.findMany({
      where: {
        userId: { in: friendIds },
        rating: { gte: 8 },
      },
      include: {
        movie: true,
        user: { select: { username: true, displayName: true } },
      },
      take: 100,
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    });

    const deduped = new Map<string, any>();
    for (const item of friendRatings) {
      if (excluded.has(item.movieId) || deduped.has(item.movieId)) {
        continue;
      }

      deduped.set(item.movieId, {
        movieId: item.movieId,
        title: item.movie.title,
        poster: item.movie.poster,
        reason: `${item.user.displayName || item.user.username} rated this ${item.rating}/10`,
        score: item.rating,
      });
    }

    res.json(Array.from(deduped.values()).slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch friends recommendations' });
  }
});

export default router;

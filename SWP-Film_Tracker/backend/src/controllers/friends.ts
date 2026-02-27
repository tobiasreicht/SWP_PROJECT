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

  const tasteMatch = Math.max(0, Math.round(100 - avgDiff * 10));
  return { tasteMatch, commonMovies: common.length };
};

router.post('/add', authMiddleware, async (req: any, res) => {
  try {
    const { friendId, identifier } = req.body as { friendId?: string; identifier?: string };

    const target = friendId
      ? await prisma.user.findUnique({ where: { id: friendId } })
      : identifier
      ? await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }, { id: identifier }],
          },
        })
      : null;

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (target.id === req.userId) {
      return res.status(400).json({ error: 'You cannot add yourself' });
    }

    const existing = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: req.userId,
          friendId: target.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: `Request already ${existing.status}` });
    }

    const relation = await prisma.friend.create({
      data: {
        userId: req.userId,
        friendId: target.id,
        status: 'pending',
      },
      include: {
        friend: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    res.json({
      id: relation.id,
      status: relation.status,
      friend: relation.friend,
      message: 'Friend request sent',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

router.get('/search', authMiddleware, async (req: any, res) => {
  try {
    const query = String(req.query.q || '').trim();

    if (!query) {
      return res.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.userId },
        OR: [
          { displayName: { contains: query } },
          { username: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        email: true,
        avatar: true,
      },
      take: 20,
    });

    const relations = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: req.userId, friendId: { in: users.map((user) => user.id) } },
          { friendId: req.userId, userId: { in: users.map((user) => user.id) } },
        ],
      },
      select: {
        userId: true,
        friendId: true,
        status: true,
      },
    });

    const relationMap = new Map<string, string>();
    relations.forEach((relation) => {
      const otherId = relation.userId === req.userId ? relation.friendId : relation.userId;
      relationMap.set(otherId, relation.status);
    });

    res.json(
      users.map((user) => ({
        id: user.id,
        name: user.displayName || user.username,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        relationStatus: relationMap.get(user.id) || 'none',
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to search users' });
  }
});

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const relations = await prisma.friend.findMany({
      where: {
        status: 'accepted',
        OR: [{ userId: req.userId }, { friendId: req.userId }],
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        friend: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const friends = await Promise.all(
      relations.map(async (relation) => {
        const isDirect = relation.userId === req.userId;
        const friend = isDirect ? relation.friend : relation.user;
        const stats = await getTasteMatch(req.userId, friend.id);

        return {
          id: friend.id,
          relationId: relation.id,
          name: friend.displayName || friend.username,
          username: friend.username,
          avatar: friend.avatar,
          ...stats,
          status: relation.status,
        };
      })
    );

    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

router.get('/requests', authMiddleware, async (req: any, res) => {
  try {
    const requests = await prisma.friend.findMany({
      where: {
        friendId: req.userId,
        status: 'pending',
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      requests.map((request) => ({
        id: request.id,
        userId: request.user.id,
        name: request.user.displayName || request.user.username,
        username: request.user.username,
        avatar: request.user.avatar,
        status: request.status,
        createdAt: request.createdAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

router.put('/:id/accept', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.friend.findUnique({ where: { id } });

    if (!request || request.friendId !== req.userId || request.status !== 'pending') {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    await prisma.friend.update({
      where: { id },
      data: { status: 'accepted' },
    });

    await prisma.friend.upsert({
      where: {
        userId_friendId: {
          userId: req.userId,
          friendId: request.userId,
        },
      },
      update: { status: 'accepted' },
      create: {
        userId: req.userId,
        friendId: request.userId,
        status: 'accepted',
      },
    });

    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

router.delete('/:friendId', authMiddleware, async (req: any, res) => {
  try {
    const { friendId } = req.params;

    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId: req.userId, friendId },
          { userId: friendId, friendId: req.userId },
        ],
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

router.get('/activity', authMiddleware, async (req: any, res) => {
  try {
    const relations = await prisma.friend.findMany({
      where: {
        status: 'accepted',
        OR: [{ userId: req.userId }, { friendId: req.userId }],
      },
      include: {
        user: true,
        friend: true,
      },
    });

    const friendIds = relations.map((relation) =>
      relation.userId === req.userId ? relation.friendId : relation.userId
    );

    if (friendIds.length === 0) {
      return res.json([]);
    }

    const [friendRatings, friendWatchlist] = await Promise.all([
      prisma.rating.findMany({
        where: { userId: { in: friendIds } },
        include: {
          movie: true,
          user: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.watchlistItem.findMany({
        where: { userId: { in: friendIds } },
        include: {
          movie: true,
          user: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
        orderBy: { addedAt: 'desc' },
        take: 30,
      }),
    ]);

    const ratingActivities = friendRatings.map((item) => ({
      id: `rating-${item.id}`,
      userId: item.user.id,
      username: item.user.displayName || item.user.username,
      avatar: item.user.avatar,
      action: 'rated',
      movieId: item.movieId,
      movieTitle: item.movie.title,
      moviePoster: item.movie.poster,
      rating: item.rating,
      timestamp: item.createdAt,
    }));

    const watchlistActivities = friendWatchlist.map((item) => ({
      id: `watchlist-${item.id}`,
      userId: item.user.id,
      username: item.user.displayName || item.user.username,
      avatar: item.user.avatar,
      action: 'added_to_watchlist',
      movieId: item.movieId,
      movieTitle: item.movie.title,
      moviePoster: item.movie.poster,
      timestamp: item.addedAt,
    }));

    const feed = [...ratingActivities, ...watchlistActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30);

    res.json(feed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

router.get('/common/:friendId', authMiddleware, async (req: any, res) => {
  try {
    const { friendId } = req.params;

    const [myRatings, friendRatings] = await Promise.all([
      prisma.rating.findMany({ where: { userId: req.userId } }),
      prisma.rating.findMany({ where: { userId: friendId } }),
    ]);

    const myMap = new Map(myRatings.map((r) => [r.movieId, r.rating]));
    const commonIds = friendRatings.filter((r) => myMap.has(r.movieId)).map((r) => r.movieId);

    const movies = await prisma.movie.findMany({
      where: { id: { in: commonIds } },
      select: { id: true, title: true, poster: true, genres: true },
    });

    res.json(
      movies.map((movie) => ({
        ...movie,
        genres: safeJsonParse<string[]>(movie.genres, []),
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch common movies' });
  }
});

export default router;

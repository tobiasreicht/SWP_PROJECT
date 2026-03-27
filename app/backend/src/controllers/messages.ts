import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const canMessageFriend = async (userId: string, friendId: string) => {
  const relation = await prisma.friend.findFirst({
    where: {
      status: 'accepted',
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });

  return !!relation;
};

router.get('/inbox', authMiddleware, async (req: any, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const inbox = await prisma.message.findMany({
      where: {
        recipientId: req.userId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      take: 50,
    });

    res.json(
      inbox.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        recipientId: message.recipientId,
        text: message.text,
        movieTmdbId: message.movieTmdbId,
        movieTitle: message.movieTitle,
        moviePoster: message.moviePoster,
        createdAt: message.createdAt,
        readAt: message.readAt,
        sender: {
          id: message.sender.id,
          name: message.sender.displayName || message.sender.username,
          avatar: message.sender.avatar,
        },
      }))
    );
  } catch (error) {
    console.error('GET /messages/inbox failed', error);
    res.status(500).json({ error: 'Failed to load inbox' });
  }
});

router.post('/inbox/read', authMiddleware, async (req: any, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { senderId } = req.body as { senderId?: string };

    const whereClause: any = {
      recipientId: req.userId,
      readAt: null,
    };

    if (senderId) {
      whereClause.senderId = senderId;
    }

    const result = await prisma.message.updateMany({
      where: whereClause,
      data: {
        readAt: new Date(),
      },
    });

    res.json({ success: true, updated: result.count });
  } catch (error) {
    console.error('POST /messages/inbox/read failed', error);
    res.status(500).json({ error: 'Failed to update inbox read status' });
  }
});

router.get('/:friendId', authMiddleware, async (req: any, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { friendId } = req.params;

    if (friendId === req.userId) {
      return res.status(400).json({ error: 'Cannot load messages with yourself' });
    }

    const isAllowed = await canMessageFriend(req.userId, friendId);
    if (!isAllowed) {
      return res.status(403).json({ error: 'You can only message accepted friends' });
    }

    await prisma.message.updateMany({
      where: {
        senderId: friendId,
        recipientId: req.userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.userId, recipientId: friendId },
          { senderId: friendId, recipientId: req.userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      take: 200,
    });

    res.json(
      messages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        recipientId: message.recipientId,
        text: message.text,
        movieTmdbId: message.movieTmdbId,
        movieTitle: message.movieTitle,
        moviePoster: message.moviePoster,
        createdAt: message.createdAt,
        readAt: message.readAt,
        sender: {
          id: message.sender.id,
          name: message.sender.displayName || message.sender.username,
          avatar: message.sender.avatar,
        },
      }))
    );
  } catch (error) {
    console.error('GET /messages/:friendId failed', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/:friendId', authMiddleware, async (req: any, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { friendId } = req.params;
    const { text, movieTmdbId, movieTitle, moviePoster } = req.body as {
      text?: string;
      movieTmdbId?: number;
      movieTitle?: string;
      moviePoster?: string;
    };

    const normalizedText = String(text || '').trim();
    const normalizedMovieTitle = String(movieTitle || '').trim();

    if (!normalizedText && !normalizedMovieTitle) {
      return res.status(400).json({ error: 'Message text or a movie is required' });
    }

    if (friendId === req.userId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    const isAllowed = await canMessageFriend(req.userId, friendId);
    if (!isAllowed) {
      return res.status(403).json({ error: 'You can only message accepted friends' });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true },
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const created = await prisma.message.create({
      data: {
        senderId: req.userId,
        recipientId: friendId,
        text: normalizedText || null,
        movieTmdbId: typeof movieTmdbId === 'number' ? movieTmdbId : null,
        movieTitle: normalizedMovieTitle || null,
        moviePoster: moviePoster ? String(moviePoster) : null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      id: created.id,
      senderId: created.senderId,
      recipientId: created.recipientId,
      text: created.text,
      movieTmdbId: created.movieTmdbId,
      movieTitle: created.movieTitle,
      moviePoster: created.moviePoster,
      createdAt: created.createdAt,
      readAt: created.readAt,
      sender: {
        id: created.sender.id,
        name: created.sender.displayName || created.sender.username,
        avatar: created.sender.avatar,
      },
    });
  } catch (error) {
    console.error('POST /messages/:friendId failed', error);

    const prismaCode = (error as any)?.code;
    if (prismaCode === 'P2003') {
      return res.status(400).json({ error: 'Invalid sender or recipient' });
    }

    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;

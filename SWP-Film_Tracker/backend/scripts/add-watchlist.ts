import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { fetchMovieDetails } from '../src/services/tmdb.js';

const prisma = new PrismaClient();

const args = process.argv.slice(2);

const getArg = (name: string) => {
  const index = args.findIndex((arg) => arg === `--${name}`);
  if (index === -1 || index + 1 >= args.length) {
    return undefined;
  }
  return args[index + 1];
};

const safeJson = (value: unknown) => {
  try {
    return JSON.stringify(value || []);
  } catch {
    return '[]';
  }
};

async function resolveMovieId(input: {
  movieId?: string;
  tmdbId?: number;
  title?: string;
}) {
  if (input.movieId) {
    const byId = await prisma.movie.findUnique({ where: { id: input.movieId } });
    if (byId) {
      return byId.id;
    }
  }

  if (input.tmdbId && Number.isFinite(input.tmdbId)) {
    const byTmdb = await prisma.movie.findUnique({ where: { tmdbId: input.tmdbId } });
    if (byTmdb) {
      return byTmdb.id;
    }

    if (process.env.TMDB_API_KEY) {
      const details = await fetchMovieDetails(input.tmdbId);
      const upserted = await prisma.movie.upsert({
        where: { tmdbId: details.tmdbId },
        update: {
          title: details.title,
          description: details.description,
          releaseDate: details.releaseDate,
          type: details.type,
          genres: safeJson(details.genres),
          director: details.director,
          cast: safeJson(details.cast),
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
          genres: safeJson(details.genres),
          director: details.director,
          cast: safeJson(details.cast),
          poster: details.poster,
          backdrop: details.backdrop,
          runtime: details.runtime,
          rating: details.rating,
        },
      });

      return upserted.id;
    }
  }

  if (input.title) {
    const byTitle = await prisma.movie.findFirst({
      where: { title: { contains: input.title } },
      orderBy: { rating: 'desc' },
    });

    if (byTitle) {
      return byTitle.id;
    }
  }

  return null;
}

async function main() {
  const email = getArg('email');
  const username = getArg('username');
  const movieId = getArg('movieId');
  const tmdbIdRaw = getArg('tmdbId');
  const title = getArg('title');
  const priority = (getArg('priority') || 'medium').toLowerCase();
  const notes = getArg('notes');

  if (!email && !username) {
    console.error('Provide --email or --username to identify the user.');
    process.exit(1);
  }

  if (!movieId && !tmdbIdRaw && !title) {
    console.error('Provide one movie selector: --movieId, --tmdbId, or --title.');
    process.exit(1);
  }

  if (!['high', 'medium', 'low'].includes(priority)) {
    console.error('Priority must be one of: high, medium, low.');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(email ? [{ email }] : []),
        ...(username ? [{ username }] : []),
      ],
    },
    select: { id: true, email: true, username: true, displayName: true },
  });

  if (!user) {
    console.error('User not found.');
    process.exit(1);
  }

  const tmdbId = tmdbIdRaw ? Number(tmdbIdRaw) : undefined;
  if (tmdbIdRaw && !Number.isFinite(tmdbId)) {
    console.error('--tmdbId must be a number.');
    process.exit(1);
  }

  const resolvedMovieId = await resolveMovieId({
    movieId,
    tmdbId,
    title,
  });

  if (!resolvedMovieId) {
    console.error('Movie not found and could not be imported.');
    process.exit(1);
  }

  const item = await prisma.watchlistItem.upsert({
    where: {
      userId_movieId: {
        userId: user.id,
        movieId: resolvedMovieId,
      },
    },
    update: {
      priority,
      notes,
    },
    create: {
      userId: user.id,
      movieId: resolvedMovieId,
      priority,
      notes,
    },
    include: {
      movie: {
        select: { id: true, tmdbId: true, title: true },
      },
    },
  });

  console.log('✅ Watchlist item saved successfully');
  console.log({
    user,
    watchlistItem: item,
  });
}

main()
  .catch((error) => {
    console.error('❌ Failed to add watchlist item:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

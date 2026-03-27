import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample movie data - real films with actual details
const movies = [
  {
    tmdbId: 278,
    title: 'The Shawshank Redemption',
    description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
    releaseDate: new Date('1994-10-14'),
    type: 'movie',
    genres: JSON.stringify(['Crime', 'Drama']),
    director: 'Frank Darabont',
    cast: JSON.stringify(['Tim Robbins', 'Morgan Freeman']),
    poster: 'https://m.media-amazon.com/images/M/MV5BMDFlYTk3NTItN2QzMC00MWEwLWE4ZWYtOWI5ZTQ0ZDBlNThjXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BMDFlYTk3NTItN2QzMC00MWEwLWE4ZWYtOWI5ZTQ0ZDBlNThjXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg',
    runtime: 142,
    rating: 9.3,
  },
  {
    tmdbId: 238,
    title: 'The Godfather',
    description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his youngest and reluctant son.',
    releaseDate: new Date('1972-03-24'),
    type: 'movie',
    genres: JSON.stringify(['Crime', 'Drama']),
    director: 'Francis Ford Coppola',
    cast: JSON.stringify(['Marlon Brando', 'Al Pacino', 'James Caan']),
    poster: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNC00MTMyLWFwM2YtN2VmZDY1MTk0ODE0XkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNC00MTMyLWFwM2YtN2VmZDY1MTk0ODE0XkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    runtime: 175,
    rating: 9.2,
  },
  {
    tmdbId: 240,
    title: 'The Godfather Part II',
    description: 'The early life and legend of vicious crime boss Vito Corleone is portrayed, while his youngest son Michael begins to flourish under his dominion.',
    releaseDate: new Date('1974-12-20'),
    type: 'movie',
    genres: JSON.stringify(['Crime', 'Drama']),
    director: 'Francis Ford Coppola',
    cast: JSON.stringify(['Al Pacino', 'Robert Duvall', 'Diane Keaton']),
    poster: 'https://m.media-amazon.com/images/M/MV5BMWMwMGQ5ZDctYjg2Ni00NWE1LWIwZWItMWQ2MWJlNzA4OGUwXkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BMWMwMGQ5ZDctYjg2Ni00NWE1LWIwZWItMWQ2MWJlNzA4OGUwXkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    runtime: 202,
    rating: 9.0,
  },
  {
    tmdbId: 550,
    title: 'Fight Club',
    description: 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into much more.',
    releaseDate: new Date('1999-10-15'),
    type: 'movie',
    genres: JSON.stringify(['Drama', 'Thriller']),
    director: 'David Fincher',
    cast: JSON.stringify(['Brad Pitt', 'Edward Norton', 'Helena Bonham Carter']),
    poster: 'https://m.media-amazon.com/images/M/MV5BMmEzNTA0ZDQtZTVjOC00ZDFkLWE5MjgtMTdlNWY3ZjAxNmU1XkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BMmEzNTA0ZDQtZTVjOC00ZDFkLWE5MjgtMTdlNWY3ZjAxNmU1XkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    runtime: 139,
    rating: 8.8,
  },
  {
    tmdbId: 130,
    title: 'The Girl with the Dragon Tattoo',
    description: 'A journalist and a computer hacker investigate the disappearance of a woman in Sweden.',
    releaseDate: new Date('2009-05-07'),
    type: 'movie',
    genres: JSON.stringify(['Crime', 'Drama', 'Thriller']),
    director: 'David Fincher',
    cast: JSON.stringify(['Rooney Mara', 'Daniel Craig']),
    poster: 'https://m.media-amazon.com/images/M/MV5BMzc2ZWY4MzgtZGE0ZS00ZTMxLWIzMmEtYThhZThjZTNhZWY5XkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BMzc2ZWY4MzgtZGE0ZS00ZTMxLWIzMmEtYThhZThjZTNhZWY5XkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    runtime: 158,
    rating: 8.5,
  },
  {
    tmdbId: 680,
    title: 'Pulp Fiction',
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    releaseDate: new Date('1994-10-14'),
    type: 'movie',
    genres: JSON.stringify(['Crime', 'Drama']),
    director: 'Quentin Tarantino',
    cast: JSON.stringify(['John Travolta', 'Uma Thurman', 'Samuel L. Jackson']),
    poster: 'https://m.media-amazon.com/images/M/MV5BNjQ3NWQwMzAt0ZDYwLWI5ZTUtMzM5Ni00OGYyLWFmNmEtYjAyM2EyODhhMzA2XkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNjQ3NWQwMzAt0ZDYwLWI5ZTUtMzM5Ni00OGYyLWFmNmEtYjAyM2EyODhhMzA2XkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    runtime: 154,
    rating: 8.9,
  },
  {
    tmdbId: 527,
    title: 'Schindler\'s List',
    description: 'In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce.',
    releaseDate: new Date('1993-11-30'),
    type: 'movie',
    genres: JSON.stringify(['Biography', 'Drama', 'History']),
    director: 'Steven Spielberg',
    cast: JSON.stringify(['Liam Neeson', 'Ralph Fiennes', 'Ben Kingsley']),
    poster: 'https://m.media-amazon.com/images/M/MV5BNDE4OTcxNTctNmRhYy00NWE2LTgwNjYtODJmODIyNGU2NzdiXkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNDE4OTcxNTctNmRhYy00NWE2LTgwNjYtODJmODIyNGU2NzdiXkEyXkFqcGdeQXVyNzc4NzQzOTk@._V1_SX300.jpg',
    runtime: 195,
    rating: 8.9,
  },
  {
    tmdbId: 109,
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.',
    releaseDate: new Date('2010-07-16'),
    type: 'movie',
    genres: JSON.stringify(['Action', 'Sci-Fi', 'Thriller']),
    director: 'Christopher Nolan',
    cast: JSON.stringify(['Leonardo DiCaprio', 'Marion Cotillard', 'Ellen Page']),
    poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzc5NzAxNF5BMl5BanBnXkFtZTcwMjI2ODgyMw@@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BMjAxMzc5NzAxNF5BMl5BanBnXkFtZTcwMjI2ODgyMw@@._V1_SX300.jpg',
    runtime: 148,
    rating: 8.8,
  },
  {
    tmdbId: 155,
    title: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest tests.',
    releaseDate: new Date('2008-07-18'),
    type: 'movie',
    genres: JSON.stringify(['Action', 'Crime', 'Drama']),
    director: 'Christopher Nolan',
    cast: JSON.stringify(['Christian Bale', 'Heath Ledger', 'Aaron Eckhart']),
    poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg',
    runtime: 152,
    rating: 9.0,
  },
  {
    tmdbId: 13,
    title: 'Forrest Gump',
    description: 'The presidencies of Kennedy and Johnson, the Vietnam War, and the Watergate scandal unfold from the perspective of an Alabama man.',
    releaseDate: new Date('1994-07-06'),
    type: 'movie',
    genres: JSON.stringify(['Drama', 'Romance']),
    director: 'Robert Zemeckis',
    cast: JSON.stringify(['Tom Hanks', 'Sally Field', 'Gary Sinise']),
    poster: 'https://m.media-amazon.com/images/M/MV5BNWIwODRlYTEtYzA5Ny00ZWY3LWJkZjEtYzAyMDU2ZmM0NDAyXkEyXkFqcGdeQXVyNjU0OTQ0ODE@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNWIwODRlYTEtYzA5Ny00ZWY3LWJkZjEtYzAyMDU2ZmM0NDAyXkEyXkFqcGdeQXVyNjU0OTQ0ODE@._V1_SX300.jpg',
    runtime: 142,
    rating: 8.8,
  },
  {
    tmdbId: 496243,
    title: 'Top Gun: Maverick',
    description: 'After thirty years, Maverick is still pushing the envelope as a test pilot, but won\'t let his student pilots fly beyond their limits.',
    releaseDate: new Date('2022-05-27'),
    type: 'movie',
    genres: JSON.stringify(['Action', 'Drama']),
    director: 'Joseph Kosinski',
    cast: JSON.stringify(['Tom Cruise', 'Miles Teller', 'Jennifer Connelly']),
    poster: 'https://m.media-amazon.com/images/M/MV5BZTkyZWIyM2UtNDc1Yi00YzAyLWI0NTAtMzBlZTMxZTMxODhhXkEyXkFqcGdeQXVyMjkwOTAyMDU@._V1_SX300.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BZTkyZWIyM2UtNDc1Yi00YzAyLWI0NTAtMzBlZTMxZTMxODhhXkEyXkFqcGdeQXVyMjkwOTAyMDU@._V1_SX300.jpg',
    runtime: 131,
    rating: 8.3,
  },
];

async function main() {
  console.log('🌱 Starting to seed database...');

  // Clear existing data
  await prisma.rating.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.friend.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();

  // Create sample user with known demo password
  const demoPassword = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      username: 'demo_user',
      displayName: 'Demo User',
      password: demoPassword,
      bio: 'Movie enthusiast and film critic',
    },
  });

  console.log(`✅ Created sample user: ${user.displayName}`);

  const [friend1, friend2] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alex@example.com',
        username: 'alex_j',
        displayName: 'Alex Johnson',
        password: await bcrypt.hash('demo123', 10),
        bio: 'Sci-fi and thriller fan',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah@example.com',
        username: 'sarah_w',
        displayName: 'Sarah Williams',
        password: await bcrypt.hash('demo123', 10),
        bio: 'Drama lover and weekend binge watcher',
      },
    }),
  ]);

  console.log('✅ Created 2 friend users');

  // Create movies
  const createdMovies = await Promise.all(
    movies.map((movie) =>
      prisma.movie.create({
        data: movie,
      })
    )
  );

  console.log(`✅ Created ${createdMovies.length} movies`);

  // Create sample ratings
  const sampleRatings = createdMovies.slice(0, 5).map((movie) => ({
    userId: user.id,
    movieId: movie.id,
    rating: Math.floor(Math.random() * 5) + 6, // Random rating 6-10
    review: 'Great movie!',
    watchedDate: new Date(),
    isFavorite: Math.random() > 0.5,
  }));

  await Promise.all(
    sampleRatings.map((rating) => prisma.rating.create({ data: rating }))
  );

  console.log(`✅ Created ${sampleRatings.length} sample ratings`);

  // Create sample watchlist items
  const sampleWatchlist = createdMovies.slice(5, 8).map((movie) => ({
    userId: user.id,
    movieId: movie.id,
    priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
    status: ['planned', 'watching', 'watched'][Math.floor(Math.random() * 3)] as any,
    notes: 'Want to watch this soon',
  }));

  await Promise.all(
    sampleWatchlist.map((item) => prisma.watchlistItem.create({ data: item }))
  );

  console.log(`✅ Created ${sampleWatchlist.length} watchlist items`);

  const friendRatings1 = createdMovies.slice(2, 8).map((movie, index) => ({
    userId: friend1.id,
    movieId: movie.id,
    rating: Math.min(10, 7 + (index % 4)),
    review: 'Loved this one!',
    watchedDate: new Date(Date.now() - (index + 2) * 24 * 60 * 60 * 1000),
    isFavorite: index % 2 === 0,
  }));

  const friendRatings2 = createdMovies.slice(1, 7).map((movie, index) => ({
    userId: friend2.id,
    movieId: movie.id,
    rating: Math.min(10, 6 + (index % 5)),
    review: 'Great watch with friends.',
    watchedDate: new Date(Date.now() - (index + 3) * 24 * 60 * 60 * 1000),
    isFavorite: index % 3 === 0,
  }));

  await Promise.all([
    ...friendRatings1.map((rating) => prisma.rating.create({ data: rating })),
    ...friendRatings2.map((rating) => prisma.rating.create({ data: rating })),
  ]);

  await Promise.all([
    prisma.watchlistItem.create({
      data: {
        userId: friend1.id,
        movieId: createdMovies[8].id,
        priority: 'high',
        status: 'watching',
        notes: 'Watch before weekend',
      },
    }),
    prisma.watchlistItem.create({
      data: {
        userId: friend2.id,
        movieId: createdMovies[9].id,
        priority: 'medium',
        status: 'planned',
        notes: 'Looks interesting',
      },
    }),
  ]);

  await Promise.all([
    prisma.friend.create({
      data: {
        userId: user.id,
        friendId: friend1.id,
        status: 'accepted',
      },
    }),
    prisma.friend.create({
      data: {
        userId: friend1.id,
        friendId: user.id,
        status: 'accepted',
      },
    }),
    prisma.friend.create({
      data: {
        userId: friend2.id,
        friendId: user.id,
        status: 'pending',
      },
    }),
  ]);

  console.log('✅ Seeded social graph, friend ratings, and activity data');
  console.log('\n🎬 Database seeding completed!');
  console.log(`\nSample user credentials:`);
  console.log(`  Email: demo@example.com`);
  console.log(`  Username: demo_user`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

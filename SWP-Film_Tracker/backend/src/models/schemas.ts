import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    displayName: String,
    avatar: String,
    bio: String,
    preferences: {
      favoriteGenres: [String],
      theme: { type: String, default: 'dark' },
      notifications: { type: Boolean, default: true },
    },
    statistics: {
      totalMoviesWatched: { type: Number, default: 0 },
      totalSeriesWatched: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      mostWatchedGenre: String,
    },
  },
  { timestamps: true }
);

// Movie Schema
const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    releaseDate: Date,
    type: { type: String, enum: ['movie', 'series'], required: true },
    genres: [String],
    director: String,
    cast: [String],
    poster: String,
    backdrop: String,
    runtime: Number,
    rating: Number,
    streamingPlatforms: [
      {
        platform: String,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

// Rating Schema
const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    rating: { type: Number, min: 1, max: 10, required: true },
    review: String,
    watchedDate: Date,
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Watchlist Schema
const watchlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    notes: String,
  },
  { timestamps: true }
);

// Friend Schema
const friendSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
    tasteMatch: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true }
);

// Export Models (would need to be instantiated with mongoose.model)
export const models = {
  User: 'User',
  Movie: 'Movie',
  Rating: 'Rating',
  Watchlist: 'Watchlist',
  Friend: 'Friend',
};

export { userSchema, movieSchema, ratingSchema, watchlistSchema, friendSchema };

// Type definitions for the Netflix Movie Tracker

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  preferences: UserPreferences;
  statistics: UserStatistics;
  createdAt: Date;
}

export interface UserPreferences {
  favoriteGenres: string[];
  theme: 'dark' | 'light';
  notifications: boolean;
}

export interface UserStatistics {
  totalMoviesWatched: number;
  totalSeriesWatched: number;
  averageRating: number;
  mostWatchedGenre?: string;
}

export interface Movie {
  id: string;
  tmdbId?: number;
  title: string;
  description: string;
  releaseDate: Date;
  type: 'movie' | 'series';
  genres: string[];
  director?: string;
  cast: string[];
  poster: string;
  backdrop: string;
  runtime?: number;
  rating: number;
  trailerUrl?: string | null;
  streamingPlatforms: StreamingPlatform[];
}

export interface Actor {
  id: number | string;
  name: string;
  character?: string;
  profilePath: string;
  knownForDepartment?: string;
}

export interface ActorProfile {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  placeOfBirth: string | null;
  knownForDepartment: string | null;
  popularity: number;
  profilePath: string;
  movies: Movie[];
}

export interface StreamingPlatform {
  platform: 'Netflix' | 'Prime Video' | 'Disney+' | 'Apple TV+' | 'HBO Max' | 'Hulu';
  url: string;
}

export interface Rating {
  id: string;
  userId: string;
  movieId: string;
  rating: number;
  review?: string;
  watchedDate: Date;
  isFavorite: boolean;
  createdAt: Date;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  movieId: string;
  priority: 'high' | 'medium' | 'low';
  status: 'planned' | 'watching' | 'watched';
  notes?: string;
  addedAt: Date;
  movie?: Movie;
}

export interface WatchlistSummary {
  total: number;
  high: number;
  medium: number;
  low: number;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  tasteMatch?: number;
  createdAt: Date;
}

export interface Recommendation {
  id: string;
  movieId: string;
  userId?: string;
  friendId?: string;
  reason: string;
  score: number;
  createdAt: Date;
}

export interface ActivityFeed {
  id: string;
  userId: string;
  action: string;
  movieId?: string;
  targetUserId?: string;
  timestamp: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  movieTmdbId?: number;
  movieTitle?: string;
  moviePoster?: string;
  readAt?: Date;
  createdAt: Date;
}

export interface Conversation {
  friendId: string;
  lastMessage?: Message;
  unreadCount: number;
}

export interface AnalyticsData {
  totalMoviesWatched: number;
  totalSeriesWatched: number;
  averageRating: number;
  monthlyStats: MonthlyData[];
  genreDistribution: GenreData[];
}

export interface MonthlyData {
  month: string;
  count: number;
}

export interface GenreData {
  genre: string;
  count: number;
}

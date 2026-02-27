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
  action: 'watched' | 'rated' | 'added_to_watchlist' | 'recommended';
  movieId: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface DashboardStats {
  totalWatched: number;
  totalMoviesWatched?: number;
  averageRating: number;
  genreDistribution: Record<string, number>;
  monthlyStats: MonthlyData[];
  topGenres: string[];
  favoriteGenres?: string[];
  streakDays?: number;
  watchlistCount?: number;
  friendsCount?: number;
  achievements?: string[];
}

export interface MonthlyData {
  month: string;
  count: number;
  averageRating: number;
}

export interface JointRecommendation {
  movieId: string;
  title: string;
  poster: string;
  mutualRaters: number;
  compatibilityScore: number;
}

export interface SocialFriend {
  id: string;
  relationId?: string;
  name: string;
  username: string;
  avatar?: string;
  tasteMatch: number;
  commonMovies: number;
  status: 'pending' | 'accepted' | 'blocked';
}

export interface SocialActivityItem {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  action: 'watched' | 'rated' | 'added_to_watchlist' | 'recommended';
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  rating?: number;
  timestamp: string | Date;
}

export interface FriendRequest {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string | Date;
}

export interface FriendSearchResult {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  relationStatus: 'none' | 'pending' | 'accepted' | 'blocked';
}

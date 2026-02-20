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
  notes?: string;
  addedAt: Date;
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
  averageRating: number;
  genreDistribution: Record<string, number>;
  monthlyStats: MonthlyData[];
  topGenres: string[];
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

import { create } from 'zustand';
import { User, Movie, Rating, WatchlistItem } from '../types';
import { authAPI, moviesAPI, ratingsAPI, watchlistAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user: user as User, token, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      throw error;
    }
  },

  register: async (email: string, username: string, displayName: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register({ email, username, displayName, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user: user as User, token, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
  
  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  
  setToken: (token: string) => {
    localStorage.setItem('token', token);
    set({ token });
  },
}));

interface MovieState {
  movies: Movie[];
  selectedMovie: Movie | null;
  isLoading: boolean;
  fetchMovies: () => Promise<void>;
  fetchMoviesByGenre: (genre: string) => Promise<void>;
  searchMovies: (query: string) => Promise<void>;
  setSelectedMovie: (movie: Movie | null) => void;
}

export const useMovieStore = create<MovieState>((set) => ({
  movies: [],
  selectedMovie: null,
  isLoading: false,
  
  fetchMovies: async () => {
    set({ isLoading: true });
    try {
      const response = await moviesAPI.getAll();
      const movies = Array.isArray(response.data) ? response.data : response.data?.data || [];
      set({ movies, isLoading: false });
    } catch (error) {
      console.error('Error fetching movies:', error);
      set({ isLoading: false });
    }
  },
  
  fetchMoviesByGenre: async (genre: string) => {
    set({ isLoading: true });
    try {
      const response = await moviesAPI.getByGenre(genre);
      const movies = Array.isArray(response.data) ? response.data : response.data?.data || [];
      set({ movies, isLoading: false });
    } catch (error) {
      console.error('Error fetching movies:', error);
      set({ isLoading: false });
    }
  },
  
  searchMovies: async (query: string) => {
    set({ isLoading: true });
    try {
      const response = await moviesAPI.search(query);
      const movies = Array.isArray(response.data) ? response.data : response.data?.data || [];
      set({ movies, isLoading: false });
    } catch (error) {
      console.error('Error fetching movies:', error);
      set({ isLoading: false });
    }
  },
  
  setSelectedMovie: (movie) => {
    set({ selectedMovie: movie });
  },
}));

interface RatingState {
  ratings: Rating[];
  isLoading: boolean;
  fetchUserRatings: () => Promise<void>;
  createRating: (movieId: string, rating: number, review?: string) => Promise<void>;
  deleteRating: (movieId: string) => Promise<void>;
}

export const useRatingStore = create<RatingState>((set) => ({
  ratings: [],
  isLoading: false,
  
  fetchUserRatings: async () => {
    set({ isLoading: true });
    try {
      const response = await ratingsAPI.getUserRatings();
      const ratings = Array.isArray(response.data) ? response.data : response.data?.data || [];
      set({ ratings, isLoading: false });
    } catch (error) {
      console.error('Error fetching ratings:', error);
      set({ isLoading: false });
    }
  },
  
  createRating: async (movieId: string, rating: number, review?: string) => {
    try {
      await ratingsAPI.create({ movieId, rating, review });
      // Refetch ratings
      const response = await ratingsAPI.getUserRatings();
      const ratings = Array.isArray(response.data) ? response.data : response.data?.data || [];
      set({ ratings });
    } catch (error) {
      console.error('Error creating rating:', error);
    }
  },
  
  deleteRating: async (movieId: string) => {
    try {
      await ratingsAPI.delete(movieId);
      // Refetch ratings
      const response = await ratingsAPI.getUserRatings();
      const ratings = Array.isArray(response.data) ? response.data : response.data?.data || [];
      set({ ratings });
    } catch (error) {
      console.error('Error deleting rating:', error);
    }
  },
}));

interface WatchlistState {
  items: WatchlistItem[];
  isLoading: boolean;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (movieId: string, priority?: string) => Promise<void>;
  removeFromWatchlist: (movieId: string) => Promise<void>;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  items: [],
  isLoading: false,
  
  fetchWatchlist: async () => {
    set({ isLoading: true });
    try {
      const response = await watchlistAPI.getAll();
      const items = Array.isArray(response.data) ? response.data : response.data?.data || [];
      set({ items, isLoading: false });
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      set({ isLoading: false });
    }
  },
  
  addToWatchlist: async (movieId: string, priority = 'medium') => {
    try {
      const response = await watchlistAPI.add({ movieId, priority: priority as any });
      set((state) => ({
        items: [...state.items, response.data],
      }));
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  },
  
  removeFromWatchlist: async (movieId: string) => {
    try {
      await watchlistAPI.remove(movieId);
      set((state) => ({
        items: state.items.filter((item) => item.movieId !== movieId),
      }));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  },
}));

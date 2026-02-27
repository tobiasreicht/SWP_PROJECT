import { create } from 'zustand';
import { User, Movie, Rating, WatchlistItem, WatchlistSummary } from '../types';
import { authAPI, moviesAPI, ratingsAPI, watchlistAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
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

  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      set({ user: null, token: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.getCurrentUser();
      const user = response.data as User;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isLoading: false });
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({
        user: storedUser ? JSON.parse(storedUser) : null,
        token: null,
        isLoading: false,
        error: error.response?.data?.error || error.message,
      });
    }
  },
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user: user as User, token, isLoading: false });
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
  summary: WatchlistSummary;
  isLoading: boolean;
  fetchWatchlist: (params?: { sortBy?: 'addedAt' | 'priority'; sortOrder?: 'asc' | 'desc' }) => Promise<void>;
  fetchWatchlistCount: () => Promise<void>;
  addToWatchlist: (movieId: string, priority?: string) => Promise<void>;
  updateWatchlistItem: (movieId: string, data: { priority?: 'high' | 'medium' | 'low'; status?: 'planned' | 'watching' | 'watched'; notes?: string }) => Promise<void>;
  removeFromWatchlist: (movieId: string) => Promise<void>;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  items: [],
  summary: {
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
  },
  isLoading: false,
  
  fetchWatchlist: async (params) => {
    set({ isLoading: true });
    try {
      const response = await watchlistAPI.getAll(params);
      const items = Array.isArray(response.data) ? response.data : response.data?.data || [];
      set({ items, isLoading: false });
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      set({ isLoading: false });
    }
  },

  fetchWatchlistCount: async () => {
    try {
      const response = await watchlistAPI.getCount();
      set({
        summary: {
          total: response.data?.total || 0,
          high: response.data?.high || 0,
          medium: response.data?.medium || 0,
          low: response.data?.low || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching watchlist count:', error);
    }
  },
  
  addToWatchlist: async (movieId: string, priority = 'medium') => {
    try {
      await watchlistAPI.add({ movieId, priority: priority as any, status: 'planned' });
      await useWatchlistStore.getState().fetchWatchlist();
      await useWatchlistStore.getState().fetchWatchlistCount();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || '';
      if (errorMessage === 'Already in watchlist') {
        await useWatchlistStore.getState().fetchWatchlist();
        await useWatchlistStore.getState().fetchWatchlistCount();
        return;
      }

      console.error('Error adding to watchlist:', error);
    }
  },

  updateWatchlistItem: async (movieId: string, data) => {
    try {
      await watchlistAPI.update(movieId, data);
      await useWatchlistStore.getState().fetchWatchlist();
      await useWatchlistStore.getState().fetchWatchlistCount();
    } catch (error) {
      console.error('Error updating watchlist item:', error);
    }
  },
  
  removeFromWatchlist: async (movieId: string) => {
    try {
      await watchlistAPI.remove(movieId);
      set((state) => ({
        items: state.items.filter((item) => item.movieId !== movieId),
      }));
      await useWatchlistStore.getState().fetchWatchlistCount();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  },
}));

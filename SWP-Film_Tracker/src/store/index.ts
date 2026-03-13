import { create } from 'zustand';
import { User, Movie, Rating, WatchlistItem, WatchlistSummary, MessageAttachmentMovie } from '../types';
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

interface MessengerState {
  isOpen: boolean;
  selectedFriendId: string | null;
  sharedMovie: MessageAttachmentMovie | null;
  openMessenger: (data?: { friendId?: string; movie?: MessageAttachmentMovie }) => void;
  closeMessenger: () => void;
  setSelectedFriendId: (friendId: string | null) => void;
  setSharedMovie: (movie: MessageAttachmentMovie | null) => void;
}

export const useMessengerStore = create<MessengerState>((set) => ({
  isOpen: false,
  selectedFriendId: null,
  sharedMovie: null,

  openMessenger: (data) =>
    set({
      isOpen: true,
      selectedFriendId: data?.friendId || null,
      sharedMovie: data?.movie || null,
    }),

  closeMessenger: () =>
    set({
      isOpen: false,
      selectedFriendId: null,
      sharedMovie: null,
    }),

  setSelectedFriendId: (friendId) => set({ selectedFriendId: friendId }),
  setSharedMovie: (sharedMovie) => set({ sharedMovie }),
}));

// ─── Settings Store ────────────────────────────────────────────────────────

export interface SettingsNotifications {
  friendRequests: boolean;
  newReleases: boolean;
  friendActivity: boolean;
  weeklyDigest: boolean;
}

export interface SettingsPrivacy {
  profileVisibility: 'public' | 'friends' | 'private';
  showWatchlist: boolean;
  showRatings: boolean;
  showActivity: boolean;
  allowFriendRequests: boolean;
}

export interface SettingsContent {
  defaultType: 'all' | 'movies' | 'series';
  defaultSort: 'addedAt' | 'rating' | 'title';
  itemsPerPage: 10 | 20 | 50;
}

interface SettingsState {
  theme: 'dark' | 'light';
  notifications: SettingsNotifications;
  privacy: SettingsPrivacy;
  content: SettingsContent;
  setTheme: (theme: 'dark' | 'light') => void;
  setNotification: (key: keyof SettingsNotifications, value: boolean) => void;
  setPrivacy: (key: keyof SettingsPrivacy, value: any) => void;
  setContent: (key: keyof SettingsContent, value: any) => void;
}

const SETTINGS_STORAGE_KEY = 'film-tracker-settings';

const DEFAULT_SETTINGS: Omit<SettingsState, 'setTheme' | 'setNotification' | 'setPrivacy' | 'setContent'> = {
  theme: 'dark',
  notifications: {
    friendRequests: true,
    newReleases: true,
    friendActivity: false,
    weeklyDigest: false,
  },
  privacy: {
    profileVisibility: 'public',
    showWatchlist: true,
    showRatings: true,
    showActivity: true,
    allowFriendRequests: true,
  },
  content: {
    defaultType: 'all',
    defaultSort: 'addedAt',
    itemsPerPage: 20,
  },
};

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
        notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
        privacy: { ...DEFAULT_SETTINGS.privacy, ...parsed.privacy },
        content: { ...DEFAULT_SETTINGS.content, ...parsed.content },
      };
    }
  } catch {}
  return DEFAULT_SETTINGS;
};

const persistSettings = (state: SettingsState) => {
  const { setTheme, setNotification, setPrivacy, setContent, ...data } = state;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...loadSettings(),

  setTheme: (theme) =>
    set((state) => {
      const next = { ...state, theme };
      persistSettings(next);
      return { theme };
    }),

  setNotification: (key, value) =>
    set((state) => {
      const notifications = { ...state.notifications, [key]: value };
      persistSettings({ ...state, notifications });
      return { notifications };
    }),

  setPrivacy: (key, value) =>
    set((state) => {
      const privacy = { ...state.privacy, [key]: value };
      persistSettings({ ...state, privacy });
      return { privacy };
    }),

  setContent: (key, value) =>
    set((state) => {
      const content = { ...state.content, [key]: value };
      persistSettings({ ...state, content });
      return { content };
    }),
}));

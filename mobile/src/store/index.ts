import { create } from 'zustand';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
      throw error;
    }
  },

  register: async (email: string, username: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register({ email, username, password, displayName });
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Registration failed', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user'),
      ]);
      set({ user: null, token: null, error: null });
    }
  },

  initializeAuth: async () => {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user });
        
        // Fetch fresh user data
        try {
          const response = await authAPI.getCurrentUser();
          set({ user: response.data });
        } catch (error) {
          console.error('Failed to fetch current user:', error);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  },

  clearError: () => set({ error: null }),
}));

// Settings Store
interface SettingsStore {
  theme: 'dark' | 'light';
  notifications: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  setNotifications: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'dark',
  notifications: true,
  setTheme: (theme) => set({ theme }),
  setNotifications: (notifications) => set({ notifications }),
}));

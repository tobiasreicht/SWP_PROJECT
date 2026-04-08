import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // On physical devices, localhost points to the phone itself.
  // Derive the dev machine IP from Expo host URI and target backend port 5001.
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2
      ?.extra?.expoClient?.hostUri ||
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ||
    '';

  const host = hostUri.split(':')[0];
  if (host) {
    return `http://${host}:5001/api`;
  }

  return 'http://127.0.0.1:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      void Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user'),
      ]);
    }
    return Promise.reject(error);
  }
);

// ============ Authentication ============
export const authAPI = {
  register: (data: { email: string; username: string; password: string; displayName: string }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  getCurrentUser: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data),
};

// ============ Movies ============
export const moviesAPI = {
  getAll: (page = 1, limit = 20) =>
    apiClient.get('/movies', { params: { page, limit } }),
  getById: (id: string) => apiClient.get(`/movies/${id}`),
  getCast: (id: string, limit = 20) => apiClient.get(`/movies/${id}/cast`, { params: { limit } }),
  getSeriesSeason: (id: string, seasonNumber: number) => apiClient.get(`/movies/${id}/seasons/${seasonNumber}`),
  search: (query: string) =>
    apiClient.get('/movies/search', { params: { q: query } }),
  searchActors: (query: string) =>
    apiClient.get('/movies/actors/search', { params: { q: query } }),
  getActorProfile: (actorId: string) =>
    apiClient.get(`/movies/actors/${actorId}`),
  getByGenre: (genre: string) =>
    apiClient.get(`/movies/genre/${genre}`),
  getTrending: () => apiClient.get('/movies/trending'),
  getNewReleases: () => apiClient.get('/movies/new'),
};

// ============ Recommendations ============
export const recommendationsAPI = {
  getPersonal: (limit = 10) =>
    apiClient.get('/recommendations/personal', { params: { limit } }),
  getTasteMatch: (friendId: string) =>
    apiClient.get(`/recommendations/taste-match/${friendId}`),
  getJoint: (friendId: string) =>
    apiClient.get(`/recommendations/joint/${friendId}`),
  getFriendsRecommendations: () =>
    apiClient.get('/recommendations/friends'),
};

// ============ Ratings ============
export const ratingsAPI = {
  getUserRatings: () => apiClient.get('/ratings'),
  create: (data: { movieId: string; rating: number; review?: string }) =>
    apiClient.post('/ratings', data),
  delete: (movieId: string) => apiClient.delete(`/ratings/${movieId}`),
  getFavorites: () => apiClient.get('/ratings/favorites'),
};

// ============ Watchlist ============
export const watchlistAPI = {
  getAll: (params?: { sortBy?: 'addedAt' | 'priority'; sortOrder?: 'asc' | 'desc' }) =>
    apiClient.get('/watchlist', { params }),
  add: (data: { movieId: string; priority?: string; status?: 'planned' | 'watching' | 'watched' }) =>
    apiClient.post('/watchlist', data),
  update: (movieId: string, data: { priority?: 'high' | 'medium' | 'low'; status?: 'planned' | 'watching' | 'watched'; notes?: string }) =>
    apiClient.patch(`/watchlist/${movieId}`, data),
  remove: (movieId: string) => apiClient.delete(`/watchlist/${movieId}`),
  getCount: () => apiClient.get('/watchlist/count'),
};

// ============ Friends & Social ============
export const friendsAPI = {
  getAll: () => apiClient.get('/friends'),
  getProfile: (friendId: string) => apiClient.get(`/friends/profile/${friendId}`),
  search: (query: string) => apiClient.get('/friends/search', { params: { q: query } }),
  add: (data: { friendId?: string; identifier?: string }) =>
    apiClient.post('/friends/add', data),
  getRequests: () => apiClient.get('/friends/requests'),
  acceptRequest: (requestId: string) => apiClient.put(`/friends/${requestId}/accept`),
  remove: (friendId: string) => apiClient.delete(`/friends/${friendId}`),
  getActivity: () => apiClient.get('/friends/activity'),
  getCommonMovies: (friendId: string) => apiClient.get(`/friends/common/${friendId}`),
};

// ============ Messages ============
export const messagesAPI = {
  getInbox: () => apiClient.get('/messages/inbox'),
  markInboxRead: (data?: { senderId?: string }) => apiClient.post('/messages/inbox/read', data || {}),
  getConversation: (friendId: string) => apiClient.get(`/messages/${friendId}`),
  send: (
    friendId: string,
    data: { text?: string; movieTmdbId?: number; movieTitle?: string; moviePoster?: string }
  ) => apiClient.post(`/messages/${friendId}`, data),
};

// ============ Users ============
export const usersAPI = {
  getProfile: (userId: string) => apiClient.get(`/users/${userId}`),
  getStatistics: (userId: string) => apiClient.get(`/users/${userId}/statistics`),
  updateProfile: (userId: string, data: any) => apiClient.put(`/users/${userId}`, data),
  deleteAccount: (userId: string) => apiClient.delete(`/users/${userId}`),
};

// ============ Analytics ============
export const analyticsAPI = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getGenreDistribution: () =>
    apiClient.get('/analytics/genres'),
  getMonthlyStats: (months = 12) =>
    apiClient.get('/analytics/monthly', { params: { months } }),
};

export default apiClient;

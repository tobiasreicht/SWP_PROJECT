import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // attach read-only API token from env for read endpoints
    ...(import.meta.env.VITE_MOVIE_READ_TOKEN ? { 'x-api-token': import.meta.env.VITE_MOVIE_READ_TOKEN } : {}),
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || '');
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
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
};

// ============ Movies ============
export const moviesAPI = {
  getAll: (page = 1, limit = 20) =>
    apiClient.get('/movies', { params: { page, limit } }),
  getById: (id: string) => apiClient.get(`/movies/${id}`),
  search: (query: string) =>
    apiClient.get('/movies/search', { params: { q: query } }),
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
  search: (query: string) => apiClient.get('/friends/search', { params: { q: query } }),
  add: (data: { friendId?: string; identifier?: string }) =>
    apiClient.post('/friends/add', data),
  getRequests: () => apiClient.get('/friends/requests'),
  acceptRequest: (requestId: string) => apiClient.put(`/friends/${requestId}/accept`),
  remove: (friendId: string) => apiClient.delete(`/friends/${friendId}`),
  getActivity: () => apiClient.get('/friends/activity'),
  getCommonMovies: (friendId: string) => apiClient.get(`/friends/common/${friendId}`),
};

// ============ Users ============
export const usersAPI = {
  getProfile: (userId: string) => apiClient.get(`/users/${userId}`),
  getStatistics: (userId: string) => apiClient.get(`/users/${userId}/statistics`),
  updateProfile: (userId: string, data: any) => apiClient.put(`/users/${userId}`, data),
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

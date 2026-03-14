import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const TOKEN_KEY = 'mic_trades_access_token';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const auth = {
  register: (data) => api.post('/api/auth/register', data),

  login: async (data) => {
    const response = await api.post('/api/auth/login', data);
    if (response.data?.access_token) {
      setAuthToken(response.data.access_token);
    }
    return response;
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      clearAuthToken();
    }
  },

  getMe: () => api.get('/api/auth/me'),
};

export const rates = {
  getAll: () => api.get('/api/rates'),
};

export const markets = {
  getAll: () => api.get('/api/markets'),
};

export const trades = {
  create: (data) => api.post('/api/trades/create', data),
  getAll: () => api.get('/api/trades'),
  getById: (id) => api.get(`/api/trades/${id}`),
};

export const user = {
  getProfile: () => api.get('/api/user/profile'),
  getStats: () => api.get('/api/user/stats'),
  updatePaymentInfo: (data) => api.put('/api/user/payment-info', data),
  getPaymentMethods: () => api.get('/api/user/payment-methods'),
  createPaymentMethod: (data) => api.post('/api/user/payment-methods', data),
  deletePaymentMethod: (id) => api.delete(`/api/user/payment-methods/${id}`),
  changePassword: (data) => api.put('/api/user/change-password', data),
};

export const support = {
  createTicket: (data) => api.post('/api/support/tickets', data),
  getTickets: () => api.get('/api/support/tickets'),
  getTicketDetails: (id) => api.get(`/api/support/tickets/${id}`),
  replyToTicket: (id, data) => api.post(`/api/support/tickets/${id}/reply`, data),
};

export const admin = {
  getTrades: (status) => api.get('/api/admin/trades', { params: { status } }),
  approveTrade: (id) => api.put(`/api/admin/trades/${id}/approve`),
  cancelTrade: (id) => api.put(`/api/admin/trades/${id}/cancel`),
  updateRates: (data) => api.put('/api/admin/rates', data),
  getUsers: () => api.get('/api/admin/users'),
  getStats: () => api.get('/api/admin/stats'),
  getTickets: () => api.get('/api/admin/tickets'),
  getTicketDetails: (id) => api.get(`/api/admin/tickets/${id}`),
  replyToTicket: (id, data) => api.post(`/api/support/tickets/${id}/reply`, data),
  closeTicket: (id) => api.put(`/api/admin/tickets/${id}/close`),
};

export default api;

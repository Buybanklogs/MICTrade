import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const auth = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
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

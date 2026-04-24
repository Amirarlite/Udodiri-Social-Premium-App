import axios from 'axios';
import { getAuthToken } from '../config/aws';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://PLACEHOLDER_API.execute-api.us-east-1.amazonaws.com/prod';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
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
      // Token expired or invalid - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/register', { email, password, name }),
  
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  verify: () =>
    apiClient.get('/auth/verify'),
  
  logout: () =>
    apiClient.post('/auth/logout'),
};

export const meetingsApi = {
  list: () =>
    apiClient.get('/meeting-minutes'),
  
  create: (data: { title: string; attendees: string[]; googleDocId?: string; googleDocUrl?: string }) =>
    apiClient.post('/meeting-minutes', data),
  
  get: (id: string) =>
    apiClient.get(`/meeting-minutes/${id}`),
  
  update: (id: string, data: any) =>
    apiClient.patch(`/meeting-minutes/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete(`/meeting-minutes/${id}`),
  
  addActionItem: (meetingId: string, data: { description: string; responsiblePerson: string; dueDate: string }) =>
    apiClient.post(`/meeting-minutes/${meetingId}/action-items`, data),
};

export const announcementsApi = {
  list: () =>
    apiClient.get('/announcements'),
  
  create: (data: { title: string; content: string; recipients?: string[] }) =>
    apiClient.post('/announcements', data),
  
  send: (announcementId: string, method: string) =>
    apiClient.post('/announcements/send', { announcementId, method }),
};

export const calendarApi = {
  list: () =>
    apiClient.get('/calendar'),
  
  create: (data: { title: string; startDate: string; endDate: string; location?: string; description?: string; attendees?: string[] }) =>
    apiClient.post('/calendar', data),
  
  get: (id: string) =>
    apiClient.get(`/calendar/${id}`),
  
  update: (id: string, data: any) =>
    apiClient.patch(`/calendar/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete(`/calendar/${id}`),
};

export const financialsApi = {
  list: () =>
    apiClient.get('/financials'),
  
  record: (data: { title: string; amount: number; type: string; userId?: string; paymentReference?: string }) =>
    apiClient.post('/financials', data),
  
  query: (params: { startDate?: string; endDate?: string; type?: string }) =>
    apiClient.get('/financials/transactions', { params }),
  
  verifyPayment: (reference: string, gateway: string) =>
    apiClient.post('/financials/verify-payment', { reference, gateway }),
};

export const subscriptionsApi = {
  get: () =>
    apiClient.get('/subscriptions'),
  
  createOrUpdate: (data: { tier: string; startDate: string; endDate: string; paymentReference?: string; paymentGateway?: string }) =>
    apiClient.post('/subscriptions', data),
  
  upgradeToPremium: (paymentGateway: string) =>
    apiClient.post('/subscriptions/premium', { paymentGateway }),
  
  verifyPayment: (reference: string, gateway: string) =>
    apiClient.post('/subscriptions/verify', { reference, gateway }),
};

export default apiClient;
